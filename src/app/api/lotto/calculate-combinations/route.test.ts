import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();

vi.mock("@/shared/lib/auth/guards", () => ({
  requireUser: () => requireUser(),
}));

import { POST } from "./route";

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/lotto/calculate-combinations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/lotto/calculate-combinations", () => {
  beforeEach(() => {
    requireUser.mockReset();
    requireUser.mockResolvedValue({
      ok: true,
      user: { id: "user-1" },
      supabase: {},
    });
  });

  it("로그인하지 않으면 401", async () => {
    requireUser.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await post({ fixedNumbers: [], excludedNumbers: [] });
    expect(res.status).toBe(401);
  });

  it("입력이 잘못되면 400", async () => {
    const res = await post({ fixedNumbers: [99], excludedNumbers: [] });
    expect(res.status).toBe(400);
  });

  it("고정수 5개면 step1 은 남은 40개 중 1개, 즉 40 이다", async () => {
    const res = await post({
      fixedNumbers: [1, 2, 3, 4, 5],
      excludedNumbers: [],
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.step1.total).toBe(40);
    expect(body.step2).toBeUndefined();
  });

  it("filters 가 있으면 step2 를 계산한다", async () => {
    const res = await post({
      fixedNumbers: [1, 2, 3, 4, 5],
      excludedNumbers: [],
      filters: {
        sumRange: [21, 30],
        acRange: [0, 10],
        oddEvenRatios: [],
        highLowRatios: [],
      },
    });
    const body = await res.json();
    // 1+2+3+4+5 = 15, 여섯째 수 6~15 → 합 21~30 → 10개
    expect(body.step2.total).toBe(10);
  });
});
