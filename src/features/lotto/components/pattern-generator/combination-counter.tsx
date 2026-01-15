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
    bgColor:
      "bg-emerald-50/50 border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-800/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
    iconBgColor: "bg-emerald-100/80 dark:bg-emerald-900/50",
    icon: CheckCircle,
  },
  recommended: {
    bgColor:
      "bg-sky-50/50 border-sky-200/60 dark:bg-sky-950/30 dark:border-sky-800/40",
    textColor: "text-sky-600 dark:text-sky-400",
    iconBgColor: "bg-sky-100/80 dark:bg-sky-900/50",
    icon: ThumbsUp,
  },
  warning: {
    bgColor:
      "bg-orange-50/50 border-orange-200/60 dark:bg-orange-950/30 dark:border-orange-800/40",
    textColor: "text-orange-600 dark:text-orange-400",
    iconBgColor: "bg-orange-100/80 dark:bg-orange-900/50",
    icon: AlertTriangle,
  },
  excessive: {
    bgColor:
      "bg-rose-50/50 border-rose-200/60 dark:bg-rose-950/30 dark:border-rose-800/40",
    textColor: "text-rose-600 dark:text-rose-400",
    iconBgColor: "bg-rose-100/80 dark:bg-rose-900/50",
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
        bgColor:
          "bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800",
        textColor: "text-slate-700 dark:text-slate-300",
        iconBgColor: "bg-slate-100 dark:bg-slate-900",
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
    <Card className={cn("border-2 transition-colors", config.bgColor)}>
      <CardContent className="py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", config.iconBgColor)}>
              <Icon className={cn("w-6 h-6", config.textColor)} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-3xl font-black", config.textColor)}>
                  {isCalculating ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    info.total.toLocaleString()
                  )}
                </span>
                <span className="text-sm text-muted-foreground">조합</span>
              </div>
              <p className="text-sm text-muted-foreground">
                / {TOTAL_COMBINATIONS.toLocaleString()} 전체 (
                {info.percentage.toFixed(2)}%)
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-sm px-3 py-1 bg-muted/70 dark:bg-muted/40",
                config.textColor,
              )}
            >
              {statusLabel}
            </Badge>
            <p className={cn("text-sm", config.textColor)}>{statusMessage}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
