import { PatternConstraintCalculator } from "@/features/lotto/services/pattern-constraint-calculator";
import type { PatternAnalysisStepData } from "@/features/lotto/types/pattern-filter.types";
import { choice, getJevClient, noul, score } from "@/shared/lib/ai/jev";
import { unexpectedErrorResponse } from "@/shared/lib/api/route-error";
import { requireVerifiedUser } from "@/shared/lib/auth/guards";
import { NextRequest, NextResponse } from "next/server";

const MAX_PROMPT_LENGTH = 300;

interface GroupInput {
  id: string;
  label: string;
  numbers: number[];
}

export interface JevPresetDecisionSummary {
  fixedSource: { choice: string; confidence: number };
  fixedCountScore: { score: number; confidence: number };
  excludePreviousDrawProb: number;
  excludeCoolNumbersProb: number;
  sumProfile: { choice: string; confidence: number };
  oddEvenProfile: { choice: string; confidence: number };
  highLowProfile: { choice: string; confidence: number };
  allowConsecutiveProb: number;
  patternStrictnessScore: { score: number; confidence: number };
  summaryTags: string[];
}

function sanitizeGroups(raw: unknown): GroupInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === "object",
    )
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      label: typeof item.label === "string" ? item.label : "",
      numbers: Array.isArray(item.numbers)
        ? item.numbers
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n >= 1 && n <= 45)
        : [],
    }))
    .filter((g) => g.id && g.numbers.length > 0);
}

const SUM_PROFILE_RANGES: Record<string, [number, number]> = {
  low: [80, 135],
  standard: [100, 175],
  tight_center: [115, 160],
  high: [135, 195],
  wide: [75, 210],
};

const ODD_EVEN_PROFILES: Record<string, string[]> = {
  balanced: ["2:4", "3:3", "4:2"],
  odd_heavy: ["3:3", "4:2", "5:1"],
  even_heavy: ["1:5", "2:4", "3:3"],
  all: ["0:6", "1:5", "2:4", "3:3", "4:2", "5:1", "6:0"],
};

