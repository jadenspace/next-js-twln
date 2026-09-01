"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { isServiceUnavailable } from "@/shared/lib/service-status";

/**
 * 전역 장애 배너. QueryCache 를 구독해 서비스 불가(503/네트워크) 오류가
 * 감지되면 표시하고, 이후 아무 쿼리든 성공하면 자동으로 해제한다.
 * 별도 헬스체크 폴링을 하지 않으므로 Supabase 에 추가 부하가 없다.
 */
export function ServiceStatusBanner() {
  const queryClient = useQueryClient();
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    return cache.subscribe((event) => {
      if (event.type !== "updated") return;

      if (event.action.type === "error") {
        if (isServiceUnavailable(event.query.state.error)) {
          setDegraded(true);
        }
      } else if (event.action.type === "success") {
        setDegraded(false);
      }
    });
  }, [queryClient]);

  if (!degraded) return null;

  return (
    <div
      role="status"
      className="bg-amber-500/95 px-4 py-2 text-center text-sm font-medium text-black"
    >
      일시적으로 서비스 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.
    </div>
  );
}
