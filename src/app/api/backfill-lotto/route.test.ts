import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test-utils/supabase-mock";

const adminMock = createSupabaseMock({
  tables: { lotto_draws: { data: { drw_no: 1200 }, error: null } },
});

const requireAdminMock = vi.fn();

vi.mock("@/shared/lib/supabase/admin", () => ({
  createAdminClient: () => adminMock.client,
}));

vi.mock("@/shared/lib/auth/guards", () => ({
  requireAdmin: () => requireAdminMock(),
}));

const fetchLottoDraw = vi.fn<
  (drawNo: number) => Promise<{ ltEpsd: number } | null>
>(async () => null);
vi.mock("@/features/lotto/api/lotto-api", () => ({
  lottoApi: { fetchLottoDraw: (n: number) => fetchLottoDraw(n) },
  transformLottoData: vi.fn(),
}));

import { GET } from "./route";

const request = (query = "", authorization?: string) =>
  new NextRequest(`http://localhost/api/backfill-lotto${query}`, {
    headers: authorization ? { authorization } : {},
  });

const deny = () => ({
  ok: false as const,
  response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
});

describe("GET /api/backfill-lotto", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    requireAdminMock.mockReset();
    fetchLottoDraw.mockClear();
  });

  it("관리자 세션도 CRON_SECRET 도 없으면 401 을 반환한다", async () => {
    requireAdminMock.mockResolvedValue(deny());
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(fetchLottoDraw).not.toHaveBeenCalled();
  });

  it("CRON_SECRET 이 맞으면 관리자 세션 없이도 실행된다", async () => {
    requireAdminMock.mockResolvedValue(deny());
    const res = await GET(request("?count=1", "Bearer test-secret"));
    expect(res.status).toBe(200);
    await res.text();
    expect(fetchLottoDraw).toHaveBeenCalledWith(1201);
  });

  it("관리자 세션이면 헤더 없이도 실행된다", async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: {}, supabase: {} });
    const res = await GET(request("?count=1"));
    expect(res.status).toBe(200);
    await res.text();
    expect(fetchLottoDraw).toHaveBeenCalledWith(1201);
  });

  it("start_from 이 잘못되면 400 을 반환한다", async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: {}, supabase: {} });
    const res = await GET(request("?start_from=abc"));
    expect(res.status).toBe(400);
  });

  it("하드코딩된 상한 없이 API 가 null 을 돌려줄 때까지 진행한다", async () => {
    requireAdminMock.mockResolvedValue({ ok: true, user: {}, supabase: {} });
    // 1201 은 데이터 있음, 1202 는 아직 미발표(null)
    fetchLottoDraw.mockImplementation(async (n) =>
      n === 1201 ? { ltEpsd: 1201 } : null,
    );
    const res = await GET(request("?count=5"));
    const body = await res.text();
    expect(fetchLottoDraw).toHaveBeenCalledWith(1201);
    expect(fetchLottoDraw).toHaveBeenCalledWith(1202);
    expect(fetchLottoDraw).not.toHaveBeenCalledWith(1203);
    expect(body).toContain("#1201");
  });
});
