# 로또 통계 데이터 로드 및 캐싱 전략 가이드

이 문서는 로또 통계 분석 페이지(`src/app/(dashboard)/lotto/analysis/stats/*`)에서 적용된 **데이터 로딩 최적화**와 **TanStack Query 기반 캐싱 전략**에 대해 기술합니다.

## 1. 개요 (Overview)

기존의 분석 페이지는 사용자가 필터를 설정하고 '조회' 버튼을 눌러야만 데이터를 가져오는 수동(`useMutation`) 방식이었습니다. 이를 개선하여 페이지 진입 시 **가장 최신 데이터(전체 회차)**를 자동으로 보여주고, 조회된 데이터는 **클라이언트 사이드에 캐싱**하여 UX를 대폭 향상시켰습니다.

## 2. 핵심 변경 사항

### A. 데이터 패칭 방식 전환
- **Before:** `useMutation`을 사용하여 버튼 클릭 시에만 API 호출 (캐싱 없음).
- **After:** `useQuery` 기반의 커스텀 훅(`useLottoNumberStats`) 사용.
  - 필터(`filters`)가 변경될 때마다 자동으로 데이터를 다시 가져옵니다(**Auto-Fecth**).
  - 동일한 필터 조건에 대한 결과는 메모리에 저장됩니다.

### B. 캐싱 정책 (Stale Time)
데이터의 특성에 따라 서로 다른 `staleTime`(데이터가 상하지 않았다고 간주하는 시간)을 적용했습니다.

| 데이터 종류 | Hook 이름 | Stale Time | 설명 |
|---|---|---|---|
| **통계 분석 데이터** | `useLottoNumberStats` | **24시간** | 과거 통계는 빈번하게 변하지 않으므로 하루 동안 API 호출 없이 캐시를 사용합니다. |
| **최신 회차 번호** | `useLottoLatest` | **1시간** | 매주 토요일 저녁에만 변경되므로 1시간 주기로 최신화합니다. |
| **특정 회차 상세** | `useLottoDraw` | **Infinity** | 이미 추첨이 완료된 과거 회차 정보는 불변 데이터이므로 영구 캐싱합니다. |

## 3. 구현 상세 (Implementation Details)

### 3.1. 커스텀 훅 (`useLottoNumberStats`)
제네릭(`T`)을 사용하여 기본 통계(`BasicStats`)와 심화 통계(`AdvancedStats`)를 모두 처리할 수 있도록 유연하게 설계되었습니다.

```typescript
// src/features/lotto/hooks/use-lotto-query.ts

export const useLottoNumberStats = <T = BasicStats>(
  filters?: FilterValues,
  extraParams?: Record<string, any>
) => {
  return useQuery({
    // 쿼리 키에 필터와 추가 파라미터를 포함하여, 조건이 바뀔 때마다 별도 캐싱
    queryKey: ["lotto", "stats", "numbers", filters, extraParams],
    queryFn: async () => {
      // API 호출 (기존 POST 방식 유지)
      const res = await fetch("/api/lotto/analysis/stats", {
        body: JSON.stringify({ ...(filters || {}), ...extraParams }),
        // ...
      });
      return res.json() as Promise<{ data: T }>;
    },
    // 24시간 동안은 서버 요청 없이 캐시된 데이터 사용
    staleTime: 1000 * 60 * 60 * 24, 
  });
};
```

### 3.2. 페이지 내 자동 로딩 로직
사용자가 별도의 액션을 취하지 않아도, 최신 회차 번호(`latestDrawNo`)가 로드되면 즉시 '전체 기간'(`all`) 필터를 적용하여 데이터를 가져옵니다.

```typescript
// 각 통계 페이지 내부

useEffect(() => {
  // 최신 회차 정보가 있고, 아직 필터가 설정되지 않았다면 초기값 설정
  if (latestDrawNo && !filters) {
    setFilters({
      type: "all",           // 전체 회차 기준
      startDraw: 1,          // 1회부터
      endDraw: latestDrawNo, // 최신 회차까지
      includeBonus: false,   // 보너스 번호 제외 (기본값)
    });
  }
}, [latestDrawNo, filters]);

// 훅 호출 (filters가 설정되면 자동으로 실행됨)
const { data: statsData, isLoading } = useLottoNumberStats<AdvancedStats>(
  filters || undefined,
  { style: "advanced" } // 심화 통계가 필요한 경우 옵션 전달
);
```

### 3.3. StatsFilter 컴포넌트 개선
초기 로딩 시 필터 UI가 비어 있지 않도록 `defaultValues`를 주입받아 렌더링하도록 개선했습니다.

```typescript
<StatsFilter
  onApply={(v) => setFilters(v)}      // 사용자가 수동으로 필터 변경 시 상태 업데이트
  isPending={isLoading && !!filters}  // 로딩 중일 때 버튼 스피너 표시
  latestDrawNo={latestDrawNo}
  defaultValues={{                    // UI 초기 상태 동기화
    type: "all",
    startDraw: 1,
    endDraw: latestDrawNo,
    includeBonus: false,
  }}
/>
```

## 4. 기대 효과
1.  **반응성 향상:** 페이지 진입 즉시 분석 결과가 표시되어 사용자 이탈률 감소.
2.  **API 부하 감소:** 사용자가 동일한 조건(예: 전체 보기)을 여러 번 클릭하거나 페이지를 왔다 갔다 해도, 서버 요청 없이 즉시 렌더링.
3.  **UX 일관성:** 모든 통계 메뉴에서 동일한 로딩 경험 제공.
