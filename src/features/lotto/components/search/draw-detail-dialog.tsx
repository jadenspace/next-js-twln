"use client";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { BonusLotteryBall, LotteryBall } from "@/shared/ui/lottery-ball";
import type { LottoDraw } from "../../types";
import {
  getPrizePoolAmount,
  getRankRows,
  getTotalSalesAmount,
  getWinTypeBreakdown,
  hasRankDetails,
} from "../../lib/draw-details";
import { getDrawNumbers } from "../../lib/draw-trend-analysis";
import { formatWon } from "../../lib/format-won";

const RANK_NOTE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "당첨번호 6개 일치",
  2: "당첨번호 5개 + 보너스 번호 일치",
  3: "당첨번호 5개 일치",
  4: "당첨번호 4개 일치",
  5: "당첨번호 3개 일치",
};

function Stat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-muted/50 p-3 rounded-md min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`font-semibold break-all ${emphasis ? "text-primary text-base" : "text-sm"}`}
      >
        {value}
      </p>
    </div>
  );
}

export function DrawDetailDialog({ draw }: { draw: LottoDraw }) {
  const rankRows = getRankRows(draw);
  const first = rankRows[0];
  const winType = getWinTypeBreakdown(draw);
  const totalSales = getTotalSalesAmount(draw);
  const prizePool = getPrizePoolAmount(draw);
  const totalWinners = Number(draw.sum_win_nope ?? 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">당첨정보 상세보기</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="sticky top-0 bg-background px-6 pt-6 pb-4 border-b z-10">
          <DialogTitle>
            <span className="text-primary">{draw.drw_no}회</span> 당첨 상세정보
          </DialogTitle>
          <DialogDescription>({draw.drw_no_date})</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6 overflow-y-auto px-6 flex-1">
          <section>
            <h3 className="text-base font-semibold mb-3 text-center">
              당첨번호
            </h3>
            <div className="flex flex-wrap gap-2 justify-center items-center">
              {getDrawNumbers(draw).map((num) => (
                <LotteryBall key={num} number={num} />
              ))}
              <span className="text-sm text-muted-foreground ml-2">보너스</span>
              <BonusLotteryBall number={draw.bnus_no} />
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3 text-center">
              1등 당첨정보
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="1등 당첨 게임 수"
                value={`${first.winners.toLocaleString("ko-KR")}게임`}
              />
              <Stat
                label="1게임당 당첨금"
                value={formatWon(first.amount)}
                emphasis
              />
              {first.totalAmount > 0 && (
                <Stat
                  label="1등 총 당첨금"
                  value={formatWon(first.totalAmount)}
                />
              )}
              {winType && (
                <Stat
                  label="자동 / 수동 / 반자동"
                  value={`${winType.auto} / ${winType.manual} / ${winType.semiAuto}`}
                />
              )}
            </div>
          </section>

          {hasRankDetails(draw) && (
            <section>
              <h3 className="text-base font-semibold mb-3 text-center">
                등위별 당첨정보
              </h3>
              <div className="space-y-2 text-sm">
                {rankRows.map((row) => (
                  <div
                    key={row.rank}
                    className="p-3 bg-muted/50 rounded-md grid grid-cols-[auto_1fr] items-center gap-3"
                  >
                    <div>
                      <p className="font-bold text-base">{row.rank}등</p>
                      <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {RANK_NOTE[row.rank]}
                      </p>
                    </div>
                    <div className="text-right min-w-0">
                      <p className="font-semibold">{formatWon(row.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.winners.toLocaleString("ko-KR")}게임
                        {row.totalAmount > 0 &&
                          ` · 총 ${formatWon(row.totalAmount)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(totalWinners > 0 || totalSales !== null || prizePool !== null) && (
            <section className="pb-2">
              <h3 className="text-base font-semibold mb-3 text-center">
                회차 통계
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {totalSales !== null && (
                  <Stat label="총판매금액" value={formatWon(totalSales)} />
                )}
                {prizePool !== null && (
                  <Stat
                    label="당첨금 재원 (판매금액의 50%)"
                    value={formatWon(prizePool)}
                  />
                )}
                {totalWinners > 0 && (
                  <Stat
                    label="전체 당첨 게임 수"
                    value={`${totalWinners.toLocaleString("ko-KR")}게임`}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
