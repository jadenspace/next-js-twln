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
      "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    textColor: "text-green-700 dark:text-green-300",
    iconBgColor: "bg-green-100 dark:bg-green-900",
    icon: CheckCircle,
  },
  recommended: {
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300",
    iconBgColor: "bg-blue-100 dark:bg-blue-900",
    icon: ThumbsUp,
  },
  warning: {
    bgColor:
      "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    textColor: "text-amber-700 dark:text-amber-300",
    iconBgColor: "bg-amber-100 dark:bg-amber-900",
    icon: AlertTriangle,
  },
  excessive: {
    bgColor: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-300",
    iconBgColor: "bg-red-100 dark:bg-red-900",
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
