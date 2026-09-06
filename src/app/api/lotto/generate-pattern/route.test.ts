import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const adjustPoints = vi.fn();

vi.mock("@/shared/lib/auth/guards", () => ({
  requireVerifiedUser: async () => ({
    ok: true,
    user: { id: "user-1", email: "u@example.com" },
    supabase: {},
  }),
}));

vi.mock("@/shared/lib/points/point-ledger", () => ({
  getBalance: async () => 10_000,
  adjustPoints: (args: unknown) => adjustPoints(args),
}));

import { POST } from "./route";

const baseFilters = {
  sumRange: [21, 255],
  acRange: [0, 10],
  primeCount: [0, 6],
  compositeCount: [0, 6],
  multiplesOf3: [0, 6],
  multiplesOf5: [0, 6],
  squareCount: [0, 6],
  sameEndDigit: 6,
  sameSection: 6,
};

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/lotto/generate-pattern", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/lotto/generate-pattern 과금", () => {
  beforeEach(() => {
    adjustPoints.mockReset();
    adjustPoints.mockResolvedValue({ ok: true, balance: 9_900 });
  });

  it("고정수 6개로 1개 조합만 생성되면 요청 게임 수가 아니라 1게임 값만 과금한다", async () => {
    const res = await post({
      gameCount: 20,
      filters: { ...baseFilters, fixedNumbers: [2, 9, 17, 25, 33, 41] },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.cost).toBe(100);
    expect(adjustPoints).toHaveBeenCalledTimes(1);
    expect(adjustPoints.mock.calls[0][0]).toMatchObject({ delta: -100 });
  });

  it("요청한 게임 수만큼 생성되면 그 수만큼 과금한다", async () => {
    const res = await post({ gameCount: 3, filters: baseFilters });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.cost).toBe(300);
    expect(adjustPoints.mock.calls[0][0]).toMatchObject({ delta: -300 });
  });
});
