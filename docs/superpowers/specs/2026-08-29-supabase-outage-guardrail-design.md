# Supabase 장애 가드레일 설계

- 날짜: 2026-08-29
- 상태: 승인됨 (사용자 확인 완료)
- 배경: Supabase 무료 티어 프로젝트가 일시 정지(pause)되면 사이트 전체가 먹통이 된다. resume으로 복구하기 전까지도 UI는 계속 볼 수 있어야 한다.

## 문제 정의

Supabase 장애 시 현재 코드의 전파 경로:

1. **middleware 전역 초크포인트** — `src/middleware.ts`가 모든 요청에서 `supabase.auth.getUser()`를 호출한다.
   - Supabase가 5xx를 반환하면: 에러가 버려지고 `user: null`로 처리되어 **모든 방문자가 `/login`으로 리다이렉트**된다. 로그인 자체도 불가능하므로 완전 잠금 상태가 된다.
   - Supabase가 응답 없이 hang하면: 코드 어디에도 타임아웃이 없어 **모든 라우트가 플랫폼 한계(~25초)까지 대기 후 504**가 된다.
   - env 누락 시: `createServerClient`가 throw하고 try/catch가 없어 전 라우트 500.
2. **API 라우트**: 29개 중 9개는 try/catch가 없고, `getUser()` 에러가 버려져 장애가 **401(미로그인)로 위장**된다. `attendance/status`는 장애 시 "출석 안 함"이라는 거짓 200을 반환한다.
3. **클라이언트 재시도 폭풍**: React Query 전역 기본값이 retry 3회라 56개 호출 지점 중 51개가 장애 시 4회씩 재시도한다 (과거 포인트 800 소진 사고와 동일 패턴).
4. **안전망 부재**: `error.tsx`, `global-error.tsx`, ErrorBoundary가 하나도 없다.

서버 컴포넌트는 DB를 건드리지 않아 (루트 레이아웃 포함) middleware만 통과하면 페이지 셸은 살아남는 구조다. `/`, `/privacy`, `/terms`, `/refund-policy`, `/lotto/analysis/stats`(허브), `/lotto/generate/random`은 DB 없이 완전히 렌더 가능하다.

## 목표 (승인된 UX 수준)

- **셸 유지 + 장애 안내**: 장애 중에도 모든 페이지 셸이 렌더된다. 데이터 영역은 "일시적으로 서비스에 연결할 수 없습니다" 안내 + 재시도 버튼으로 대체된다. 전역 장애 배너를 표시한다.
- **보호 페이지는 리다이렉트하지 않는다**: 로그인 상태를 확인할 수 없을 때는 `/login`으로 보내지 않고, 셸을 렌더하며 "로그인 상태를 확인할 수 없습니다" 안내를 보여준다. (데이터는 API 단에서 차단되므로 보안 문제 없음)
- **재시도 축소**: 조회 쿼리는 최대 1회(503/네트워크 오류는 0회), mutation은 0회.
- 장애 감지는 **클라이언트 자체 감지**(QueryCache 에러 구독) 방식을 쓴다. 헬스체크 폴링은 만들지 않는다 (무료 티어에 추가 부하 금지).

## 설계

### §1. 서버 계층 — 타임아웃 fetch + middleware fail-open

**공유 fetch 래퍼** (`src/shared/lib/supabase/guarded-fetch.ts` 신규)

- `createGuardedFetch(timeoutMs)`: `AbortSignal.timeout()`을 씌운 fetch를 반환. 호출자가 넘긴 signal이 있으면 `AbortSignal.any`로 합성.
- 4개 클라이언트 팩토리에 `global: { fetch }`로 주입:
  - `src/shared/lib/supabase/middleware.ts` — **3초**
  - `src/shared/lib/supabase/server.ts` — **8초**
  - `src/shared/lib/supabase/admin.ts` — **8초**
  - `src/shared/lib/supabase/client.ts` (브라우저) — **10초**
- 이것만으로 hang → 전 라우트 504 경로가 차단된다.

**middleware fail-open** (`src/middleware.ts`)

- 전체 auth 구간(클라이언트 생성 포함)을 try/catch로 감싼다.
- `getUser()`의 `error`를 읽어 분류한다:
  - **네트워크/타임아웃/5xx 오류** → 장애 모드: 인증 기반 리다이렉트를 전부 건너뛰고 요청을 그대로 통과시킨다. 응답에 `x-service-degraded: 1` 헤더를 부착한다 (디버깅용).
  - **오류 없이 user만 null** → 기존과 동일한 정상 비로그인 흐름 (`/login` 리다이렉트 유지).
- **인스턴스별 쿨다운**: 모듈 스코프 `degradedUntil` 타임스탬프. 장애 감지 직후 30초간은 `getUser()` 호출 자체를 건너뛰고 즉시 장애 모드로 통과시킨다. 장애 중 모든 요청이 3초 타임아웃을 기다리는 것을 방지한다. (서버리스 인스턴스별 상태라 완벽하지 않지만 비용 대비 효과 큼)
- env 누락 등 동기 throw도 같은 try/catch로 잡아 장애 모드로 처리한다 (전 라우트 500 방지).
- 매 요청 `console.log` 플러드는 제거하고, 장애/오류 발생 시에만 로그를 남긴다.

### §2. API 가드레일 — 503 정규화

**공유 분류 헬퍼** `isSupabaseUnavailable(error)` (위치: `src/shared/lib/supabase/guarded-fetch.ts` 또는 인접 파일)

- PostgREST 네트워크 실패(`status: 0` / `FetchError` 메시지), AuthRetryableFetchError, AbortError(타임아웃), 5xx를 "서비스 불가"로 판별한다.

**적용 지점**

