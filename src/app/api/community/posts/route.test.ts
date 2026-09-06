import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, findCallArg } from "@/test-utils/supabase-mock";

let isAdmin = false;
let serverMock = createSupabaseMock();
const adminMock = createSupabaseMock();

vi.mock("@/shared/lib/auth/guards", () => ({
  requireVerifiedUser: async () => ({
    ok: true,
    user: { id: "user-1", email: "u@example.com" },
    supabase: serverMock.client,
  }),
  isAdminEmail: async () => isAdmin,
}));

vi.mock("@/shared/lib/supabase/admin", () => ({
  createAdminClient: () => adminMock.client,
}));

import { POST } from "./route";

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/community/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/community/posts", () => {
  beforeEach(() => {
    isAdmin = false;
    serverMock = createSupabaseMock({
      tables: { posts: { data: { id: "p1" }, error: null } },
    });
  });

  it("일반 사용자가 isNotice=true 를 보내도 공지로 저장되지 않는다", async () => {
    const res = await post({ title: "제목", content: "내용", isNotice: true });
    expect(res.status).toBe(200);
    const inserted = findCallArg(serverMock.calls, "posts", "insert") as {
      is_notice: boolean;
    };
    expect(inserted.is_notice).toBe(false);
  });

  it("관리자가 isNotice=true 를 보내면 공지로 저장된다", async () => {
    isAdmin = true;
    const res = await post({ title: "공지", content: "내용", isNotice: true });
    expect(res.status).toBe(200);
    const inserted = findCallArg(serverMock.calls, "posts", "insert") as {
      is_notice: boolean;
    };
    expect(inserted.is_notice).toBe(true);
  });

  it("제목이 비어 있으면 400", async () => {
    const res = await post({ title: "   ", content: "내용" });
    expect(res.status).toBe(400);
  });

  it("제목이 100자를 넘으면 400", async () => {
    const res = await post({ title: "a".repeat(101), content: "내용" });
    expect(res.status).toBe(400);
  });

  it("본문이 5000자를 넘으면 400", async () => {
    const res = await post({ title: "제목", content: "a".repeat(5001) });
    expect(res.status).toBe(400);
  });

  it("제목과 본문은 trim 되어 저장된다", async () => {
    await post({ title: "  제목  ", content: "  내용  " });
    const inserted = findCallArg(serverMock.calls, "posts", "insert") as {
      title: string;
      content: string;
    };
    expect(inserted.title).toBe("제목");
    expect(inserted.content).toBe("내용");
  });
});
