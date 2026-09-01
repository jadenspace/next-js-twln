"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { isServiceUnavailable } from "@/shared/lib/service-status";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
            // 장애(503/네트워크) 시 재시도 폭풍이 죽어가는 Supabase 에 부하를
            // 더하고, 과금 쿼리에서는 중복 차감 사고로 이어진다
            // (use-lotto-query.ts 의 800P 소진 사례 참고).
            retry: (failureCount, error) =>
              !isServiceUnavailable(error) && failureCount < 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
