import { requireUser } from "@/shared/lib/auth/guards";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const { user, supabase } = guard;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // 본인 소유 행만 삭제한다. 삭제된 행이 없으면(타인 소유 또는 존재하지 않음)
    // 성공으로 위장하지 않고 404 를 돌려준다.
    const { data, error } = await supabase
      .from("saved_lotto_numbers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "저장된 번호를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return unexpectedErrorResponse("api/lotto/saved-numbers/[id]", err);
  }
}
