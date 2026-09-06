import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test-utils/supabase-mock";

const adminMock = createSupabaseMock({
  tables: { lotto_draws: { data: null, error: { code: "PGRST116" } } },
});

vi.mock("@/shared/lib/supabase/admin", () => ({
  createAdminClient: () => adminMock.client,
}));

vi.mock("@/features/lotto/api/lotto-api", () => ({
  lottoApi: { fetchLottoDraw: vi.fn(async () => null) },
  transformLottoData: vi.fn(),
}));

import { GET } from "./route";

const request = (authorization?: string) =>
  new NextRequest("http://localhost/api/cron/update-lotto", {
    headers: authorization ? { authorization } : {},
  });

describe("GET /api/cron/update-lotto", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  it("Authorization 헤더가 없으면 401 을 반환한다", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
  });

  it("잘못된 토큰이면 401 을 반환한다", async () => {
    const res = await GET(request("Bearer nope"));
    expect(res.status).toBe(401);
  });

  it("올바른 CRON_SECRET 이면 인증을 통과해 본 처리로 진입한다", async () => {
    // DB 가 비어 있으므로 본 처리는 400("backfill 먼저") 으로 응답한다.
    // 401 이 아니라는 사실이 인증 통과를 증명한다.
    const res = await GET(request("Bearer test-secret"));
    expect(res.status).toBe(400);
  });
});
