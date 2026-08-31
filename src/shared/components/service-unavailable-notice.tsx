"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

/** 데이터 영역이 장애로 비었을 때 빈 카드 대신 보여주는 안내. */
export function ServiceUnavailableNotice({
  onRetry,
  message = "일시적으로 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
  className,
}: {
  onRetry?: () => void;
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8 text-center",
        className,
      )}
    >
      <CloudOff className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      )}
    </div>
  );
}
