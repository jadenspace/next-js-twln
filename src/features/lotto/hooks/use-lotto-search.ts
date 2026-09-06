import { useQuery } from "@tanstack/react-query";
import { ServiceUnavailableError } from "@/shared/lib/service-status";
import type { LottoDraw } from "../types";
import type { LottoSearchQuery } from "../lib/search-query";

export interface LottoSearchResult {
  data: LottoDraw[];
  truncated: boolean;
}

export function toSearchParams(query: LottoSearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.drwNoStart !== undefined) {
    params.set("drwNoStart", String(query.drwNoStart));
  }
  if (query.drwNoEnd !== undefined)
    params.set("drwNoEnd", String(query.drwNoEnd));
  if (query.dateStart) params.set("dateStart", query.dateStart);
  if (query.dateEnd) params.set("dateEnd", query.dateEnd);
  if (query.numbers && query.numbers.length > 0) {
    params.set("numbers", query.numbers.join(","));
    if (query.includeBonus) params.set("includeBonus", "1");
  }
  return params;
}

/**
 * 당첨번호 검색. query 가 null 이면 최근 회차 기본 조회다.
 * 과거 회차 데이터는 바뀌지 않으므로 조건 검색은 무한 캐시하고,
 * 기본 조회만 새 회차 반영을 위해 1시간 뒤 다시 받는다.
 */
export function useLottoSearch(query: LottoSearchQuery | null) {
  return useQuery<LottoSearchResult, Error>({
    queryKey: ["lotto", "search", query ?? "latest"],
    queryFn: async () => {
      const params = query ? toSearchParams(query) : new URLSearchParams();
      const res = await fetch(`/api/lotto/search?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 503) throw new ServiceUnavailableError();
        const body = await res.json().catch(() => ({ error: null }));
        throw new Error(body.error || "검색에 실패했습니다.");
      }
      return res.json();
    },
    staleTime: query ? Infinity : 1000 * 60 * 60,
    retry: (count, error) =>
      !(error instanceof ServiceUnavailableError) && count < 1,
  });
}
