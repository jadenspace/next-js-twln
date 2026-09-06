export interface LottoStore {
  id: string;
  name: string;
  address: string;
  roadAddress?: string;
  telephone?: string;
  latitude: number;
  longitude: number;
  /** 역대 1등 배출 횟수 */
  firstPrizeCount: number;
  /** 역대 2등 배출 횟수 */
  secondPrizeCount: number;
  /** 특이사항 (예: 전국 1위 명당, 로또휴게실 등) */
  badge?: string;
  /** 시/도 구분 (예: 서울, 경기, 부산 등) */
  region: string;
  /** 내 위치 기준 거리 (km) - 계산 후 주입 */
  distanceKm?: number;
  /** 최근 1등 배출 회차 또는 비고 */
  description?: string;
}

export type StoreFilterMode = "ranking" | "nearby" | "region";

export interface StoreFilterState {
  mode: StoreFilterMode;
  radiusKm: number; // 1, 3, 5, 10, 20
  region: string; // "전체" | "서울" | "경기" | "부산" ...
  searchKeyword: string;
}
