"use client";

import React from "react";
import { QrCheckResult, LottoRank } from "../../types/qr.types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { LotteryBall, BonusLotteryBall } from "@/shared/ui/lottery-ball";
import { formatWon } from "../../lib/format-won";
import { RefreshCw, Calculator, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

interface QrResultReceiptProps {
  result: QrCheckResult;
  onReset: () => void;
}

export function QrResultReceipt({ result, onReset }: QrResultReceiptProps) {
  const isWinner = result.totalPrize > 0;

  const getRankBadge = (rank: LottoRank) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-2 py-0.5 shadow-sm animate-pulse">
            👑 1등 당첨
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-2 py-0.5 shadow-sm">
            🥈 2등 당첨
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2 py-0.5">
            🥉 3등 당첨
          </Badge>
        );
      case 4:
        return (
          <Badge
            variant="secondary"
            className="font-semibold text-xs text-foreground"
          >
            4등 (5만 원)
          </Badge>
        );
      case 5:
        return (
          <Badge
            variant="outline"
            className="font-semibold text-xs text-muted-foreground"
          >
            5등 (5천 원)
          </Badge>
        );
      default:
        return (
          <span className="text-xs text-muted-foreground/60 font-medium">
            낙첨
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* 종이 복권 영수증 스타일 카드 */}
      <div className="relative bg-card border-2 border-border/80 rounded-2xl shadow-xl overflow-hidden">
        {/* 영수증 상단 헤더 데코 */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-dashed">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest text-primary uppercase">
                  LOTTO 6/45
                </span>
                {result.isDrawPending && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Clock className="w-3 h-3 text-amber-500" /> 추첨 대기
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight mt-1">
                제 {result.drawNo}회 복권 결과
              </h2>
              {result.drawDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  추첨일: {result.drawDate}
                </p>
              )}
            </div>

            {/* 최고 등수 배지 */}
            {isWinner && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground">
                  최고 결과
                </span>
                {getRankBadge(result.highestRank)}
              </div>
            )}
          </div>

          {/* 공식 당첨 번호 (추첨 완료 시) */}
          {!result.isDrawPending && result.winningNumbers && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span className="font-semibold">해당 회차 당첨 번호</span>
                <span>+ 보너스</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {result.winningNumbers.map((num) => (
                  <LotteryBall key={num} number={num} size="sm" />
                ))}
                <span className="text-muted-foreground text-sm font-bold mx-1">
                  +
                </span>
                {result.bonusNumber && (
                  <BonusLotteryBall
                    number={result.bonusNumber}
                    size="sm"
                    highlighted
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* 각 게임별 번호 및 당첨 상세 */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {result.games.map((game) => (
              <div
                key={game.label}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-colors",
                  game.rank !== "fail"
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-muted/30",
                )}
              >
                {/* 게임 라벨 (A, B, C...) */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="w-5 h-5 rounded-md bg-secondary text-[11px] font-black flex items-center justify-center text-secondary-foreground shrink-0">
                    {game.label}
                  </span>

                  {/* 6개 번호 목록 */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {game.numbers.map((num) => {
                      const isMatched = game.matchedNumbers.includes(num);
                      const isBonusMatched =
                        game.bonusMatched && num === result.bonusNumber;

                      return (
                        <LotteryBall
                          key={num}
                          number={num}
                          size="sm"
                          highlighted={isMatched || isBonusMatched}
                          dimmed={
                            !isMatched &&
                            !isBonusMatched &&
                            !result.isDrawPending
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 결과 등수 및 당첨금 */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <div>{getRankBadge(game.rank)}</div>
                  {game.prizeAmount > 0 && (
                    <span className="text-xs font-bold text-foreground mt-0.5">
                      {formatWon(game.prizeAmount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 총 당첨금 요약 섹션 */}
          <div className="mt-6 pt-6 border-t-2 border-dashed border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 -mx-6 -mb-6 p-6">
            <div>
              <p className="text-xs text-muted-foreground">총 당첨 게임 수</p>
              <p className="text-sm font-bold text-foreground">
                {result.winningGamesCount} / {result.games.length} 게임
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">총 수령 예상 금액</p>
              <p
                className={cn(
                  "text-2xl font-black tracking-tight",
                  isWinner ? "text-primary" : "text-muted-foreground",
                )}
              >
                {result.isDrawPending
                  ? "추첨 대기"
                  : result.totalPrize > 0
                    ? `${result.totalPrize.toLocaleString()} 원`
                    : "0 원"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 그룹 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 당첨금이 있는 경우 세금 계산기 바로가기 */}
        {isWinner && result.totalPrize > 0 && (
          <Link
            href={`/lotto/tax-calculator?amount=${result.totalPrize}`}
            className="flex-1"
          >
            <Button className="w-full gap-2 font-bold bg-gradient-to-r from-amber-500 to-primary hover:opacity-90 text-white">
              <Calculator className="w-4 h-4" /> 실수령액(세금) 계산하기
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}

        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1 gap-2 font-bold"
        >
          <RefreshCw className="w-4 h-4" /> 다른 복권 스캔하기
        </Button>
      </div>
    </div>
  );
}
