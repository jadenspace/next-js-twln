"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, Filter, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/lib/utils";
import type {
  DrawTrendResponse,
  DrawTrendRow,
} from "@/features/lotto/lib/draw-trend-analysis";
import { getLottoBallColor } from "@/features/lotto/lib/lotto-colors";

type SortKey =
  | "drawNo"
  | "sum"
  | "ac"
  | "consecutiveCount"
  | "sameEndDigitCount"
  | "sameSectionCount"
  | "previousRegressionCount"
  | "last3RegressionCount"
  | "last6RegressionCount"
  | "last10RegressionCount";

type SortDirection = "asc" | "desc";

const SUMMARY_CARD_KEYS: ReadonlyArray<{
  key:
    | "totalRows"
    | "averageSum"
    | "averageAc"
    | "averagePreviousRegression"
    | "outlierCount";
  label: string;
  suffix?: string;
}> = [
  { key: "totalRows", label: "조회 회차", suffix: "건" },
  { key: "averageSum", label: "평균 합계" },
  { key: "averageAc", label: "평균 AC" },
  { key: "averagePreviousRegression", label: "평균 전회차 회귀" },
  { key: "outlierCount", label: "이상치 회차", suffix: "건" },
];

export function DrawTrendManagement() {
  const [startDraw, setStartDraw] = useState("");
  const [endDraw, setEndDraw] = useState("");
  const [limit, setLimit] = useState("120");
  const [filterRegressionOnly, setFilterRegressionOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("drawNo");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedRow, setSelectedRow] = useState<DrawTrendRow | null>(null);
  const [submittedFilters, setSubmittedFilters] = useState({
    startDraw: "",
    endDraw: "",
    limit: "120",
  });

  const { data, isLoading, isFetching, error } = useQuery<DrawTrendResponse>({
    queryKey: ["admin", "draw-trends", submittedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (submittedFilters.startDraw)
        params.set("startDraw", submittedFilters.startDraw);
      if (submittedFilters.endDraw)
        params.set("endDraw", submittedFilters.endDraw);
      if (submittedFilters.limit) params.set("limit", submittedFilters.limit);

      const response = await fetch(`/api/admin/lotto-draw-trends?${params}`);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Failed to load draw trends");
      }

      return response.json();
    },
  });

  const rows = useMemo(() => {
    const source = data?.rows ?? [];
    const filtered = filterRegressionOnly
      ? source.filter(
          (row) =>
            row.previousRegressionCount > 0 ||
            row.last3RegressionCount > 0 ||
            row.last6RegressionCount > 0 ||
            row.last10RegressionCount > 0,
        )
      : source;

    return [...filtered].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      const direction = sortDirection === "asc" ? 1 : -1;

      if (left === right) return 0;
      return left > right ? direction : -direction;
    });
  }, [data?.rows, filterRegressionOnly, sortDirection, sortKey]);

  const handleSearch = () => {
    setSubmittedFilters({ startDraw, endDraw, limit });
  };

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("desc");
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader className="space-y-2">
          <CardTitle>당첨번호 추이분석</CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed break-keep">
            회차별 당첨번호를 한 행씩 노출해 홀짝 비율, AC값, 연번, 동일끝수,
            동일구간, 최근 1·3·6·10회차 회귀 흐름을 빠르게 확인하는 관리자 분석
            테이블입니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
            <Input
              inputMode="numeric"
              placeholder="시작 회차"
              value={startDraw}
              onChange={(event) => setStartDraw(event.target.value)}
            />
            <Input
              inputMode="numeric"
              placeholder="종료 회차"
              value={endDraw}
              onChange={(event) => setEndDraw(event.target.value)}
            />
            <Input
              inputMode="numeric"
              placeholder="조회 개수"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              조회
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filterRegressionOnly ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setFilterRegressionOnly((current) => !current)}
            >
              <Filter className="h-3.5 w-3.5" />
              회귀 있는 회차만
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDraw("");
                setEndDraw("");
                setLimit("120");
                setSubmittedFilters({
                  startDraw: "",
                  endDraw: "",
                  limit: "120",
                });
                setFilterRegressionOnly(false);
              }}
            >
              초기화
            </Button>
            {isFetching && !isLoading && (
              <span className="text-sm text-muted-foreground">
                데이터를 다시 불러오는 중입니다.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {SUMMARY_CARD_KEYS.map((item) => {
          const rawValue = data?.summary?.[item.key] ?? 0;
          const formattedValue =
            typeof rawValue === "number" && !Number.isInteger(rawValue)
              ? rawValue.toFixed(1)
              : String(rawValue);

          return (
            <Card key={item.key}>
              <CardHeader className="pb-0">
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {formattedValue}
                  {item.suffix ?? ""}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>회차별 패턴 테이블</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              행을 클릭하면 회귀 번호와 패턴 수치를 상세하게 볼 수 있습니다.
            </p>
          </div>
          <Badge variant="secondary">{rows.length}개 회차 표시</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {(error as Error).message}
            </div>
          ) : (
            <Table className="min-w-[1560px]">
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="회차"
                    active={sortKey === "drawNo"}
                    direction={sortDirection}
                    onClick={() => handleSort("drawNo")}
                  />
                  <TableHead>추첨일</TableHead>
                  <TableHead>당첨번호</TableHead>
                  <TableHead>보너스</TableHead>
                  <TableHead>홀짝</TableHead>
                  <TableHead>고저</TableHead>
                  <SortableHead
                    label="합계"
                    active={sortKey === "sum"}
                    direction={sortDirection}
                    onClick={() => handleSort("sum")}
                  />
                  <SortableHead
                    label="AC"
                    active={sortKey === "ac"}
                    direction={sortDirection}
                    onClick={() => handleSort("ac")}
                  />
                  <SortableHead
                    label="연번"
                    active={sortKey === "consecutiveCount"}
                    direction={sortDirection}
                    onClick={() => handleSort("consecutiveCount")}
                  />
                  <SortableHead
                    label="동일끝수"
                    active={sortKey === "sameEndDigitCount"}
                    direction={sortDirection}
                    onClick={() => handleSort("sameEndDigitCount")}
                  />
                  <SortableHead
                    label="동일구간"
                    active={sortKey === "sameSectionCount"}
                    direction={sortDirection}
                    onClick={() => handleSort("sameSectionCount")}
                  />
                  <SortableHead
                    label="전회차회귀"
                    active={sortKey === "previousRegressionCount"}
                    direction={sortDirection}
                    onClick={() => handleSort("previousRegressionCount")}
                  />
                  <SortableHead
                    label="지난3회차회귀"
                    active={sortKey === "last3RegressionCount"}
                    direction={sortDirection}
                    onClick={() => handleSort("last3RegressionCount")}
                  />
                  <SortableHead
                    label="지난6회차회귀"
                    active={sortKey === "last6RegressionCount"}
                    direction={sortDirection}
                    onClick={() => handleSort("last6RegressionCount")}
                  />
                  <SortableHead
                    label="지난10회차회귀"
                    active={sortKey === "last10RegressionCount"}
                    direction={sortDirection}
                    onClick={() => handleSort("last10RegressionCount")}
                  />
                  <TableHead>전회차보너스회귀</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isOutlier =
                    row.previousRegressionCount >= 3 ||
                    row.last3RegressionCount >= 4 ||
                    row.ac <= 4 ||
                    row.oddEvenRatio === "6:0" ||
                    row.oddEvenRatio === "0:6";

                  return (
                    <TableRow
                      key={row.drawNo}
                      className="cursor-pointer"
                      onClick={() => setSelectedRow(row)}
                    >
                      <TableCell className="font-semibold">
                        {row.drawNo}
                      </TableCell>
                      <TableCell>{row.drawDate}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {row.numbers.map((num) => (
                            <LottoBall key={`${row.drawNo}-${num}`} num={num} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <LottoBall num={row.bonusNo} outlined />
                      </TableCell>
                      <TableCell>{row.oddEvenRatio}</TableCell>
                      <TableCell>{row.highLowRatio}</TableCell>
                      <TableCell>{row.sum}</TableCell>
                      <TableCell>{row.ac}</TableCell>
                      <TableCell>{row.consecutiveCount}</TableCell>
                      <TableCell>
                        <PatternPill
                          value={row.sameEndDigitCount}
                          active={row.sameEndDigitCount >= 3}
                        />
                      </TableCell>
                      <TableCell>
                        <PatternPill
                          value={row.sameSectionCount}
                          active={row.sameSectionCount >= 3}
                        />
                      </TableCell>
                      <TableCell>{row.previousRegressionCount}</TableCell>
                      <TableCell>{row.last3RegressionCount}</TableCell>
                      <TableCell>{row.last6RegressionCount}</TableCell>
                      <TableCell>{row.last10RegressionCount}</TableCell>
                      <TableCell>{row.previousBonusRegressionCount}</TableCell>
                      <TableCell>
                        {isOutlier ? (
                          <Badge variant="destructive">이상치</Badge>
                        ) : row.last3RegressionCount > 0 ? (
                          <Badge variant="secondary">회귀</Badge>
                        ) : (
                          <Badge variant="outline">일반</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
        <DialogContent className="flex h-[min(88vh,900px)] w-[min(1160px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden p-0">
          {selectedRow && (
            <>
              <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
                <DialogTitle>{selectedRow.drawNo}회차 상세 분석</DialogTitle>
                <DialogDescription>
                  {selectedRow.drawDate} 추첨 결과와 최근 회차 회귀 패턴을 함께
                  확인합니다.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
                <div className="space-y-6 px-6 py-6">
                  <Card className="border-0 bg-gradient-to-br from-white to-muted/30 shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">
                        현재 회차 번호
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        {selectedRow.numbers.map((num) => (
                          <LottoBall
                            key={`selected-${num}`}
                            num={num}
                            size="lg"
                            highlighted={selectedRow.repeatedNumbersFromLast10.includes(
                              num,
                            )}
                          />
                        ))}
                        <LottoBall
                          num={selectedRow.bonusNo}
                          outlined
                          size="lg"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <RegressionChip
                          label="전회차"
                          value={selectedRow.previousRegressionCount}
                        />
                        <RegressionChip
                          label="지난3회차"
                          value={selectedRow.last3RegressionCount}
                        />
                        <RegressionChip
                          label="지난6회차"
                          value={selectedRow.last6RegressionCount}
                        />
                        <RegressionChip
                          label="지난10회차"
                          value={selectedRow.last10RegressionCount}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">
                        패턴 수치 요약
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <MetricCard
                        label="홀짝"
                        value={selectedRow.oddEvenRatio}
                      />
                      <MetricCard
                        label="고저"
                        value={selectedRow.highLowRatio}
                      />
                      <MetricCard
                        label="합계"
                        value={String(selectedRow.sum)}
                      />
                      <MetricCard label="AC" value={String(selectedRow.ac)} />
                      <MetricCard
                        label="연번"
                        value={String(selectedRow.consecutiveCount)}
                      />
                      <MetricCard
                        label="동일끝수"
                        value={String(selectedRow.sameEndDigitCount)}
                        emphasized={selectedRow.sameEndDigitCount >= 3}
                      />
                      <MetricCard
                        label="동일구간"
                        value={String(selectedRow.sameSectionCount)}
                        emphasized={selectedRow.sameSectionCount >= 3}
                      />
                      <MetricCard
                        label="전회차 보너스 회귀"
                        value={String(selectedRow.previousBonusRegressionCount)}
                      />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">
                        회귀 범위별 수치
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <SummaryRow
                        label="동일끝수"
                        value={selectedRow.sameEndDigitCount}
                        emphasized={selectedRow.sameEndDigitCount >= 3}
                      />
                      <SummaryRow
                        label="동일구간"
                        value={selectedRow.sameSectionCount}
                        emphasized={selectedRow.sameSectionCount >= 3}
                      />
                      <SummaryRow
                        label="전회차 회귀"
                        value={selectedRow.previousRegressionCount}
                      />
                      <SummaryRow
                        label="지난3회차 회귀"
                        value={selectedRow.last3RegressionCount}
                      />
                      <SummaryRow
                        label="지난6회차 회귀"
                        value={selectedRow.last6RegressionCount}
                      />
                      <SummaryRow
                        label="지난10회차 회귀"
                        value={selectedRow.last10RegressionCount}
                      />
                      <SummaryRow
                        label="전회차 보너스 회귀"
                        value={selectedRow.previousBonusRegressionCount}
                      />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">
                        회귀 범위별 번호
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 lg:grid-cols-2">
                      <InfoRow
                        label="전회차 회귀"
                        value={joinNumbers(
                          selectedRow.repeatedNumbersFromPrevious,
                        )}
                      />
                      <InfoRow
                        label="전회차 보너스 회귀"
                        value={joinNumbers(
                          selectedRow.matchedPreviousBonusNumbers,
                        )}
                      />
                      <InfoRow
                        label="지난3회차 회귀"
                        value={joinNumbers(
                          selectedRow.repeatedNumbersFromLast3,
                        )}
                      />
                      <InfoRow
                        label="지난6회차 회귀"
                        value={joinNumbers(
                          selectedRow.repeatedNumbersFromLast6,
                        )}
                      />
                      <InfoRow
                        label="지난10회차 회귀"
                        value={joinNumbers(
                          selectedRow.repeatedNumbersFromLast10,
                        )}
                        className="lg:col-span-2"
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">강조 기준</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        전회차 회귀 3개 이상이면 강한 반복 회차로 표시합니다.
                      </p>
                      <p>
                        지난3회차 회귀 4개 이상이면 최근 흐름 집중 회차로
                        봅니다.
                      </p>
                      <p>
                        동일끝수 또는 동일구간이 3 이상이면 패턴 집중으로
                        강조합니다.
                      </p>
                      <p>AC 4 이하는 패턴 밀집 회차로 간주합니다.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableHead({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <ArrowDownUp className={cn("h-3.5 w-3.5", active && "text-primary")} />
        {active && (
          <span className="text-xs">{direction === "desc" ? "↓" : "↑"}</span>
        )}
      </button>
    </TableHead>
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
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold shadow-sm transition-transform",
        size === "lg" ? "h-12 w-12 text-sm" : "h-8 w-8 text-xs",
        outlined ? "border-2 bg-background" : "text-white",
        highlighted && "scale-105 ring-2 ring-rose-500 ring-offset-2",
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

function MetricCard({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-4 shadow-sm",
        emphasized && "border-amber-300 bg-amber-50/70",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-xl font-semibold tracking-tight",
          emphasized && "text-amber-700",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background px-4 py-3 shadow-sm",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm",
        emphasized && "border-amber-300 bg-amber-50/70",
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn("text-lg font-semibold", emphasized && "text-amber-700")}
      >
        {value}
      </span>
    </div>
  );
}

function RegressionChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-sm shadow-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PatternPill({ value, active }: { value: number; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-1 text-sm font-semibold",
        active ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground",
      )}
    >
      {value}
    </span>
  );
}

function joinNumbers(numbers: number[]) {
  return numbers.length > 0 ? numbers.join(", ") : "없음";
}
