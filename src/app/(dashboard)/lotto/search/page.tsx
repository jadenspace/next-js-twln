"use client";

import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { PageHeader } from "@/shared/ui/page-header";
import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";
import { ServiceUnavailableError } from "@/shared/lib/service-status";
import { useLottoLatest } from "@/features/lotto/hooks/use-lotto-query";
import { useLottoSearch } from "@/features/lotto/hooks/use-lotto-search";
import type { LottoSearchQuery } from "@/features/lotto/lib/search-query";
import { buildDrawTrendRows } from "@/features/lotto/lib/draw-trend-analysis";
import {
  checkDrawAgainstNumbers,
  summarizeRankResults,
} from "@/features/lotto/lib/check-my-numbers";
import { SearchForm } from "@/features/lotto/components/search/search-form";
import { MyNumbersPanel } from "@/features/lotto/components/search/my-numbers-panel";
import { DrawCard } from "@/features/lotto/components/search/draw-card";

const LOTTO_PICK_SIZE = 6;

export default function SearchPage() {
  const [submitted, setSubmitted] = useState<LottoSearchQuery | null>(null);
  const [myNumbers, setMyNumbers] = useState<number[]>([]);

  const { data: latestDraw } = useLottoLatest();
  const { data, isLoading, isFetching, isError, error, refetch } =
    useLottoSearch(submitted);

  const draws = useMemo(() => data?.data ?? [], [data]);

  // 홀짝·고저·AC 등은 회차 단독 지표라 항상 유효하지만, "직전 회차 재출현"은
  // 결과가 연속 회차일 때만 의미가 있다. 번호 검색 결과는 건너뛴 회차가 많다.
  const isContiguous = !(submitted?.numbers && submitted.numbers.length > 0);
  const patternByDraw = useMemo(
    () => new Map(buildDrawTrendRows(draws).map((row) => [row.drawNo, row])),
    [draws],
  );
  const oldestDrawNo = draws.length
    ? Math.min(...draws.map((d) => d.drw_no))
    : null;

  const myChecks = useMemo(() => {
    if (myNumbers.length !== LOTTO_PICK_SIZE) return null;
    return new Map(
      draws.map((d) => [d.drw_no, checkDrawAgainstNumbers(d, myNumbers)]),
    );
  }, [draws, myNumbers]);
  const rankSummary = myChecks
    ? summarizeRankResults(Array.from(myChecks.values()))
    : null;

  const highlightNumbers = submitted?.numbers;
  const highlightBonus = submitted?.includeBonus ?? false;

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-0">
      <PageHeader
        title="로또 당첨번호 검색"
        description="회차, 날짜, 포함 번호로 과거 당첨번호를 조회하고 내 번호의 당첨 여부를 확인해보세요."
      />

      <SearchForm
        latestDrawNo={latestDraw?.drw_no ?? null}
        isPending={isFetching}
        onSubmit={setSubmitted}
      />

      <MyNumbersPanel
        value={myNumbers}
        onChange={setMyNumbers}
        summary={rankSummary}
      />

      {isError ? (
        error instanceof ServiceUnavailableError ? (
          <ServiceUnavailableNotice onRetry={() => refetch()} />
        ) : (
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        )
      ) : isLoading ? (
        <div className="text-center py-10">
          <Spinner className="text-primary" />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold">
              {submitted === null
                ? "최근 당첨번호"
                : `검색 결과 ${draws.length}건`}
            </h2>
            {data?.truncated && (
              <p className="text-xs text-muted-foreground">
                결과가 많아 최근 {draws.length}회차만 표시합니다. 조건을 좁혀
                보세요.
              </p>
            )}
          </div>

          {draws.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}

          {draws.map((draw) => (
            <DrawCard
              key={draw.drw_no}
              draw={draw}
              pattern={patternByDraw.get(draw.drw_no)}
              showPreviousRepeat={isContiguous && draw.drw_no !== oldestDrawNo}
              highlightNumbers={highlightNumbers}
              highlightBonus={highlightBonus}
              myCheck={myChecks?.get(draw.drw_no)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
