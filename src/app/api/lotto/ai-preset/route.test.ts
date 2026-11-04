import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const systemOneMock = vi.fn();
const getJevClientMock = vi.fn();

vi.mock("@/shared/lib/auth/guards", () => ({
  requireVerifiedUser: async () => ({
    ok: true,
    user: { id: "user-1", email: "u@example.com" },
    supabase: {},
  }),
}));

vi.mock("@/shared/lib/ai/jev", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/ai/jev")>(
    "@/shared/lib/ai/jev",
  );
  return {
    ...actual,
    getJevClient: () => getJevClientMock(),
  };
});

import { POST } from "./route";

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/lotto/ai-preset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/lotto/ai-preset", () => {
  beforeEach(() => {
    systemOneMock.mockReset();
    getJevClientMock.mockReset();
    getJevClientMock.mockReturnValue({
      systemOne: systemOneMock,
    });
  });

  it("빈 프롬프트 요청은 400을 반환한다", async () => {
    const res = await post({ prompt: "   " });
    expect(res.status).toBe(400);
  });

  it("Jev systemOne 응답을 바탕으로 유효한 Step 1~3 필터 데이터를 생성한다", async () => {
    systemOneMock.mockResolvedValue({
      model: "jev-latest",
      answers: {
        fixedSource: {
          type: "choice",
          choice: "hot-30",
          confidence: 0.91,
          probabilities: {},
        },
        fixedCount: {
          type: "score",
          score: 1.8,
          confidence: 0.85,
          legend: {},
          probabilities: {},
        },
        excludePreviousDraw: {
          type: "noul",
          noul: 0.88,
        },
        excludeCoolNumbers: {
          type: "noul",
          noul: 0.2,
        },
        sumProfile: {
          type: "choice",
          choice: "tight_center",
          confidence: 0.82,
          probabilities: {},
        },
        oddEvenProfile: {
          type: "choice",
          choice: "balanced",
          confidence: 0.9,
          probabilities: {},
        },
        highLowProfile: {
          type: "choice",
          choice: "balanced",
          confidence: 0.87,
          probabilities: {},
        },
        allowConsecutive: {
          type: "noul",
          noul: 0.15,
        },
        patternStrictness: {
          type: "score",
          score: 1.6,
          confidence: 0.8,
          legend: {},
          probabilities: {},
        },
      },
      usage: { input_tokens: 100, output_tokens: 20 },
    });

    const res = await post({
      prompt: "핫 번호 2개 고정하고 직전 번호는 빼고 연번 없이 엄격하게 맞춰줘",
      groups: [
        { id: "hot-30", label: "핫 번호", numbers: [7, 14, 21, 33] },
        {
          id: "previous-draw",
          label: "직전회차 번호",
          numbers: [3, 7, 19, 28, 35, 44],
        },
      ],
    });

    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.stepData.step1.fixedNumbers).toEqual([7, 14]);
    // 고정수(7)와 겹치는 번호는 제외수에서 자동으로 빠진다
    expect(body.stepData.step1.excludedNumbers).toEqual([3, 19, 28, 35, 44]);
    expect(body.stepData.step2.sumRange).toEqual([115, 160]);
    expect(body.stepData.step2.acRange).toEqual([8, 10]);
    expect(body.stepData.step3.consecutivePattern).toBe("none");
    expect(body.stepData.step3.sameEndDigit).toBe(2);
    expect(body.stepData.step3.sameSection).toBe(2);
    expect(body.decisions.fixedSource.choice).toBe("hot-30");
  });
});