const HIGH_LOW_PROFILES: Record<string, string[]> = {
  balanced: ["2:4", "3:3", "4:2"],
  high_heavy: ["3:3", "4:2", "5:1"],
  low_heavy: ["1:5", "2:4", "3:3"],
  all: ["0:6", "1:5", "2:4", "3:3", "4:2", "5:1", "6:0"],
};

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "요청 본문이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const prompt =
      typeof (body as { prompt?: unknown }).prompt === "string"
        ? (body as { prompt: string }).prompt.trim()
        : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "원하는 조합 스타일이나 조건을 입력해주세요." },
        { status: 400 },
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `입력은 ${MAX_PROMPT_LENGTH}자 이내로 작성해주세요.` },
        { status: 400 },
      );
    }

    const client = getJevClient();
    if (!client) {
      return NextResponse.json(
        { error: "AI 설정(TYPESAFE_AI_API_KEY)이 구성되어 있지 않습니다." },
        { status: 503 },
      );
    }

    const groups = sanitizeGroups((body as { groups?: unknown }).groups);
    const groupMap = new Map(groups.map((g) => [g.id, g.numbers]));

    const { answers } = await client.systemOne({
      state: {
        userPrompt: prompt,
        availableRecommendationGroups: groups.map((g) => ({
          id: g.id,
          label: g.label,
          numbers: g.numbers,
        })),
      },
      questions: {
        fixedSource: choice(
          "Which statistical number group should we pick fixed seed numbers from based on the user's request?",
          {
            "hot-30":
              "User wants hot, frequent, or trending numbers included as fixed numbers",
            "cool-30":
              "User wants overdue, cold, long-absent, or rebound numbers included as fixed numbers",
            "regression-3":
              "User wants recent 1-3 draw regression or carryover numbers included",
            "regression-6":
              "User wants medium-term (4-6 draws ago) regression numbers included",
            none: "User did not ask for fixed numbers or prefers no fixed seed numbers",
          },
        ),
        fixedCount: score(
          "How many fixed numbers should be pre-selected in Step 1?",
          [
            "0 fixed numbers (user prefers purely filtered combinations without locking numbers)",
            "1 fixed number (light seed)",
            "2 fixed numbers (strong seed from the chosen group)",
          ],
        ),
        excludePreviousDraw: noul(
          "Should numbers from the immediately preceding draw (previous-draw) be excluded?",
          {
            true: "User wants to exclude last draw's winning numbers or wants fresh numbers",
            false:
              "User wants to allow or include carryover numbers from the previous draw",
          },
        ),
        excludeCoolNumbers: noul(
          "Should long-absent cold numbers (cool-30) be excluded?",
          {
            true: "User wants to exclude cold/unpopular numbers and focus on active numbers",
            false:
              "User does not want to exclude cold numbers or explicitly wants cold numbers",
          },
        ),
        sumProfile: choice(
          "What sum range profile best matches the user's request?",
          {
            tight_center:
              "Stable, conservative, golden-balance sum near the average (115~160)",
            standard: "Normal balanced sum range (100~175)",
            low: "Low sum range or small numbers focus (80~135)",
            high: "High sum range or large numbers focus (135~195)",
            wide: "Aggressive, experimental, or wide open sum range (75~210)",
          },
        ),
        oddEvenProfile: choice(
          "What odd/even ratio preference matches the user's request?",
          {
            balanced: "Balanced odd and even numbers (2:4, 3:3, 4:2)",
            odd_heavy: "More odd numbers than even numbers (3:3, 4:2, 5:1)",
            even_heavy: "More even numbers than odd numbers (1:5, 2:4, 3:3)",
            all: "No odd/even restriction",
          },
        ),
        highLowProfile: choice(
          "What high(23-45) / low(1-22) number ratio matches the user's request?",
          {
            balanced: "Balanced high and low numbers (2:4, 3:3, 4:2)",
            high_heavy: "Focus on high numbers 23-45 (3:3, 4:2, 5:1)",
            low_heavy: "Focus on low numbers 1-22 (1:5, 2:4, 3:3)",
            all: "No high/low restriction",
          },
        ),
        allowConsecutive: noul(
          "Should consecutive number pairs (like 11, 12) be allowed?",
          {
            true: "Allow consecutive numbers or user did not forbid consecutive numbers",
            false:
              "User explicitly wants NO consecutive numbers (연번 제외/없음)",
          },
        ),
        patternStrictness: score(
          "How strictly should number clustering (AC value, same end digit, same section) be filtered?",
          [
            "Relaxed filtering: allow diverse and experimental patterns",
            "Standard filtering: AC 7~10, max 3 same end digit or section",
            "Strict filtering: high complexity AC 8~10, max 2 same end digit and max 2 per section",
          ],
        ),
      },
    });

    // 1. Step 1: 고정수 / 제외수 구성
    const fixedSourceChoice = answers.fixedSource.choice;
    const desiredFixedCount = Math.min(
      2,
      Math.max(0, Math.round(answers.fixedCount.score)),
    );

    const fixedNumbers: number[] = [];
    if (fixedSourceChoice !== "none" && desiredFixedCount > 0) {
      const sourcePool = groupMap.get(fixedSourceChoice) ?? [];
      for (const num of sourcePool) {
        if (fixedNumbers.length >= desiredFixedCount) break;
        if (!fixedNumbers.includes(num)) {
          fixedNumbers.push(num);
        }
      }
    }

    const excludedSet = new Set<number>();
    if (answers.excludePreviousDraw.noul >= 0.55) {
      for (const num of groupMap.get("previous-draw") ?? []) {
        if (!fixedNumbers.includes(num)) excludedSet.add(num);
      }
    }
    if (
      answers.excludeCoolNumbers.noul >= 0.55 &&
      fixedSourceChoice !== "cool-30"
    ) {
      for (const num of groupMap.get("cool-30") ?? []) {
        if (!fixedNumbers.includes(num)) excludedSet.add(num);
      }
    }

    const excludedNumbers = Array.from(excludedSet).sort((a, b) => a - b);

    // 2. Step 2: 제약 계산기로 유효 범위 내로 보정
    const calculator = new PatternConstraintCalculator();
    const availableSum = calculator.calculateSumRange(
      fixedNumbers,
      excludedNumbers,
    );
    const availableOddEven = calculator.getAvailableOddEvenRatios(
      fixedNumbers,
      excludedNumbers,
    );
    const availableHighLow = calculator.getAvailableHighLowRatios(
      fixedNumbers,
      excludedNumbers,
    );

    const targetSum =
      SUM_PROFILE_RANGES[answers.sumProfile.choice] ??
      SUM_PROFILE_RANGES.standard;
    const clampedSum: [number, number] = [
      Math.max(availableSum[0], Math.min(targetSum[0], availableSum[1])),
      Math.min(availableSum[1], Math.max(targetSum[1], availableSum[0])),
    ];
    if (clampedSum[0] >= clampedSum[1]) {
      clampedSum[0] = availableSum[0];
      clampedSum[1] = availableSum[1];
    }

    const preferredOddEven =
      ODD_EVEN_PROFILES[answers.oddEvenProfile.choice] ??
      ODD_EVEN_PROFILES.balanced;
    const filteredOddEven = preferredOddEven.filter((r) =>
      availableOddEven.includes(r),
    );
    const oddEvenRatios =
      filteredOddEven.length > 0 ? filteredOddEven : availableOddEven;

    const preferredHighLow =
      HIGH_LOW_PROFILES[answers.highLowProfile.choice] ??
      HIGH_LOW_PROFILES.balanced;
    const filteredHighLow = preferredHighLow.filter((r) =>
      availableHighLow.includes(r),
    );
    const highLowRatios =
      filteredHighLow.length > 0 ? filteredHighLow : availableHighLow;

    const strictnessLevel = answers.patternStrictness.score;
    const acRange: [number, number] =
      strictnessLevel >= 1.4
        ? [8, 10]
        : strictnessLevel >= 0.6
          ? [7, 10]
          : [5, 10];

    // 3. Step 3: 반복/패턴 구조
    const consecutivePattern: "any" | "none" =
      answers.allowConsecutive.noul < 0.45 ? "none" : "any";
    const sameEndDigit: 0 | 2 | 3 =
      strictnessLevel >= 1.4 ? 2 : strictnessLevel >= 0.6 ? 3 : 0;
    const sameSection: 0 | 2 | 3 =
      strictnessLevel >= 1.4 ? 2 : strictnessLevel >= 0.6 ? 3 : 0;

    const stepData: PatternAnalysisStepData = {
      step1: {
        fixedNumbers: fixedNumbers.sort((a, b) => a - b),
        excludedNumbers,
        completed: true,
      },
      step2: {
        sumRange: clampedSum,
        oddEvenRatios,
        highLowRatios,
        acRange,
        completed: true,
      },
      step3: {
        consecutivePattern,
        sameEndDigit,
        sameSection,
        completed: false,
      },
    };

    const summaryTags: string[] = [];
    if (fixedNumbers.length > 0) {
      summaryTags.push(`고정수 ${fixedNumbers.join(", ")}번`);
    }
    if (excludedNumbers.length > 0) {
      summaryTags.push(`제외수 ${excludedNumbers.length}개`);
    }
    summaryTags.push(`총합 ${clampedSum[0]}~${clampedSum[1]}`);
    summaryTags.push(`AC ${acRange[0]}~${acRange[1]}`);
    summaryTags.push(
      consecutivePattern === "none" ? "연속번호 제외" : "연속번호 허용",
    );
    if (sameSection > 0) {
      summaryTags.push(`동일구간 최대 ${sameSection}개`);
    }

    const decisions: JevPresetDecisionSummary = {
      fixedSource: {
        choice: answers.fixedSource.choice,
        confidence: Number(answers.fixedSource.confidence.toFixed(2)),
      },
      fixedCountScore: {
        score: Number(answers.fixedCount.score.toFixed(2)),
        confidence: Number(answers.fixedCount.confidence.toFixed(2)),
      },
      excludePreviousDrawProb: Number(
        answers.excludePreviousDraw.noul.toFixed(2),
      ),
      excludeCoolNumbersProb: Number(
        answers.excludeCoolNumbers.noul.toFixed(2),
      ),
      sumProfile: {
        choice: answers.sumProfile.choice,
        confidence: Number(answers.sumProfile.confidence.toFixed(2)),
      },
      oddEvenProfile: {
        choice: answers.oddEvenProfile.choice,
        confidence: Number(answers.oddEvenProfile.confidence.toFixed(2)),
      },
      highLowProfile: {
        choice: answers.highLowProfile.choice,
        confidence: Number(answers.highLowProfile.confidence.toFixed(2)),
      },
      allowConsecutiveProb: Number(answers.allowConsecutive.noul.toFixed(2)),
      patternStrictnessScore: {
        score: Number(answers.patternStrictness.score.toFixed(2)),
        confidence: Number(answers.patternStrictness.confidence.toFixed(2)),
      },
      summaryTags,
    };

    return NextResponse.json({
      stepData,
      decisions,
    });
  } catch (error) {
    return unexpectedErrorResponse("api/lotto/ai-preset", error);
  }
}
