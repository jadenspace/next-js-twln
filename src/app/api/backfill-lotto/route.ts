import { lottoApi, transformLottoData } from "@/features/lotto/api/lotto-api";
import { isAuthorizedCron } from "@/shared/lib/auth/cron";
import { requireAdmin } from "@/shared/lib/auth/guards";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 과거 회차 백필.
 *
 * - 관리자 세션(브라우저에서 URL 접속) 또는 `Authorization: Bearer <CRON_SECRET>`
 *   중 하나가 있어야 실행된다. 이전에는 인증이 없어 누구나 외부 API 를 수천 번
 *   호출시키고 service_role 로 lotto_draws 를 덮어쓸 수 있었다.
 * - 회차 상한을 하드코딩하지 않는다(이전 값 1205 는 2026년 기준으로 한참 지난
 *   회차였다). 동행복권 API 가 데이터를 돌려주지 않는 회차에서 멈춘다.
 * - 한 번에 `count` 회차(기본 50, 최대 200)만 처리한다. 서버리스 함수 시간 한도
 *   안에서 끝내고, 다음 호출은 마지막 저장 회차 + 1 부터 자동으로 이어진다.
 */
export const maxDuration = 300;

const DEFAULT_COUNT = 50;
const MAX_COUNT = 200;
const DELAY_MS = 500; // 외부 API 부담을 줄이기 위한 요청 간 지연

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getLatestDrawNo = async (): Promise<number> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lotto_draws")
    .select("drw_no")
    .order("drw_no", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to get latest draw number:", error);
    return 0;
  }

  return data?.drw_no || 0;
};

const saveLottoDraw = async (
  drawData: ReturnType<typeof transformLottoData>,
) => {
  const supabase = createAdminClient();
  const { error } = await supabase.from("lotto_draws").upsert(drawData);

  if (error) {
    console.error("Failed to save lotto draw:", error);
    throw new Error(error.message);
  }
};

type BackfillParams =
  | { ok: true; startFrom: number | null; count: number }
  | { ok: false; error: string };

function parseBackfillParams(searchParams: URLSearchParams): BackfillParams {
  let startFrom: number | null = null;
  const startFromQuery = searchParams.get("start_from");
  if (startFromQuery !== null) {
    const parsed = Number(startFromQuery);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return {
        ok: false,
        error: "'start_from' must be a positive integer.",
      };
    }
    startFrom = parsed;
  }

  let count = DEFAULT_COUNT;
  const countQuery = searchParams.get("count");
  if (countQuery !== null) {
    const parsed = Number(countQuery);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { ok: false, error: "'count' must be a positive integer." };
    }
    count = Math.min(parsed, MAX_COUNT);
  }

  return { ok: true, startFrom, count };
}

export async function GET(request: NextRequest) {
  const authorized =
    isAuthorizedCron(request) || (await requireAdmin()).ok === true;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = parseBackfillParams(request.nextUrl.searchParams);
  if (!params.ok) {
    return NextResponse.json({ error: params.error }, { status: 400 });
  }

  const { count } = params;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (line: string) =>
        controller.enqueue(encoder.encode(`${line}\n`));

      let startFrom: number;
      if (params.startFrom !== null) {
        startFrom = params.startFrom;
        enqueue(`Starting backfill from specified draw number: #${startFrom}`);
      } else {
        const latestSavedDrawNo = await getLatestDrawNo();
        startFrom = latestSavedDrawNo > 0 ? latestSavedDrawNo + 1 : 1;
        enqueue(`Starting from last saved draw + 1: #${startFrom}`);
      }

      const endExclusive = startFrom + count;
      enqueue(
        `Processing up to ${count} draws (#${startFrom}~#${endExclusive - 1}), ${DELAY_MS}ms apart. Stops at the first unpublished draw.`,
      );

      let saved = 0;
      let lastSaved: number | null = null;

      for (let drawNo = startFrom; drawNo < endExclusive; drawNo++) {
        try {
          const rawData = await lottoApi.fetchLottoDraw(drawNo);

          if (!rawData || !(rawData.ltEpsd > 0)) {
            enqueue(
              `[STOP] Draw #${drawNo} is not published yet (or the API returned nothing).`,
            );
            break;
          }

          await saveLottoDraw(transformLottoData(rawData));
          saved++;
          lastSaved = drawNo;
          enqueue(`[SUCCESS] Draw #${drawNo} saved.`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          enqueue(`[ERROR] Draw #${drawNo}: ${message}`);
        }

        if (drawNo + 1 < endExclusive) {
          await sleep(DELAY_MS);
        }
      }

      enqueue(
        saved > 0
          ? `Done. Saved ${saved} draws (last: #${lastSaved}). Call again to continue from #${(lastSaved ?? startFrom) + 1}.`
          : "Done. Nothing new to save.",
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
