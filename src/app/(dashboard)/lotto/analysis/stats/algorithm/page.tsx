"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, ChevronRight, Flame, Info, Snowflake } from "lucide-react";
import { lottoApi } from "@/features/lotto/api/lotto-api";
import { useLottoNumberStats } from "@/features/lotto/hooks/use-lotto-query";
import {
  FilterValues,
  StatsFilter,
} from "@/features/lotto/components/stats-filter";
import type { AdvancedStats } from "@/features/lotto/types";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default function AlgorithmStatsPage() {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  // 심화 분석은 1회당 200P가 차감되므로, 사용자가 직접 "분석 적용"을
  // 누르기 전에는 요청하지 않는다.
  const [hasRequested, setHasRequested] = useState(false);

  const { data: latestDrawNo } = useQuery({
    queryKey: ["lotto", "latest-draw-no"],
    queryFn: () => lottoApi.getLatestDrawNo(),
  });

  useEffect(() => {
    if (latestDrawNo && !filters) {
      setFilters({
        type: "all",
        startDraw: 1,
        endDraw: latestDrawNo,
        includeBonus: false,
      });
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

  const stats = statsData?.data ?? null;

  // "최근 N회" 필터에는 startDraw/endDraw 가 없다. 값이 있을 때만 구간으로
  // 표기하고, 없으면 회차 수로 표기한다.
  const hasExplicitRange =
    filters?.startDraw !== undefined && filters?.endDraw !== undefined;
  const rangeLabel = hasExplicitRange
    ? `${filters!.startDraw}회 ~ ${filters!.endDraw}회`
    : filters?.limit
      ? `최근 ${filters.limit}회`
      : "-";
  const totalDrawsLabel = hasExplicitRange
    ? `${filters!.endDraw! - filters!.startDraw! + 1}회`
    : filters?.limit
      ? `${filters.limit}회`
      : "-";

  const hotNumbers = getRankedNumbers(stats, "desc");
  const coldNumbers = getRankedNumbers(stats, "asc");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">
      <PageHeader
        title="알고리즘 기법 분석"
        description="Hot/Cold 해석을 바탕으로 현재 회차 범위에서 어떤 번호 흐름이 나타나는지 확인합니다."
      />

      {latestDrawNo ? (
        <StatsFilter
          onApply={(value) => {
            setFilters(value);
            setHasRequested(true);
          }}
          isPending={isLoading && !!filters}
          isAdvanced
          latestDrawNo={latestDrawNo}
          defaultValues={{
            type: "all",
            startDraw: 1,
            endDraw: latestDrawNo,
            includeBonus: false,
          }}
        />
      ) : (
        <div className="mb-8 h-[100px] animate-pulse rounded-lg bg-muted/20" />
      )}

      {isError ? (
        <ServiceUnavailableNotice onRetry={() => refetch()} />
      ) : !stats || !filters ? (
        <EmptyStateCard
          icon={Brain}
          title="알고리즘 분석 대기 중"
          description="회차 범위를 선택하고 적용하면 핫 번호와 콜드 번호 흐름을 바로 확인할 수 있습니다."
        />
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-700">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 shadow-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              핫 번호는 현재 범위에서 자주 나온 번호이고, 콜드 번호는 상대적으로
              덜 나온 번호입니다. 이 결과는 고정 추천이 아니라 현재 필터 기준의
              참고 흐름입니다.
            </p>
          </div>

          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Info className="h-5 w-5" />
                현재 분석 기준
              </CardTitle>
              <CardDescription>
                아래 결과는 현재 적용한 회차 범위 기준으로 계산됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <InfoItem label="분석 회차 범위" value={rangeLabel} />
              <InfoItem label="총 회차 수" value={totalDrawsLabel} />
              <InfoItem
                label="보너스 포함"
                value={filters.includeBonus ? "포함" : "미포함"}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-orange-200 bg-orange-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Flame className="h-5 w-5 fill-current" />핫 번호
                </CardTitle>
                <CardDescription>
                  현재 회차 범위에서 출현 빈도가 높은 번호입니다.
                </CardDescription>
                <p className="text-xs text-muted-foreground">
                  현재 필터 범위 기준 결과
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {hotNumbers.map(([num, count]) => (
                    <div
                      key={num}
                      className="flex flex-col items-center rounded-xl border border-orange-100 bg-white p-3 shadow-sm"
                    >
                      <LotteryBall number={Number(num)} className="mb-2" />
                      <span className="text-xs font-bold text-orange-600">
                        {count}회
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-200 bg-cyan-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-600">
                  <Snowflake className="h-5 w-5" />
                  콜드 번호
                </CardTitle>
                <CardDescription>
                  현재 회차 범위에서 출현 빈도가 낮은 번호입니다.
                </CardDescription>
                <p className="text-xs text-muted-foreground">
                  현재 필터 범위 기준 결과
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {coldNumbers.map(([num, count]) => (
                    <div
                      key={num}
                      className="flex flex-col items-center rounded-xl border border-cyan-100 bg-white p-3 shadow-sm"
                    >
                      <LotteryBall number={Number(num)} className="mb-2" />
                      <span className="text-xs font-bold text-cyan-600">
                        {count}회
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  다음 단계
                </CardTitle>
                <CardDescription>
                  현재 흐름을 확인했다면 패턴 조합 생성기에서 고정수와 제외수를
                  바로 선택할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">
                    패턴 조합 생성기로 이어서 이동
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    핫 번호, 콜드 번호, 최근 회차 번호 흐름을 실제 조합 선택에
                    연결합니다.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-3 w-full justify-between md:w-auto"
                  >
                    <Link href="/lotto/generate/manual-pattern">
                      패턴 조합 생성기로 이동
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function getRankedNumbers(stats: AdvancedStats | null, order: "asc" | "desc") {
  if (!stats) return [];

  return Object.entries(stats.frequency)
    .sort(([, left], [, right]) =>
      order === "asc" ? left - right : right - left,
    )
    .slice(0, 10);
}
