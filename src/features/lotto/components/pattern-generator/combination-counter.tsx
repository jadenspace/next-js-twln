"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { CheckCircle, ThumbsUp, AlertTriangle, Loader2 } from "lucide-react";
import type { CombinationInfo } from "../../types/pattern-filter.types";
import { CombinationCalculator } from "../../services/combination-calculator";
import { TOTAL_COMBINATIONS } from "../../types/pattern-filter.types";

interface CombinationCounterProps {
  info: CombinationInfo | null;
  isCalculating: boolean;
}

const STATUS_CONFIG = {
  comfortable: {
    badgeColor: "bg-emerald-500 text-white",
    dotColor: "bg-emerald-500",
    icon: CheckCircle,
  },
  recommended: {
    badgeColor: "bg-sky-500 text-white",
    dotColor: "bg-sky-500",
    icon: ThumbsUp,
  },
  warning: {
    badgeColor: "bg-amber-500 text-white",
    dotColor: "bg-amber-500",
    icon: AlertTriangle,
  },
  excessive: {
    badgeColor: "bg-rose-500 text-white",
    dotColor: "bg-rose-500",
    icon: AlertTriangle,
  },
};

export function CombinationCounter({
  info,
  isCalculating,
}: CombinationCounterProps) {
  if (!info) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>경우의 수 계산 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isHardLimit = info.total <= 5;
  const isUnfiltered = info.total === TOTAL_COMBINATIONS;
  const displayStatus =
    info.status === "excessive" && !isHardLimit ? "warning" : info.status;
  const config = isUnfiltered
    ? {
        badgeColor: "bg-slate-500 text-white",
        dotColor: "bg-slate-400",
        icon: AlertTriangle,
      }
    : STATUS_CONFIG[displayStatus];
  const Icon = config.icon;
  const statusLabel = isUnfiltered
    ? "필터 필요"
    : CombinationCalculator.getStatusLabel(info.status);
  const statusMessage = isUnfiltered
    ? "필터를 적용해 주세요."
    : CombinationCalculator.getStatusMessage(info.status);

  return (
    <Card className="border bg-card">
      <CardContent className="py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-10 rounded-full", config.dotColor)} />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {isCalculating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    info.total.toLocaleString()
                  )}
                </span>
                <span className="text-sm text-muted-foreground">조합</span>
              </div>
              <p className="text-xs text-muted-foreground">
                전체 {TOTAL_COMBINATIONS.toLocaleString()}개 중{" "}
                {info.percentage.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={cn("text-xs px-2.5 py-0.5", config.badgeColor)}>
              <Icon className="w-3 h-3 mr-1" />
              {statusLabel}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {statusMessage}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
