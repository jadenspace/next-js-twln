"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Grid3X3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/lib/utils";
import { getLottoBallColor } from "@/features/lotto/lib/lotto-colors";
import type {
  NumberProfile,
  StrategySetEvaluation,
  WeeklyStrategyLabResponse,
} from "@/features/lotto/lib/weekly-strategy-lab";

export function StrategyLabManagement() {
  const [baseDrawInput, setBaseDrawInput] = useState("");
  const [submittedBaseDraw, setSubmittedBaseDraw] = useState("");
  const [selectedSet, setSelectedSet] = useState<StrategySetEvaluation | null>(
    null,
  );
  const [numberFilter, setNumberFilter] = useState<
    "all" | "high32" | "overdue" | "hot"
  >("high32");

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<WeeklyStrategyLabResponse>({
      queryKey: ["admin", "lotto-strategy-lab", submittedBaseDraw],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (submittedBaseDraw) {
          params.set("baseDraw", submittedBaseDraw);
        }
        const response = await fetch(
          `/api/admin/lotto-strategy-lab?${params.toString()}`,
        );
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(
            result.error || "전략 연구소 데이터를 불러오지 못했습니다.",
          );
        }
        return response.json();
      },
    });

  const filteredProfiles = useMemo(() => {
    const list = data?.numberProfiles ?? [];
    if (numberFilter === "high32") {
      return list.filter((p) => p.num >= 32);
    }
    if (numberFilter === "overdue") {
      return [...list]
        .filter((p) => p.missCount >= 10)
        .sort((a, b) => b.missCount - a.missCount);
    }
    if (numberFilter === "hot") {
      return [...list]
        .filter((p) => p.isHot120 || p.isHot30 || p.freqAll >= 175)
        .sort((a, b) => b.freq30 * 2 + b.freq120 - (a.freq30 * 2 + a.freq120));
    }
    return list;
  }, [data?.numberProfiles, numberFilter]);

  const handleCopyNumbers = (title: string, numbers: number[]) => {
    const text = `[${numbers.join(", ")}]`;
    navigator.clipboard.writeText(text);
    toast.success(`${title} 번호 ${text}가 복사되었습니다.`);
  };

  const handleCopyAllRecommended = () => {
    if (!data?.recommendedSets) return;
    const lines = data.recommendedSets.map(
      (s, idx) =>
        `${idx + 1}게임 (${s.title}): [ ${s.numbers.join(", ")} ] (합:${s.sum}, AC:${s.ac}, 32+:${s.high32Count}개)`,
    );
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success(
      `${data.targetDrawNo}회차 통합 추천 5게임 전체가 복사되었습니다.`,
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Spinner className="text-primary" />
        <p className="text-sm text-muted-foreground">
          전 회차 당첨 데이터 및 주간 하이브리드 전략을 계산하는 중입니다...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
        {(error as Error)?.message || "데이터를 불러올 수 없습니다."}
      </div>
    );
  }

  const { baseDraw, targetDrawNo, strategy1Insights, strategy2Insights } = data;

  return (
    <div className="space-y-8">
      {/* 1. 상단 컨트롤 및 최신 기준 회차 요약 배너 */}
      <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                제{targetDrawNo}회차 대비 주간 리포트
              </Badge>
              <Badge variant="outline">
                기준 데이터: 1 ~ {baseDraw.drawNo}회 ({baseDraw.drawDate} 추첨
                완료)
              </Badge>
              <Badge variant="secondary">
                누적 {data.totalAnalyzedDraws}회차 전수 반영
              </Badge>
            </div>
            <CardTitle className="text-2xl">
              주간 번호선정 전략 연구소 (전략 1 비선호 × 전략 2 추세·회귀 통합)
            </CardTitle>
            <CardDescription className="leading-relaxed break-keep">
              매주 토요일 최신 당첨번호 반영 시 자동으로{" "}
              <strong>이월수(회귀)</strong>, <strong>장기 미출현(Cold)</strong>,{" "}
              <strong>120회/30회 단기 강세(Hot)</strong>를 재계산하여{" "}
              <strong>비선호 고기댓값(EV) 5대 원칙</strong>에 맞는 실전 5게임을
              설계합니다.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              inputMode="numeric"
              placeholder={`기준 회차 (현재 ${baseDraw.drawNo})`}
              value={baseDrawInput}
              onChange={(e) => setBaseDrawInput(e.target.value)}
              className="w-44 bg-background"
            />
            <Button
              variant="outline"
              onClick={() => setSubmittedBaseDraw(baseDrawInput.trim())}
            >
              시점 조회
            </Button>
            {submittedBaseDraw && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBaseDrawInput("");
                  setSubmittedBaseDraw("");
                }}
              >
                최신회차 복귀
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="새로고침"
            >
              <RefreshCw
                className={cn("h-4 w-4", isFetching && "animate-spin")}
              />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 rounded-xl border bg-card p-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                직전 제{baseDraw.drawNo}회 ({baseDraw.drawDate}) 당첨 결과 및
                이월 기준점
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {baseDraw.numbers.map((num) => (
                  <LottoBall key={`base-${num}`} num={num} size="lg" />
                ))}
                <span className="px-1 text-sm font-bold text-muted-foreground">
                  +
                </span>
                <LottoBall num={baseDraw.bonusNo} size="lg" outlined />
                <div className="ml-2 flex flex-wrap gap-1.5 text-xs">
                  <Badge variant="secondary">합계 {baseDraw.sum}</Badge>
                  <Badge variant="secondary">AC {baseDraw.ac}</Badge>
                  <Badge variant="secondary">
                    홀짝 {baseDraw.oddEvenRatio}
                  </Badge>
                  <Badge variant="secondary">
                    32~45구간 {baseDraw.high32Count}개
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-3 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
              <div>
                <p className="text-xs text-muted-foreground">
                  {baseDraw.drawNo}회 1등 당첨자
                </p>
                <p className="mt-1 text-lg font-bold">
                  {baseDraw.firstWinners}명{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({baseDraw.firstPrizeEok}억)
                  </span>
                </p>
                {(baseDraw.autoWinners > 0 || baseDraw.manualWinners > 0) && (
                  <p className="text-xs text-muted-foreground">
                    자동 {baseDraw.autoWinners} · 수동 {baseDraw.manualWinners}{" "}
                    · 반자동 {baseDraw.semiAutoWinners}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  최근 120회 전회차 이월 확률
                </p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {strategy2Insights.prev1CarryoverRate120Pct}%
                </p>
                <p className="text-xs text-muted-foreground">
                  회차당 평균 {strategy2Insights.avgPrev1Carryover120}개 재출현
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  수동 당첨자 억제 효과
                </p>
                <p className="mt-1 text-lg font-bold text-emerald-600">
                  {strategy1Insights.autoManualStats.lowMidSumManualAvg}명 →{" "}
                  {strategy1Insights.autoManualStats.highSumManualAvg}명
                </p>
                <p className="text-xs text-muted-foreground">
                  고합계(≥166) 구간 수동 반감
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 이번 주 제N+1회 대비 실전 통합 추천 5세트 (가장 자주 쓰는 영역) */}
      <Card className="border-2 border-primary/30 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />제{targetDrawNo}회
              대비 주간 하이브리드 추천 5게임 (자동 산출)
            </CardTitle>
            <CardDescription>
              제{baseDraw.drawNo}회까지의 통계 추세(이월·핫볼·장기미출현)와
              비선호 고기댓값 설계 5원칙(32~45번 4~5개, 합계 192~224, AC≥7,
              5구간·끝수 최대 2개, OMR 행·열 최대 2개)을 동시에 통과한 최적
              조합입니다.
            </CardDescription>
          </div>
          <Button onClick={handleCopyAllRecommended} className="gap-2 shrink-0">
            <Copy className="h-4 w-4" />
            추천 5게임 전체 복사
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-1">
            {data.recommendedSets.map((set) => (
              <StrategySetCard
                key={set.id}
                set={set}
                baseDrawNo={baseDraw.drawNo}
                onSelect={() => setSelectedSet(set)}
                onCopy={() => handleCopyNumbers(set.title, set.numbers)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. 전략 1 vs 전략 2 핵심 실증 데이터 대시보드 */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* 전략 1 카드 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-700"
              >
                전략 1 검증 · 중복 당첨 회피 (기댓값 극대화)
              </Badge>
              <span className="text-xs text-muted-foreground">
                최근 {strategy1Insights.recentDrawCount}회차 실측
              </span>
            </div>
            <CardTitle className="mt-2 text-lg">
              비선호 고번호(32~45)·고합계 구간의 실제 당첨금 상승 효과
            </CardTitle>
            <CardDescription className="break-keep">
              현대 로또 1등 당첨자의{" "}
              <strong>
                {strategy1Insights.autoManualStats.autoRatioPct}%는 자동(완전
                난수)
              </strong>
              이고{" "}
              <strong>
                {strategy1Insights.autoManualStats.manualRatioPct}%가 수동
              </strong>
              입니다. 비선호 전략은 자동 당첨자(평균 ~10명)를 없애진 못하지만,{" "}
              <strong>수동 중복 대참사(25~63명 당첨)를 원천 차단</strong>해 평균
              당첨금을 약 20억 → 27억~50억 원으로 끌어올립니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                ① 32~45번(비생일 구간) 포함 개수별 평균 당첨자 및 1등 당첨금
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>32~45번 개수</TableHead>
                    <TableHead className="text-right">출현 비율</TableHead>
                    <TableHead className="text-right">평균 당첨자</TableHead>
                    <TableHead className="text-right">평균 1등금</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategy1Insights.byHigh32Count.map((row) => (
                    <TableRow
                      key={row.label}
                      className={cn(
                        row.label.includes("4개 이상") &&
                          "bg-emerald-50/70 font-semibold dark:bg-emerald-950/20",
                      )}
                    >
                      <TableCell className="text-xs sm:text-sm">
                        {row.label}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {row.drawCount}회 ({row.ratioPct}%)
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {row.avgWinners}명
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {row.avgPrizeEok}억 원
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                ② 당첨번호 총합 구간별 평균 당첨자 및 1등 당첨금
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>번호 총합 구간</TableHead>
                    <TableHead className="text-right">출현 비율</TableHead>
                    <TableHead className="text-right">평균 당첨자</TableHead>
                    <TableHead className="text-right">평균 1등금</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategy1Insights.bySumBracket.map((row) => (
                    <TableRow
                      key={row.label}
                      className={cn(
                        row.label.includes("180") &&
                          "bg-emerald-50/70 font-semibold dark:bg-emerald-950/20",
                      )}
                    >
                      <TableCell className="text-xs sm:text-sm">
                        {row.label}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {row.drawCount}회 ({row.ratioPct}%)
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {row.avgWinners}명
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {row.avgPrizeEok}억 원
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-300/70 bg-amber-50/50 p-3.5 dark:bg-amber-950/20">
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  역(逆)패턴 함정 실제 사례 (회피 필수)
                </p>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  {strategy1Insights.trapExamples.map((ex) => (
                    <li key={ex.drawNo} className="leading-snug">
                      <span className="font-semibold text-foreground">
                        #{ex.drawNo}회 ({ex.winners}명 · {ex.prizeEok}억)
                      </span>{" "}
                      [{ex.numbers.join(",")}] — {ex.reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-emerald-300/70 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  비선호 소수 당첨 대박 실제 사례
                </p>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  {strategy1Insights.jackpotExamples.map((ex) => (
                    <li key={ex.drawNo} className="leading-snug">
                      <span className="font-semibold text-foreground">
                        #{ex.drawNo}회 ({ex.winners}명 · {ex.prizeEok}억)
                      </span>{" "}
                      [{ex.numbers.join(",")}] — {ex.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 전략 2 카드 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="border-blue-500/40 text-blue-700"
              >
                전략 2 검증 · 제{baseDraw.drawNo}회 기준 추세·회귀·미출현 흐름
              </Badge>
              <span className="text-xs text-muted-foreground">
                카이제곱 χ²={strategy2Insights.chiSquareAll} (정상 균등분포)
              </span>
            </div>
            <CardTitle className="mt-2 text-lg">
              현재 회차({baseDraw.drawNo}회) 실시간 핫볼·콜드볼 및 구조적 추세
            </CardTitle>
            <CardDescription className="break-keep">
              기계적 편향은 없으나(χ²={strategy2Insights.chiSquareAll} &lt;
              임계값 60.48),{" "}
              <strong>
                전회차 이월({strategy2Insights.prev1CarryoverRate120Pct}%)
              </strong>
              ,{" "}
              <strong>
                최근 10회차 내 번호 재출현(평균{" "}
                {strategy2Insights.avgLast10Carryover120}개)
              </strong>
              ,{" "}
              <strong>
                5단위 동일구간 2개 이하 분산(
                {strategy2Insights.sectionCap2Rate120Pct}%)
              </strong>
              은 압도적인 통계적 확률 밀도를 가집니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <StatMiniBox
                label="최근 30회 평균 합계"
                value={String(strategy2Insights.meanSum30)}
                sub={`전체 평균 ${strategy2Insights.meanSumAll}`}
              />
              <StatMiniBox
                label="전회차 이월 확률(120회)"
                value={`${strategy2Insights.prev1CarryoverRate120Pct}%`}
                sub={`평균 ${strategy2Insights.avgPrev1Carryover120}개 이월`}
              />
              <StatMiniBox
                label="최근 10회차 회귀(120회)"
                value={`${strategy2Insights.avgLast10Carryover120}개`}
                sub="6개 중 4~5개 차지"
              />
              <StatMiniBox
                label="5구간 2개 이하 비율"
                value={`${strategy2Insights.sectionCap2Rate120Pct}%`}
                sub="3개 이상 과밀은 5.8%뿐"
              />
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  🔥 비생일 고번호(32~45번) 최강 모멘텀 TOP 8 (전체 + 최근
                  120회·30회 가중)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {strategy2Insights.hotHigh32Top.map((p) => (
                    <div
                      key={`hot32-${p.num}`}
                      className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs shadow-xs"
                    >
                      <LottoBall num={p.num} size="sm" />
                      <span className="font-medium">
                        전체 {p.freqAll} · 120회 {p.freq120} · 30회 {p.freq30}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  ⚡ 최근 30회차 단기 급상승 핫볼 TOP 8
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {strategy2Insights.hot30Top.map((p) => (
                    <div
                      key={`hot30-${p.num}`}
                      className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs shadow-xs"
                    >
                      <LottoBall num={p.num} size="sm" />
                      <span className="font-medium">
                        30회 <strong>{p.freq30}번</strong> (120회 {p.freq120}번)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  ❄️ 장기 미출현(Overdue) 평균회귀 대기 번호 TOP 8 (제
                  {baseDraw.drawNo}회 기준)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {strategy2Insights.overdueTop.slice(0, 8).map((p) => (
                    <div
                      key={`overdue-${p.num}`}
                      className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/60 px-2.5 py-1 text-xs shadow-xs dark:border-blue-900 dark:bg-blue-950/30"
                    >
                      <LottoBall num={p.num} size="sm" />
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {p.missCount}주 미출현
                      </span>
                      <span className="text-muted-foreground">
                        (전체 {p.freqAll})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. 통합 황금 설계 5대 원칙 요약 */}
      <Card className="bg-muted/15">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            결론: 매주 번호 선정 시 지켜야 할 하이브리드 5대 설계 원칙
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <PrincipleBox
            step="원칙 1 · 고번호 비중"
            title="32~45번 4~5개 배치"
            desc="1~12번(월·일 생일)은 배제하고 13~31번에서 1~2개만 섞어 합계 192~224를 유지합니다."
          />
          <PrincipleBox
            step="원칙 2 · OMR 비대칭"
            title="동일 행·열 최대 2개"
            desc="OMR 7×7 마킹용지에서 가로 한 줄이나 세로 한 줄에 3개 이상 나란히 찍히지 않게 분산합니다."
          />
          <PrincipleBox
            step="원칙 3 · 확률밀도 구조"
            title="AC 7~9 & 5구간 최대 2개"
            desc="41~45 등 단일 5단위 구간에 3개 몰림(5.8% 희귀)을 피하고 연번 1~2쌍(3연번 금지)을 포함합니다."
          />
          <PrincipleBox
            step="원칙 4 · 회귀(이월) 법칙"
            title="전회차 1개 + 10회차 4개"
            desc="매주 65% 확률로 나오는 직전 회차 번호를 1개 넣고, 최근 10주 내 번호를 총 3~5개로 맞춥니다."
          />
          <PrincipleBox
            step="원칙 5 · 핫·콜드 조화"
            title="강세 핫볼 + 미출현 반등"
            desc="전체·최근 다빈도 번호(34, 38, 27, 42 등)와 10주 이상 장기 미출현 번호를 4:2로 결합합니다."
          />
        </CardContent>
      </Card>

      {/* 5. 참고 문서 고정 조합(A~E) 실시간 진단 비교 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            참고 문서 고정 조합 (조합 A ~ E) 실시간 적합도 진단
          </CardTitle>
          <CardDescription>
            제시된 비선호 조합 A~E가 현재 제{baseDraw.drawNo}회차 시점의 회귀
            흐름 및 OMR 기하학·구간 분산 기준에서 몇 점을 받는지 비교합니다.
            (카드를 클릭하면 OMR 마킹 배치도를 볼 수 있습니다.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.referenceSets.map((set) => (
            <StrategySetCard
              key={set.id}
              set={set}
              baseDrawNo={baseDraw.drawNo}
              onSelect={() => setSelectedSet(set)}
              onCopy={() => handleCopyNumbers(set.title, set.numbers)}
              compact
            />
          ))}
        </CardContent>
      </Card>

      {/* 6. 번호별 실시간 상태 매트릭스 (수동 커스텀 조합용) */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">
              번호별 실시간 추세·회귀·미출현 치트시트 (제{baseDraw.drawNo}회
              기준)
            </CardTitle>
            <CardDescription>
              직접 번호를 교체하거나 반자동 고정수를 고를 때 활용하는 번호별
              상세 지표입니다.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={numberFilter === "high32" ? "default" : "outline"}
              onClick={() => setNumberFilter("high32")}
            >
              32~45번 (비선호 핵심)
            </Button>
            <Button
              size="sm"
              variant={numberFilter === "overdue" ? "default" : "outline"}
              onClick={() => setNumberFilter("overdue")}
            >
              장기 미출현 (≥10주)
            </Button>
            <Button
              size="sm"
              variant={numberFilter === "hot" ? "default" : "outline"}
              onClick={() => setNumberFilter("hot")}
            >
              강세 핫볼
            </Button>
            <Button
              size="sm"
              variant={numberFilter === "all" ? "default" : "outline"}
              onClick={() => setNumberFilter("all")}
            >
              전체 1~45번
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>번호</TableHead>
                <TableHead>구간 분류</TableHead>
                <TableHead>현재 미출현</TableHead>
                <TableHead>전체 출현</TableHead>
                <TableHead>최근 120회</TableHead>
                <TableHead>최근 30회</TableHead>
                <TableHead>최근 회귀 상태</TableHead>
                <TableHead>전략 태그</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((p) => (
                <NumberProfileRow key={p.num} profile={p} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 상세 모달 (OMR 7x7 슬립 시각화 포함) */}
      <Dialog open={!!selectedSet} onOpenChange={() => setSelectedSet(null)}>
        <DialogContent className="max-w-2xl">
          {selectedSet && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selectedSet.title}</span>
                  <Badge>{selectedSet.totalScore}점 / 100</Badge>
                </DialogTitle>
                <DialogDescription>{selectedSet.subtitle}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex flex-wrap gap-2.5">
                    {selectedSet.numbers.map((n) => (
                      <LottoBall key={`modal-${n}`} num={n} size="lg" />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() =>
                      handleCopyNumbers(selectedSet.title, selectedSet.numbers)
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                    복사
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  {/* OMR 7x7 마킹 용지 시각화 */}
                  <div className="rounded-xl border bg-white p-3.5 shadow-xs dark:bg-slate-950">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-rose-600">
                      <Grid3X3 className="h-3.5 w-3.5" />
                      OMR 마킹 용지 배치 (7×7)
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 45 }, (_, i) => i + 1).map(
                        (num) => {
                          const isMarked = selectedSet.numbers.includes(num);
                          const isNonBirthday = num >= 32;
                          return (
                            <div
                              key={`omr-${num}`}
                              className={cn(
                                "flex h-6 items-center justify-center rounded text-[11px] font-semibold transition-colors",
                                isMarked
                                  ? "bg-slate-900 font-bold text-white ring-2 ring-rose-500 dark:bg-white dark:text-slate-900"
                                  : isNonBirthday
                                    ? "border border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    : "border border-rose-100 text-muted-foreground",
                              )}
                            >
                              {num}
                            </div>
                          );
                        },
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      최대 동일 가로행:{" "}
                      <strong>{selectedSet.maxOmrRow}개</strong> · 최대 동일
                      세로열: <strong>{selectedSet.maxOmrCol}개</strong>
                    </p>
                  </div>

                  {/* 상세 지표 및 진단 */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <StatMiniBox
                        label="번호 총합"
                        value={String(selectedSet.sum)}
                        sub="목표 192~224"
                      />
                      <StatMiniBox
                        label="AC 복잡도"
                        value={String(selectedSet.ac)}
                        sub="목표 7~10"
                      />
                      <StatMiniBox
                        label="32~45 고번호"
                        value={`${selectedSet.high32Count}개`}
                        sub="목표 4~5개"
                      />
                      <StatMiniBox
                        label="연번 / 홀짝"
                        value={`${selectedSet.consecutivePairs}쌍 / ${selectedSet.oddEvenRatio}`}
                        sub="3연번 금지"
                      />
                      <StatMiniBox
                        label="동일구간/끝수"
                        value={`구간${selectedSet.maxSameSection} / 끝수${selectedSet.maxSameEndDigit}`}
                        sub="최대 2개 이하 권장"
                      />
                      <StatMiniBox
                        label="과거 당첨 이력"
                        value={`4등 ${selectedSet.historicalMatches.rank4}회`}
                        sub={`1등 ${selectedSet.historicalMatches.rank1} · 3등 ${selectedSet.historicalMatches.rank3} · 5등 ${selectedSet.historicalMatches.rank5}`}
                      />
                    </div>

                    <div className="rounded-lg border bg-card p-3 text-xs space-y-1.5">
                      <p className="font-semibold text-foreground">
                        회귀(이월) 및 선정 근거
                      </p>
                      <p className="text-muted-foreground">
                        • 전회차 이월({selectedSet.regressionPrev1.length}개):{" "}
                        {selectedSet.regressionPrev1.join(", ") || "없음"} |
                        최근 3회차(
                        {selectedSet.regressionLast3.length}개):{" "}
                        {selectedSet.regressionLast3.join(", ") || "없음"} |
                        최근 10회차(
                        {selectedSet.regressionLast10.length}개):{" "}
                        {selectedSet.regressionLast10.join(", ") || "없음"}
                      </p>
                      {selectedSet.reasons.map((r, i) => (
                        <p
                          key={i}
                          className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          {r}
                        </p>
                      ))}
                      {selectedSet.cautions.map((c, i) => (
                        <p
                          key={i}
                          className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          {c}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StrategySetCard({
  set,
  baseDrawNo,
  onSelect,
  onCopy,
  compact = false,
}: {
  set: StrategySetEvaluation;
  baseDrawNo: number;
  onSelect: () => void;
  onCopy: () => void;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md",
        compact && "py-3",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={set.totalScore >= 90 ? "default" : "secondary"}
              className="font-semibold"
            >
              {set.badge}
            </Badge>
            <span className="font-bold text-base">{set.title}</span>
            <span className="text-xs text-muted-foreground">
              {set.subtitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {set.numbers.map((num) => {
              const isCarry = set.regressionPrev1.includes(num);
              const isOverdue = set.overdueNumbers.includes(num);
              return (
                <div key={`${set.id}-${num}`} className="relative">
                  <LottoBall
                    num={num}
                    size={compact ? "md" : "lg"}
                    highlighted={isCarry}
                  />
                  {isCarry && (
                    <span className="absolute -top-1.5 -right-1 rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
                      이월
                    </span>
                  )}
                  {!isCarry && isOverdue && (
                    <span className="absolute -top-1.5 -right-1 rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                      미출
                    </span>
                  )}
                </div>
              );
            })}

            <div className="ml-2 flex flex-wrap gap-1.5">
              <Badge variant="outline">합계 {set.sum}</Badge>
              <Badge variant="outline">AC {set.ac}</Badge>
              <Badge variant="outline">홀짝 {set.oddEvenRatio}</Badge>
              <Badge variant="outline">32~45구간 {set.high32Count}개</Badge>
              <Badge variant="outline">연번 {set.consecutivePairs}쌍</Badge>
              <Badge variant="outline">
                OMR {set.maxOmrRow}행×{set.maxOmrCol}열
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-3 lg:border-t-0 lg:pt-0">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              비선호 {set.strategy1Score}/50 · 추세 {set.strategy2Score}/50
            </div>
            <div className="text-lg font-extrabold text-primary">
              종합 {set.totalScore}점
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              OMR·상세
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              복사
            </Button>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2.5 text-xs text-muted-foreground">
          <span>
            <strong>{baseDrawNo}회 기준 회귀:</strong> 전회차(
            {set.regressionPrev1.join(", ") || "없음"}) · 3회차(
            {set.regressionLast3.join(", ") || "없음"}) · 10회차(
            {set.regressionLast10.length}개)
          </span>
          {set.reasons.map((reason, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-3 w-3" />
              {reason}
            </span>
          ))}
        </div>
      )}

      {set.cautions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-3 border-t pt-2 text-xs text-amber-700 dark:text-amber-400">
          {set.cautions.map((c, idx) => (
            <span key={idx} className="inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function NumberProfileRow({ profile }: { profile: NumberProfile }) {
  return (
    <TableRow>
      <TableCell>
        <LottoBall num={profile.num} size="sm" />
      </TableCell>
      <TableCell className="text-xs">
        {profile.num >= 32 ? (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          >
            32~45 비생일 고번호
          </Badge>
        ) : profile.num >= 13 ? (
          <Badge variant="outline">13~31 일(Day) 생일구간</Badge>
        ) : (
          <Badge variant="destructive">1~12 월·일 핵심밀집</Badge>
        )}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "text-xs font-semibold",
            profile.missCount >= 12 && "text-blue-600 dark:text-blue-400",
          )}
        >
          {profile.missCount === 0
            ? "직전 출현(0주)"
            : `${profile.missCount}주 미출현`}
        </span>
      </TableCell>
      <TableCell className="text-xs">{profile.freqAll}회</TableCell>
      <TableCell className="text-xs">{profile.freq120}회</TableCell>
      <TableCell className="text-xs font-semibold">
        {profile.freq30}회
      </TableCell>
      <TableCell className="text-xs">
        {profile.inPrev1
          ? "전회차 당첨번호"
          : profile.inPrev3
            ? "최근 3회차 내 출현"
            : profile.inPrev6
              ? "최근 6회차 내 출현"
              : profile.inPrev10
                ? "최근 10회차 내 출현"
                : "10주 이상 미출현"}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {profile.inPrev1 && (
            <Badge className="bg-rose-600 text-[10px]">이월후보</Badge>
          )}
          {profile.isHot30 && (
            <Badge variant="secondary" className="text-[10px]">
              30회 급상승
            </Badge>
          )}
          {profile.isHot120 && (
            <Badge variant="secondary" className="text-[10px]">
              120회 다빈도
            </Badge>
          )}
          {profile.isOverdue && (
            <Badge
              variant="outline"
              className="border-blue-400 text-[10px] text-blue-600"
            >
              장기미출 반등
            </Badge>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function StatMiniBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3 shadow-2xs">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function PrincipleBox({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3.5 shadow-2xs">
      <p className="text-[11px] font-bold text-primary">{step}</p>
      <p className="mt-1 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground break-keep">
        {desc}
      </p>
    </div>
  );
}

function LottoBall({
  num,
  outlined = false,
  highlighted = false,
  size = "md",
}: {
  num: number;
  outlined?: boolean;
  highlighted?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold shadow-xs transition-transform",
        size === "lg"
          ? "h-10 w-10 text-sm"
          : size === "md"
            ? "h-8 w-8 text-xs"
            : "h-6 w-6 text-[11px]",
        outlined ? "border-2 bg-background" : "text-white",
        highlighted && "ring-2 ring-rose-500 ring-offset-2",
      )}
      style={
        outlined
          ? {
              borderColor: getLottoBallColor(num),
              color: getLottoBallColor(num),
            }
          : { backgroundColor: getLottoBallColor(num) }
      }
    >
      {num}
    </span>
  );
}
