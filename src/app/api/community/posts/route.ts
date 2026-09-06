import { isAdminEmail, requireVerifiedUser } from "@/shared/lib/auth/guards";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { createClient } from "@/shared/lib/supabase/server";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextRequest, NextResponse } from "next/server";

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data, error, count } = await supabase
      .from("posts")
      // Join with user_profiles if needed, but for now just raw or simple join
      .select(
        `
        *,
        user:user_profiles!user_id (email),
        comments (
            *,
            user:user_profiles!user_id (email)
        )
    `,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return supabaseErrorResponse(error);
    return NextResponse.json({ data, count });
  } catch (error) {
    return unexpectedErrorResponse("api/community/posts", error);
  }
}

type PostInput =
  | { ok: true; title: string; content: string; wantsNotice: boolean }
  | { ok: false; error: string };

function parsePostInput(body: unknown): PostInput {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  }
  const raw = body as Record<string, unknown>;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const content = typeof raw.content === "string" ? raw.content.trim() : "";

  if (!title) return { ok: false, error: "제목을 입력해주세요." };
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `제목은 ${MAX_TITLE_LENGTH}자 이내로 입력해주세요.`,
    };
  }
  if (!content) return { ok: false, error: "내용을 입력해주세요." };
  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      ok: false,
      error: `내용은 ${MAX_CONTENT_LENGTH}자 이내로 입력해주세요.`,
    };
  }

  return { ok: true, title, content, wantsNotice: raw.isNotice === true };
}

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser();
  if (!guard.ok) return guard.response;
  const { user, supabase } = guard;

  try {
    const input = parsePostInput(await request.json().catch(() => null));
    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    // 공지 여부는 요청 본문이 아니라 관리자 여부로 결정한다. 이전에는 누구나
    // `isNotice: true` 를 보내 "입금 계좌 변경 안내" 같은 가짜 공지를 올릴 수 있었다.
    const isNotice =
      input.wantsNotice && !!user.email && (await isAdminEmail(user.email));

    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content,
        is_notice: isNotice,
      })
      .select()
      .single();

    if (error) throw error;

    // Grant XP (10 XP) — add_xp 는 service_role 로만 호출한다.
    await createAdminClient().rpc("add_xp", {
      user_uuid: user.id,
      xp_to_add: 10,
    });

    return NextResponse.json({ data });
  } catch (err) {
    return unexpectedErrorResponse("api/community/posts", err);
  }
}
