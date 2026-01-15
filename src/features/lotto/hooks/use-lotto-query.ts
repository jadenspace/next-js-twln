import { useQuery } from "@tanstack/react-query";
import { lottoApi, LottoResultDto } from "../api/lotto-api";
import { BasicStats } from "../types";
import { FilterValues } from "../components/stats-filter";

// 1. 최신 회차 조회 (1시간 캐시)
export const useLottoLatest = () => {
  return useQuery({
    queryKey: ["lotto", "latest"],
    queryFn: () => lottoApi.getLatestDraw(),
    staleTime: 1000 * 60 * 60, // 1시간
  });
};

// 2. 특정 회차 조회 (무한 캐시)
export const useLottoDraw = (drawNo: number) => {
  return useQuery({
    queryKey: ["lotto", "draw", drawNo],
    queryFn: async () => {
      const data = await lottoApi.fetchLottoDraw(drawNo);
      // 데이터가 없으면 에러를 던져서 캐시에 저장되지 않도록 하거나
      // null을 반환하고 staleTime을 조정할 수 있음.
      // 여기서는 null이면 catch되어 재시도 로직을 따르거나 null 상태로 남음.
      // 하지만 staleTime 함수를 통해 데이터가 있을 때만 Infinity로 설정.
      return data;
    },
    enabled: !!drawNo && drawNo > 0,
    staleTime: (query) => {
      // 데이터가 성공적으로 있으면 무한 캐시, 없으면(null 등) 0
      return query.state.data ? Infinity : 0;
    },
  });
};

// 3. 번호별 통계 조회 (무한 캐시 - 과거 회차 데이터는 변하지 않음)
export const useLottoNumberStats = <T = BasicStats>(
  filters?: FilterValues,
  extraParams?: Record<string, any>,
) => {
  return useQuery({
    queryKey: ["lotto", "stats", "numbers", filters, extraParams],
    queryFn: async () => {
      const res = await fetch("/api/lotto/analysis/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(filters || {}), ...extraParams }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "분석에 실패했습니다.");
      }
      return res.json() as Promise<{ data: T }>;
    },
    staleTime: (query) => {
      // 데이터가 성공적으로 있으면 무한 캐시, 없으면 0
      // 필터에 startDraw/endDraw가 포함되어 새 회차 추가시 자동으로 새 쿼리키 생성
      return query.state.data ? Infinity : 0;
    },
  });
};
