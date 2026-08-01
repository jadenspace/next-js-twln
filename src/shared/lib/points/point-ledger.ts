import { createAdminClient } from "@/shared/lib/supabase/admin";

/**
 * 포인트 원장 조작.
 *
 * 기존 구현은 잔액을 읽고(SELECT) 애플리케이션에서 계산한 뒤 절대값으로
 * 덮어쓰는(UPDATE) 방식이라, 동시 요청이 서로의 결과를 지웠다. 잔액 1000P 인
 * 사용자가 1000P 차감 요청을 동시에 N 개 보내면 모두 통과했다.
 *
 * 여기서는 읽은 잔액을 UPDATE 의 WHERE 절에 포함하는 compare-and-swap 으로
 * 처리한다. 갱신된 행이 0개면 그 사이 다른 요청이 잔액을 바꾼 것이므로
 * 다시 읽고 재시도한다. Postgres 의 행 잠금 덕분에 동시 요청 중 하나만 성공한다.
 *
 * 더 근본적인 해법은 SQL 함수 안에서 `UPDATE ... WHERE balance >= amount` 로
 * 처리하는 것이다. 저장소에 기존 함수 정의가 없어 여기서는 애플리케이션 계층으로
 * 해결한다.
 */

const MAX_CAS_RETRIES = 5;

export type PointAdjustment = {
  userId: string;
  /** 양수면 적립, 음수면 차감. */
  delta: number;
  transactionType: "charge" | "use" | "bonus" | "refund";
  description: string;
  featureType?: string;
  referenceId?: string;
};

export type PointLedgerResult =
  | { ok: true; balance: number }
  | {
      ok: false;
      reason: "insufficient" | "conflict" | "error";
      message: string;
    };

/** 현재 잔액. 원장이 없으면 0. */
export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await createAdminClient()
    .from("user_points")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data?.balance ?? 0;
}

export async function adjustPoints(
  adjustment: PointAdjustment,
): Promise<PointLedgerResult> {
  const { userId, delta, transactionType, description } = adjustment;

  if (!Number.isInteger(delta) || delta === 0) {
    return {
      ok: false,
      reason: "error",
      message: "delta must be a non-zero integer",
    };
  }

  const supabase = createAdminClient();

  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const { data: current, error: readError } = await supabase
      .from("user_points")
      .select("balance, total_earned, total_spent")
      .eq("user_id", userId)
      .maybeSingle();

    if (readError) {
      return { ok: false, reason: "error", message: readError.message };
    }

    // 원장이 아직 없는 사용자.
    if (!current) {
      if (delta < 0) {
        return {
          ok: false,
          reason: "insufficient",
          message: "포인트가 부족합니다.",
        };
      }

      const { error: insertError } = await supabase.from("user_points").insert({
        user_id: userId,
        balance: delta,
        total_earned: delta,
        total_spent: 0,
        updated_at: new Date().toISOString(),
      });

      // 그 사이 다른 요청이 행을 만들었으면(고유 제약 위반) 다시 읽는다.
      if (insertError) {
        if (insertError.code === "23505") continue;
        return { ok: false, reason: "error", message: insertError.message };
      }

      await recordTransaction(supabase, adjustment, delta);
      return { ok: true, balance: delta };
    }

    const currentBalance = current.balance ?? 0;
    const nextBalance = currentBalance + delta;

    if (nextBalance < 0) {
      return {
        ok: false,
        reason: "insufficient",
        message: "포인트가 부족합니다.",
      };
    }

    // compare-and-swap: 읽은 잔액이 그대로일 때만 갱신된다.
    const { data: updated, error: updateError } = await supabase
      .from("user_points")
      .update({
        balance: nextBalance,
        total_earned:
          delta > 0
            ? (current.total_earned ?? 0) + delta
            : (current.total_earned ?? 0),
        total_spent:
          delta < 0
            ? (current.total_spent ?? 0) - delta
            : (current.total_spent ?? 0),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("balance", currentBalance)
      .select("balance");

    if (updateError) {
      return { ok: false, reason: "error", message: updateError.message };
    }

    // 경합에서 밀렸다. 잔액을 다시 읽고 재시도.
    if (!updated || updated.length === 0) continue;

    await recordTransaction(supabase, adjustment, nextBalance);
    return { ok: true, balance: nextBalance };
  }

  console.error("[point-ledger] CAS 재시도 한도 초과", {
    userId,
    delta,
    transactionType,
    description,
  });

  return {
    ok: false,
    reason: "conflict",
    message: "포인트 처리가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
  };
}

async function recordTransaction(
  supabase: ReturnType<typeof createAdminClient>,
  adjustment: PointAdjustment,
  balanceAfter: number,
): Promise<void> {
  const row = {
    user_id: adjustment.userId,
    transaction_type: adjustment.transactionType,
    amount: adjustment.delta,
    balance_after: balanceAfter,
    description: adjustment.description,
    feature_type: adjustment.featureType ?? null,
    reference_id: adjustment.referenceId ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("point_transactions").insert(row);
  if (!error) return;

  // 이전 구현에는 feature_type 을 "디버깅을 위해 임시 비활성화" 해 둔 흔적이
  // 있었다. 이 컬럼의 제약 때문에 실패하는 경우라면, 이력 자체를 잃는 것보다는
  // feature_type 없이라도 남기는 편이 낫다.
  if (row.feature_type !== null) {
    const { error: retryError } = await supabase
      .from("point_transactions")
      .insert({ ...row, feature_type: null });

    if (!retryError) {
      console.warn(
        "[point-ledger] feature_type 없이 이력 저장됨. point_transactions.feature_type 제약을 확인하십시오.",
        { featureType: row.feature_type, error },
      );
      return;
    }
  }

  // 잔액 변경은 이미 확정됐다. 이력 저장 실패로 요청을 되돌리면 오히려
  // 잔액과 이력이 더 어긋나므로, 기록만 남기고 진행한다.
  console.error("[point-ledger] 거래 이력 저장 실패", {
    userId: adjustment.userId,
    delta: adjustment.delta,
    balanceAfter,
    error,
  });
}
