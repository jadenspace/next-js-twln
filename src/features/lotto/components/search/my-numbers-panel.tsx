"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Ticket } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { LotteryBall } from "@/shared/ui/lottery-ball";
import { Spinner } from "@/shared/ui/spinner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { RankSummary } from "../../lib/check-my-numbers";
import { useSavedNumbers } from "../../hooks/use-saved-numbers";
import { NumberGrid } from "./number-grid";

const LOTTO_PICK_SIZE = 6;

interface MyNumbersPanelProps {
  value: number[];
  onChange: (numbers: number[]) => void;
  /** 6개가 모두 선택돼 검색 결과에 대본 집계. 없으면 표시하지 않는다. */
  summary: RankSummary | null;
}

function SummaryLine({ summary }: { summary: RankSummary }) {
  const wins = ([1, 2, 3, 4, 5] as const)
    .filter((rank) => summary.byRank[rank] > 0)
    .map((rank) => `${rank}등 ${summary.byRank[rank]}회`);
  return (
    <p className="text-sm">
      검색된 <span className="font-semibold">{summary.total}회차</span> 중{" "}
      {wins.length > 0 ? (
        <span className="font-semibold text-primary">{wins.join(" · ")}</span>
      ) : (
        <span className="text-muted-foreground">당첨 없음</span>
      )}
      <span className="text-muted-foreground"> · 낙첨 {summary.noWin}회</span>
    </p>
  );
}

function SavedNumbersPicker({
  onPick,
}: {
  onPick: (numbers: number[]) => void;
}) {
  const { data, isLoading, isError } = useSavedNumbers(true);

  if (isLoading) {
    return (
      <div className="py-3 text-center">
        <Spinner className="text-primary" />
      </div>
    );
  }
  if (isError) {
    return (
      <p className="text-xs text-destructive">
        저장된 번호를 불러오지 못했습니다.
      </p>
    );
  }
  if (!data || data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        저장한 번호가 없습니다. 시뮬레이션이나 패턴 생성기에서 번호를 저장해
        보세요.
      </p>
    );
  }
  return (
    <ul className="grid gap-2 max-h-56 overflow-y-auto pr-1">
      {data.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onPick(item.numbers)}
            className="w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2 hover:bg-muted transition-colors"
          >
            <span className="flex gap-1">
              {item.numbers.map((n) => (
                <LotteryBall key={n} number={n} size="sm" />
              ))}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0">
              {item.source === "simulation" ? "시뮬레이션" : "패턴 생성기"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MyNumbersPanel({
  value,
  onChange,
  summary,
}: MyNumbersPanelProps) {
  const [open, setOpen] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const { isAuthenticated } = useAuth();
  const isComplete = value.length === LOTTO_PICK_SIZE;

  return (
    <Card className="mb-6">
      <CardHeader className="py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Ticket className="h-4 w-4 text-primary" />내 번호 당첨 확인
            {isComplete && (
              <span className="hidden sm:flex gap-1 ml-1">
                {value.map((n) => (
                  <LotteryBall key={n} number={n} size="sm" />
                ))}
              </span>
            )}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {isComplete && summary && (
          <div className="pt-2">
            <SummaryLine summary={summary} />
          </div>
        )}
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4">
          <p className="text-xs text-muted-foreground">
            번호 {LOTTO_PICK_SIZE}개를 고르면 검색된 모든 회차에 대보고 등수를
            표시합니다.
            {!isComplete &&
              value.length > 0 &&
              ` (${value.length}/${LOTTO_PICK_SIZE})`}
          </p>
          <NumberGrid
            selected={value}
            onChange={onChange}
            max={LOTTO_PICK_SIZE}
            className="max-w-md"
          />
          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSaved((v) => !v)}
              >
                {showSaved ? "저장한 번호 닫기" : "저장한 번호에서 선택"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                로그인하면 저장한 번호를 바로 불러올 수 있습니다.
              </p>
            )}
            {value.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange([])}
              >
                선택 해제
              </Button>
            )}
          </div>
          {isAuthenticated && showSaved && (
            <SavedNumbersPicker
              onPick={(numbers) => {
                onChange([...numbers].sort((a, b) => a - b));
                setShowSaved(false);
              }}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
