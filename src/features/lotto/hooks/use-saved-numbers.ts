import { useQuery } from "@tanstack/react-query";

export interface SavedLottoNumbers {
  id: string;
  numbers: number[];
  source: "simulation" | "pattern_generator";
  created_at: string;
}

/**
 * 로그인 사용자가 저장한 번호 목록. 내 번호 당첨 확인에서 고르기 위한 용도라
 * 최근 50건만 가져온다.
 */
export function useSavedNumbers(enabled: boolean) {
  return useQuery<SavedLottoNumbers[], Error>({
    queryKey: ["lotto", "saved-numbers", "picker"],
    enabled,
    queryFn: async () => {
      const res = await fetch("/api/lotto/saved-numbers?limit=50");
      if (!res.ok) throw new Error("저장된 번호를 불러오지 못했습니다.");
      const body = await res.json();
      return (body.data ?? []) as SavedLottoNumbers[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
