"use client";

import { useState } from "react";
import { format, subMonths } from "date-fns";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { cn } from "@/shared/lib/utils";
import {
  MAX_RANGE_SIZE,
  MAX_SEARCH_NUMBERS,
  type LottoSearchQuery,
} from "../../lib/search-query";
import { NumberGrid } from "./number-grid";

type SearchMode = "range" | "date" | "numbers";

const MODES: { value: SearchMode; label: string }[] = [
  { value: "range", label: "회차로 검색" },
  { value: "date", label: "날짜로 검색" },
  { value: "numbers", label: "번호로 검색" },
];

const DEFAULT_RANGE_SIZE = 10;
const today = () => format(new Date(), "yyyy-MM-dd");

interface SearchFormProps {
  latestDrawNo: number | null;
  isPending: boolean;
  /** null 이면 조건 없이 최근 회차를 조회한다 */
  onSubmit: (query: LottoSearchQuery | null) => void;
}

export function SearchForm({
  latestDrawNo,
  isPending,
  onSubmit,
}: SearchFormProps) {
  const [mode, setMode] = useState<SearchMode>("range");
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [includeBonus, setIncludeBonus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: SearchMode) => {
    setMode(next);
    setError(null);
  };

  const pickRecentDraws = (count: number) => {
    if (!latestDrawNo) return;
    setStartText(String(Math.max(1, latestDrawNo - count + 1)));
    setEndText(String(latestDrawNo));
    setError(null);
  };

  const pickRecentMonths = (months: number) => {
    setDateStart(format(subMonths(new Date(), months), "yyyy-MM-dd"));
    setDateEnd(today());
    setError(null);
  };

  const reset = () => {
    setStartText("");
    setEndText("");
    setDateStart("");
    setDateEnd("");
    setNumbers([]);
    setIncludeBonus(false);
    setError(null);
    onSubmit(null);
  };

  const submitRange = () => {
    const endInput = endText ? Number(endText) : latestDrawNo;
    if (!endInput) {
      setError("종료 회차를 입력해 주세요.");
      return;
    }
    const startInput = startText
      ? Number(startText)
      : Math.max(1, endInput - DEFAULT_RANGE_SIZE + 1);
    if (
      !Number.isInteger(startInput) ||
      !Number.isInteger(endInput) ||
      startInput < 1
    ) {
      setError("회차는 1 이상의 정수여야 합니다.");
      return;
    }
    const [start, end] =
      startInput > endInput ? [endInput, startInput] : [startInput, endInput];
    if (end - start + 1 > MAX_RANGE_SIZE) {
      setError(`한 번에 최대 ${MAX_RANGE_SIZE}회차까지 조회할 수 있습니다.`);
      return;
    }
    setError(null);
    onSubmit({ drwNoStart: start, drwNoEnd: end, includeBonus: false });
  };

  const submitDate = () => {
    if (!dateStart && !dateEnd) {
      setError("시작 날짜 또는 종료 날짜를 입력해 주세요.");
      return;
    }
    const [start, end] =
      dateStart && dateEnd && dateStart > dateEnd
        ? [dateEnd, dateStart]
        : [dateStart, dateEnd];
    setError(null);
    onSubmit({
      dateStart: start || undefined,
      dateEnd: end || undefined,
      includeBonus: false,
    });
  };

  const submitNumbers = () => {
    if (numbers.length === 0) {
      setError("찾을 번호를 하나 이상 선택해 주세요.");
      return;
    }
    setError(null);
    onSubmit({ numbers, includeBonus });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "range") submitRange();
    else if (mode === "date") submitDate();
    else submitNumbers();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
      <div
        role="tablist"
        aria-label="검색 방식"
        className="flex flex-wrap gap-2"
      >
        {MODES.map((m) => (
          <Button
            key={m.value}
            type="button"
            role="tab"
            aria-selected={mode === m.value}
            size="sm"
            variant={mode === m.value ? "default" : "outline"}
            onClick={() => switchMode(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {mode === "range" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="drwNoStart"
                className="text-xs text-muted-foreground"
              >
                시작 회차
              </Label>
              <Input
                id="drwNoStart"
                type="number"
                inputMode="numeric"
                min={1}
                max={latestDrawNo ?? undefined}
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                placeholder={
                  latestDrawNo
                    ? String(Math.max(1, latestDrawNo - DEFAULT_RANGE_SIZE + 1))
                    : "예: 1100"
                }
                className="w-[120px]"
              />
            </div>
            <span className="text-muted-foreground pb-2">~</span>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="drwNoEnd"
                className="text-xs text-muted-foreground"
              >
                종료 회차
              </Label>
              <Input
                id="drwNoEnd"
                type="number"
                inputMode="numeric"
                min={1}
                max={latestDrawNo ?? undefined}
                value={endText}
                onChange={(e) => setEndText(e.target.value)}
                placeholder={latestDrawNo ? String(latestDrawNo) : "예: 1110"}
                className="w-[120px]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30].map((count) => (
              <Button
                key={count}
                type="button"
                variant="outline"
                size="sm"
                disabled={!latestDrawNo}
                onClick={() => pickRecentDraws(count)}
              >
                최근 {count}회
              </Button>
            ))}
          </div>
        </div>
      )}

      {mode === "date" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="dateStart"
                className="text-xs text-muted-foreground"
              >
                시작 날짜
              </Label>
              <Input
                id="dateStart"
                type="date"
                max={today()}
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <span className="text-muted-foreground pb-2">~</span>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="dateEnd"
                className="text-xs text-muted-foreground"
              >
                종료 날짜
              </Label>
              <Input
                id="dateEnd"
                type="date"
                max={today()}
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-[160px]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { months: 3, label: "최근 3개월" },
              { months: 6, label: "최근 6개월" },
              { months: 12, label: "최근 1년" },
            ].map((pick) => (
              <Button
                key={pick.months}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => pickRecentMonths(pick.months)}
              >
                {pick.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {mode === "numbers" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            선택한 번호가 모두 포함된 회차를 찾습니다. 최대 {MAX_SEARCH_NUMBERS}
            개까지 고를 수 있습니다.
          </p>
          <NumberGrid
            selected={numbers}
            onChange={setNumbers}
            max={MAX_SEARCH_NUMBERS}
            className="max-w-md"
          />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="includeBonus"
                checked={includeBonus}
                onCheckedChange={setIncludeBonus}
              />
              <Label htmlFor="includeBonus" className="text-sm">
                보너스 번호도 포함해서 찾기
              </Label>
            </div>
            {numbers.length > 0 && (
              <button
                type="button"
                onClick={() => setNumbers([])}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                선택 해제
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending} className="gap-2">
          <Search className="h-4 w-4" />
          검색
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          className="gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          초기화
        </Button>
        {error && (
          <p role="alert" className={cn("text-sm text-destructive")}>
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
