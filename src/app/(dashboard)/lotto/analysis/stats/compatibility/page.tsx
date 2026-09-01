"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdvancedStats } from "@/features/lotto/types";
import { lottoApi } from "@/features/lotto/api/lotto-api";
import { useLottoNumberStats } from "@/features/lotto/hooks/use-lotto-query";
import {
  StatsFilter,
  FilterValues,
} from "@/features/lotto/components/stats-filter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Heart, Users, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";

const BASE_DEFAULT_FILTERS = {
  type: "all",
  startDraw: 1,
  includeBonus: false,
} as const;

const createDefaultFilters = (endDraw: number): FilterValues => ({
  ...BASE_DEFAULT_FILTERS,
  endDraw,
});

type ParsedPair = {
  pair: string;
  count: number;
  members: [number, number];
};

const parsePair = ([pair, count]: [string, number]): ParsedPair | null => {
  const members = pair
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value): value is number => Number.isFinite(value));

  if (members.length !== 2) return null;

  return {
    pair,
    count,
    members: [members[0], members[1]],
  };
};

export default function CompatibilityStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  // 심화 분석은 1회당 200P가 차감되므로, 사용자가 직접 "분석 적용"을
  // 누르기 전에는 요청하지 않는다.
  const [hasRequested, setHasRequested] = useState(false);
  const [targetNum, setTargetNum] = useState<number | null>(null);

  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  useEffect(() => {
    if (latestDrawNo && !filters) {
      setFilters(createDefaultFilters(latestDrawNo));
    }
  }, [latestDrawNo, filters]);

  const {
    data: statsData,
    isLoading,
    isError,
    refetch,
  } = useLottoNumberStats<AdvancedStats>(
    filters || undefined,
    { style: "advanced" },
    { enabled: hasRequested },
  );
  const stats = statsData?.data || null;

  const normalizedPairs = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.compatibility.pairs)
      .map(parsePair)
      .filter((pair): pair is ParsedPair => pair !== null);
  }, [stats]);

  const topOverallPairs = useMemo(
    () =>
      [...normalizedPairs]
        .sort((left, right) => right.count - left.count)
        .slice(0, 10),
    [normalizedPairs],
  );

  const selectedPartners = useMemo(() => {
    if (!targetNum) return [];

    return [...normalizedPairs]
      .filter((pair) => pair.members.includes(targetNum))
      .sort((left, right) => right.count - left.count)
      .map((pair) => ({
        num: pair.members[0] === targetNum ? pair.members[1] : pair.members[0],
        count: pair.count,
        pair: pair.pair,
      }))
      .filter(
        (partner): partner is { num: number; count: number; pair: string } =>
          Number.isFinite(partner.num),
      )
      .slice(0, 10);
  }, [normalizedPairs, targetNum]);

  const topSelectedPartner = selectedPartners[0] ?? null;
  const selectedPartnerAverageCount =
    selectedPartners.length > 0
      ? (
          selectedPartners.reduce(
            (sum, partner) => sum + Number(partner.count),
            0,
          ) / selectedPartners.length
        ).toFixed(1)
      : null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">
      <PageHeader
        title="궁합 분석 (동반 출현)"
        description="번호 조합을 빠르게 비교하고, 선택 번호에 대한 파트너를 한 번에 볼 수 있는 페이지입니다."
      />

      {latestDrawNo ? (
        <StatsFilter
          onApply={(v) => {
            setFilters(v);
            setHasRequested(true);
          }}
          isPending={isLoading && !!filters}
          isAdvanced
          latestDrawNo={latestDrawNo}
          defaultValues={createDefaultFilters(latestDrawNo)}
        />
      ) : (
        <div className="mb-8 h-[100px] animate-pulse rounded-lg bg-muted/20" />
      )}

      {isError ? (
        <ServiceUnavailableNotice onRetry={() => refetch()} />
      ) : !stats ? (
        <EmptyStateCard
          icon={Heart}
          title="궁합 분석 데이터 로딩 중"
          description="번호 간의 동반 관계를 분석하려면 시작 일자와 마감 범위를 선택해 주세요."
        />
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-10 duration-700">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="border-red-100 bg-red-50/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Users className="h-5 w-5" />
                  번호를 고르면 파트너를 바로 보는 곳
                </CardTitle>
                <CardDescription>
                  선택한 번호의 파트너와 전체 상위 조합을 같은 화면에서
                  비교합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="space-y-4 md:space-y-5">
                  <div className="rounded-xl border border-dashed border-red-200 bg-white/80 p-3 text-sm text-muted-foreground shadow-sm md:p-4">
                    <p className="font-semibold text-foreground">
                      번호를 고르면 여기에 요약이 바로 나타납니다.
                    </p>
                    <p className="mt-1">
                      오른쪽 전체 Top 조합도 함께 포함해 두어서, 선택 번호의
                      파트너와 전체 강한 조합을 바로 비교할 수 있습니다.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setTargetNum(num)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md border text-[10px] font-bold transition-all md:h-10 md:w-10 md:rounded-lg md:text-xs",
                          targetNum === num
                            ? "border-red-500 bg-red-500 text-white shadow-md active:scale-95"
                            : "border-red-100 bg-white text-red-700 hover:bg-red-50",
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {targetNum ? (
                    <>
                      <Card className="border-red-100 bg-white/90 shadow-sm">
                        <CardContent className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:gap-2 md:p-4">
                          <div className="rounded-lg bg-red-50/70 p-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                              선택 번호
                            </p>
                            <p className="mt-1 text-lg font-black text-red-700">
                              {targetNum}
                            </p>
                          </div>
                          <div className="rounded-lg bg-red-50/70 p-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                              가장 잘 함께 나온 번호
                            </p>
                            <p className="mt-1 text-lg font-black text-red-700">
                              {topSelectedPartner?.num ?? "-"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-red-50/70 p-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                              파트너 평균 횟수
                            </p>
                            <p className="mt-1 text-lg font-black text-red-700">
                              {selectedPartnerAverageCount ?? "-"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                              선택 번호의 파트너
                            </p>
                            <p className="text-sm text-muted-foreground">
                              고른 번호와 함께 자주 나온 번호 10개입니다.
                            </p>
                          </div>
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                            {selectedPartners.length}개
                          </span>
                        </div>

                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          {selectedPartners.map((partner, idx) => (
                            <div
                              key={partner.pair}
                              className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-white px-3 py-2.5 shadow-sm"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-[10px] font-black text-red-500">
                                  #{idx + 1}
                                </span>
                                <LotteryBall
                                  number={partner.num}
                                  className="h-8 w-8 shrink-0 text-[10px]"
                                />
                                <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                                  {partner.num}번
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-600">
                                  {partner.count}회
                                </span>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  동반 출현
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-red-100 bg-white/90 px-4 py-8 text-center shadow-sm">
                      <Search className="mx-auto mb-2 h-8 w-8 text-red-400" />
                      <p className="text-sm font-medium text-foreground">
                        번호를 선택하면 파트너 요약을 볼 수 있습니다.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        오른쪽 전체 Top 조합은 그대로 유지됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="text-base md:text-lg">
                  전체 상위 조합 (Top 10)
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  전체 데이터에서 가장 많이 나온 조합입니다. 번호를 고르면
                  오른쪽 파트너 목록과 비교할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                <div className="space-y-2 md:space-y-3">
                  {topOverallPairs.map((pairData, idx) => (
                    <div
                      key={pairData.pair}
                      className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-muted/20 p-2.5 transition-all hover:border-red-200 md:p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2 md:gap-2.5">
                        <span className="w-4 text-[10px] font-black text-muted-foreground/30 md:text-xs">
                          #{idx + 1}
                        </span>
                        <div className="flex shrink-0 gap-1">
                          {pairData.members.map((n) => (
                            <LotteryBall
                              key={n}
                              number={n}
                              className="h-6 w-6 text-[9px] md:h-7 md:w-7 md:text-[10px]"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-red-500 shadow-sm">
                          {pairData.count}회
                        </span>
                        <p className="mt-1 text-[9px] text-muted-foreground md:text-[10px]">
                          조합
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