- `src/shared/lib/auth/guards.ts`의 `requireUser`: `getUser()` 오류가 네트워크성이면 **503 `{ error: "SERVICE_UNAVAILABLE" }`** 반환, 진짜 세션 없음이면 기존대로 401. 같은 인라인 패턴을 쓰는 라우트 5곳(`points/balance`, `points/transactions`, `payments/history`, `attendance/status`, `admin/lotto-draw-trends`)도 동일 적용.
- **try/catch 없는 라우트**(파악된 목록: `admin/lotto-draw-trends`, `attendance/status`, `community/posts/[id]`, `lotto/search`, `payments/admin/all`, `payments/history`, `points/balance`, `points/transactions` — 구현 시 29개 라우트 전수 재확인)에 표준 try/catch를 추가하고, 실패 시 JSON 바디(503 또는 500)를 반환한다.
- **`attendance/status` 거짓 200 수정**: DB 오류를 버리고 `{ isCheckedIn: false }`를 반환하던 것을 503 반환으로 수정.

**범위 외 (별도 작업)**

- `lotto/search`·`lotto/analysis/stats`의 무한 `while (hasMore)` 페이지네이션 루프 리팩터링. 타임아웃 덕에 장애 시엔 빠르게 실패하므로 이번에는 손대지 않는다.

### §3. 클라이언트 계층 — 재시도 축소 + 전역 배너 + 안전망

**React Query 전역 기본값** (`src/shared/lib/providers/query-provider.tsx`)

- queries: `retry: (failureCount, error) => !isServiceUnavailableError(error) && failureCount < 1` — 503/네트워크 오류는 재시도 안 함, 그 외 최대 1회.
- mutations: `retry: 0` 명시.
- 개별 `retry: false`가 지정된 5곳은 그대로 우선 적용된다.
- 클라이언트용 판별 헬퍼 `isServiceUnavailableError(err)`: HTTP 503, fetch 네트워크 오류(TypeError), 타임아웃(AbortError)을 판별.

**전역 장애 배너** `<ServiceStatusBanner>` (신규, 루트 레이아웃에 마운트)

- `queryClient.getQueryCache().subscribe()`로 쿼리 에러 스트림을 구독한다.
- 서비스 불가로 분류된 에러가 감지되면 상단 스티키 배너를 표시: "일시적으로 서비스 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요."
- 이후 아무 쿼리든 성공하면 배너를 자동 해제한다.

**섹션용 안내 컴포넌트** `<ServiceUnavailableNotice onRetry>` (신규 공유 컴포넌트)

- 빈 카드 대신 안내 문구 + 재시도(refetch) 버튼을 렌더한다.
- 적용 지점 (공유 컴포넌트/핵심 페이지 위주, 56곳 전수 아님):
  - `LottoResultCard` (홈)
  - 통계 15개 페이지가 공유하는 `useLottoNumberStats` 소비 래퍼
  - 커뮤니티 목록 / 검색 페이지 / 마이페이지

**auth 상태 3분화** (`src/features/auth/hooks/use-auth.ts`)

- `authenticated` / `unauthenticated` / `unknown`(장애로 확인 불가)을 구분한다.
- `getCurrentUser`가 서비스 불가 오류로 실패하면 `unknown`.
- 보호 페이지의 클라이언트 측 리다이렉트는 `unknown`일 때 건너뛰고 "로그인 상태를 확인할 수 없습니다" 안내를 표시한다.
- 헤더는 `unknown`일 때 로그인 버튼 대신 중립 상태를 표시한다.

**안전망**

- `src/app/error.tsx` + `src/app/global-error.tsx` 추가. 렌더 중 예외가 전체 화면 크래시로 번지지 않도록 하는 최후 방어선.

### §4. 검증 전략

리포에 테스트 인프라가 없으므로 (package.json에 test 스크립트 없음) 이번 작업은 **수동 장애 시뮬레이션 체크리스트**로 검증한다. 테스트 러너는 추가하지 않는다.

`.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`을 다음으로 바꿔 dev 서버로 확인:

- (a) 존재하지 않는 호스트 (즉시 네트워크 오류)
- (b) 응답을 지연시키는 모킹 서버 (hang 시나리오)

체크리스트:

1. 홈(`/`) 및 정적 페이지(`/privacy` 등)가 정상 렌더된다.
2. 로그인 리다이렉트가 발생하지 않는다 (보호 페이지는 셸 + 안내).
3. 전역 장애 배너가 표시되고, 복구 후 해제된다.
4. API가 JSON 바디를 가진 503을 반환한다 (401/불투명 500 아님).
5. 네트워크 탭에서 재시도 폭풍이 없다 (쿼리당 최대 2회 요청).
6. `npm run typecheck`, `npm run lint-error` 통과.

## 결정 요약

| 결정 | 선택 | 근거 |
| --- | --- | --- |
| 장애 시 UX 수준 | 셸 유지 + 장애 안내 | 스테일 데이터 폴백은 캐시 계층 비용 대비 과함 |
| 보호 페이지 처리 | 리다이렉트 안 함 | 고장난 /login으로 보내는 무한루프 방지 |
| 재시도 정책 | 조회 1회(503/네트워크 0회), mutation 0회 | 재시도 폭풍 + 포인트 차감 계열 사고 방지 |
| 장애 감지 | 클라이언트 자체 감지 (QueryCache 구독) | 추가 인프라·폴링 부하 0, 무료 티어 제약과 부합 |
| 스테일 데이터 폴백 | 안 함 | 범위 축소 (YAGNI) |
| 헬스체크 엔드포인트 | 안 만듦 | 죽어가는 Supabase에 부하 추가 금지 |
| 테스트 인프라 | 추가 안 함 | 수동 시뮬레이션 체크리스트로 검증 |
