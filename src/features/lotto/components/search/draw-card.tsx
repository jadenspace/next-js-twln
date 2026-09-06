"use client";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { BonusLotteryBall, LotteryBall } from "@/shared/ui/lottery-ball";
import { cn } from "@/shared/lib/utils";
import type { LottoDraw } from "../../types";
import type { MyNumbersCheck } from "../../lib/check-my-numbers";
import { hasNoFirstPrizeWinner } from "../../lib/draw-details";
import {
  getDrawNumbers,
  type DrawTrendRow,
} from "../../lib/draw-trend-analysis";
import { formatWon } from "../../lib/format-won";
import { DrawDetailDialog } from "./draw-detail-dialog";

interface DrawCardProps {
  draw: LottoDraw;
  /** buildDrawTrendRows 로 계산한 이 회차의 패턴 지표 */
  pattern?: DrawTrendRow;
  /**
   * 직전 회차 재출현 정보를 보여줄지. 결과가 연속 회차가 아니거나
   * 이 회차가 결과 중 가장 오래된 회차면 직전 회차가 없어 의미가 없다.
   */
  showPreviousRepeat: boolean;
  /** 번호 검색 조건. 일치하는 공을 강조한다. */
  highlightNumbers?: number[];
  highlightBonus?: boolean;
  /** 내 번호 당첨 확인 결과. 있으면 맞은 공만 남기고 나머지는 흐리게 한다. */
  myCheck?: MyNumbersCheck;
}

function rankBadgeClass(rank: MyNumbersCheck["rank"]) {
  if (rank === 1) return "bg-amber-500 text-white border-transparent";
  if (rank === 2)
    return "bg-primary text-primary-foreground border-transparent";
  if (rank >= 3) return "bg-emerald-600 text-white border-transparent";
  return "";
}

function PatternChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
      <span>{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

export function DrawCard({
  draw,
  pattern,
  showPreviousRepeat,
  highlightNumbers,
  highlightBonus = false,
  myCheck,
}: DrawCardProps) {
  const numbers = getDrawNumbers(draw);
  const highlightSet = new Set(highlightNumbers ?? []);
  const matchedSet = new Set(myCheck?.matched ?? []);

  const isMainHighlighted = (n: number) =>
    myCheck ? matchedSet.has(n) : highlightSet.has(n);
  const isMainDimmed = (n: number) => (myCheck ? !matchedSet.has(n) : false);
  const isBonusHighlighted = myCheck
    ? myCheck.bonusMatched
    : highlightBonus && highlightSet.has(draw.bnus_no);
  const isBonusDimmed = myCheck ? !myCheck.bonusMatched : false;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50 py-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {draw.drw_no}회
              </span>
              {hasNoFirstPrizeWinner(draw) && (
                <Badge
                  variant="outline"
                  className="text-[11px] border-destructive/50 text-destructive"
                >
                  1등 없음
                </Badge>
              )}
              {myCheck && (
                <Badge
                  variant={myCheck.rank === 0 ? "secondary" : "default"}
                  className={cn("text-[11px]", rankBadgeClass(myCheck.rank))}
                >
                  {myCheck.rank === 0 ? "낙첨" : `${myCheck.rank}등`}
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground leading-none md:leading-normal">
              ({draw.drw_no_date})
            </span>
          </div>
          <div className="text-sm font-medium text-right shrink-0">
            1등 {formatWon(draw.first_win_amnt)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {numbers.map((num) => (
            <LotteryBall
              key={num}
              number={num}
              highlighted={isMainHighlighted(num)}
              dimmed={isMainDimmed(num)}
            />
          ))}
          <div className="w-full md:w-auto" />
          <span className="text-xs text-muted-foreground">보너스</span>
          <BonusLotteryBall
            number={draw.bnus_no}
            highlighted={isBonusHighlighted}
            dimmed={isBonusDimmed}
          />
        </div>

        {pattern && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            <PatternChip label="홀짝" value={pattern.oddEvenRatio} />
            <PatternChip label="고저" value={pattern.highLowRatio} />
            <PatternChip label="합" value={String(pattern.sum)} />
            <PatternChip label="AC" value={String(pattern.ac)} />
            <PatternChip
              label="연번"
              value={String(pattern.consecutiveCount)}
            />
            {showPreviousRepeat && (
              <PatternChip
                label="직전 재출현"
                value={
                  pattern.repeatedNumbersFromPrevious.length > 0
                    ? pattern.repeatedNumbersFromPrevious.join(", ")
                    : "없음"
                }
              />
            )}
          </div>
        )}

        <div className="text-center">
          <DrawDetailDialog draw={draw} />
        </div>
      </CardContent>
    </Card>
  );
}
