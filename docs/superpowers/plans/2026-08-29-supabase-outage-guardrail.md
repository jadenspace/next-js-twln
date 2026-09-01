# Supabase 장애 가드레일 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase 무료 티어 프로젝트가 일시 정지되어도 사이트 UI가 계속 렌더되도록 타임아웃·fail-open·503 정규화·장애 안내 가드레일을 추가한다.

**Architecture:** 모든 Supabase 클라이언트에 타임아웃 fetch를 주입해 hang을 차단하고, middleware는 장애 시 리다이렉트 없이 통과(fail-open)시킨다. API는 장애를 503으로 정규화하고, 클라이언트는 QueryCache 구독으로 전역 배너를 띄우며 데이터 영역마다 안내+재시도 UI를 보여준다.

**Tech Stack:** Next.js 16 (App Router), @supabase/ssr, @supabase/supabase-js, TanStack Query v5, zustand. 스펙: `docs/superpowers/specs/2026-08-29-supabase-outage-guardrail-design.md`

## Global Constraints

- 새 런타임 의존성 추가 금지. 테스트 러너 추가 금지 (검증은 typecheck/lint + Task 12 수동 시뮬레이션).
- 타임아웃: middleware **3000ms**, 서버 라우트/admin **8000ms**, 브라우저 **10000ms**. middleware 쿨다운 **30000ms**.
- API 장애 응답은 항상 `{ "error": "SERVICE_UNAVAILABLE" }` + HTTP **503**. 장애 모드 응답 헤더는 `x-service-degraded: 1`.
- 재시도: 조회 쿼리 최대 1회(서비스 불가 오류는 0회), mutation 0회.
- 사용자 노출 문구(정확히 이 문자열 사용):
  - 배너: `일시적으로 서비스 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.`
  - 데이터 영역: `일시적으로 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.`
  - 로그인 상태 불명: `일시적으로 로그인 상태를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.`
- 커밋 메시지는 한 줄 요약 + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` 트레일러.
- 각 태스크 완료 시 `npm run typecheck` 통과 필수. import 경로는 `@/` 별칭 사용 (기존 코드 관례).
- 작업 브랜치: `feat/supabase-outage-guardrail` (이미 생성되어 있음).

---

### Task 1: 오류 분류기 + 타임아웃 fetch + 클라이언트 팩토리 주입

**Files:**
- Create: `src/shared/lib/service-status.ts`
- Create: `src/shared/lib/supabase/guarded-fetch.ts`
- Modify: `src/shared/lib/supabase/client.ts`
- Modify: `src/shared/lib/supabase/server.ts`
- Modify: `src/shared/lib/supabase/middleware.ts`
- Modify: `src/shared/lib/supabase/admin.ts`

**Interfaces:**
- Produces: `ServiceUnavailableError` (class, `name === "ServiceUnavailableError"`), `isServiceUnavailable(error: unknown): boolean` — 이후 거의 모든 태스크가 이 둘을 import 한다 (`@/shared/lib/service-status`).
- Produces: `createGuardedFetch(timeoutMs: number)` (`@/shared/lib/supabase/guarded-fetch`).

- [ ] **Step 1: `src/shared/lib/service-status.ts` 생성**

```ts
/**
 * Supabase 장애(무료 티어 일시 정지, 네트워크 단절, 타임아웃) 판별 유틸.
 * 서버 라우트와 클라이언트 컴포넌트 양쪽에서 사용한다.
 */
export class ServiceUnavailableError extends Error {
  constructor(message = "일시적으로 서비스에 연결할 수 없습니다.") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export function isServiceUnavailable(error: unknown): boolean {
  if (!error) return false;

  const e = error as {
    name?: string;
    message?: string;
    status?: number;
  };

  if (e.name === "ServiceUnavailableError") return true;
  // supabase auth-js 는 네트워크/5xx 실패를 AuthRetryableFetchError 로 감싼다.
  if (e.name === "AuthRetryableFetchError") return true;
  // AbortSignal.timeout 이 만든 중단
  if (e.name === "TimeoutError" || e.name === "AbortError") return true;
  // postgrest-js 는 네트워크 실패를 status 0 으로, Supabase 게이트웨이는 5xx 로 반환한다.
  if (typeof e.status === "number" && (e.status === 0 || e.status >= 500)) {
    return true;
  }

  const msg = typeof e.message === "string" ? e.message : "";
  // postgrest-js 는 fetch 거부를 "TypeError: fetch failed" 류 메시지로 감싼다.
  return (
    msg.includes("fetch failed") ||
    msg.includes("Failed to fetch") ||
    msg.includes("FetchError") ||
    msg.includes("Load failed") ||
    msg.includes("NetworkError") ||
    msg.includes("TimeoutError") ||
    msg.includes("AbortError")
  );
}
```

- [ ] **Step 2: `src/shared/lib/supabase/guarded-fetch.ts` 생성**

```ts
/**
 * Supabase 요청에 타임아웃을 강제하는 fetch 래퍼.
 * 무료 티어 프로젝트가 응답 없이 hang 하면 전체 라우트가 플랫폼 한계(~25초)까지
 * 잠기던 문제를 여기서 차단한다.
 */
export function createGuardedFetch(
  timeoutMs: number,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return (input, init = {}) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal =
      init.signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([init.signal, timeoutSignal])
        : timeoutSignal;

    return fetch(input, { ...init, signal });
  };
}
```

- [ ] **Step 3: 4개 팩토리에 주입**

`src/shared/lib/supabase/client.ts` 전체를 다음으로 교체:

```ts
import { createBrowserClient } from "@supabase/ssr";
import { createGuardedFetch } from "./guarded-fetch";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: createGuardedFetch(10_000) } }
  );
}
```

`src/shared/lib/supabase/server.ts`: import에 `import { createGuardedFetch } from "./guarded-fetch";` 추가, `createServerClient(...)` 3번째 인자 객체에 `global: { fetch: createGuardedFetch(8_000) },` 를 `cookies:` 위에 추가.

`src/shared/lib/supabase/middleware.ts`: 같은 방식으로 `global: { fetch: createGuardedFetch(3_000) },` 추가.

`src/shared/lib/supabase/admin.ts`: `createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })` 를 다음으로 교체:

```ts
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: { fetch: createGuardedFetch(8_000) },
  });
```

(import 추가: `import { createGuardedFetch } from "./guarded-fetch";`)

- [ ] **Step 4: 검증**

Run: `npm run typecheck`
Expected: 오류 0건

- [ ] **Step 5: 커밋**

```bash
git add src/shared/lib/service-status.ts src/shared/lib/supabase/
git commit -m "Add Supabase timeout fetch and outage classifier"
```

---

### Task 2: middleware fail-open + 쿨다운

**Files:**
- Modify: `src/shared/lib/supabase/middleware.ts`
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `isServiceUnavailable` (`@/shared/lib/service-status`).
- Produces: `createMiddlewareClient(request)` 의 반환 타입이 `{ supabase, getSupabaseResponse: () => NextResponse }` 로 변경된다 (기존 `supabaseResponse` 프로퍼티 제거). 호출자는 `src/middleware.ts` 하나뿐이다.

배경: 기존 팩토리는 `supabaseResponse` 를 값으로 반환하는데, 토큰 리프레시로 `setAll` 이 실행되면 클로저 안의 변수만 재할당되어 호출자가 낡은 응답 객체를 들고 있게 되는 잠복 버그가 있다. getter 로 바꿔 함께 해결한다.

- [ ] **Step 1: 팩토리 반환을 getter 로 변경**

`src/shared/lib/supabase/middleware.ts` 마지막 `return { supabase, supabaseResponse };` 를 다음으로 교체:

```ts
  // supabaseResponse 는 setAll 콜백에서 재할당되므로 getter 로 노출해야
  // 호출자가 항상 최신 응답(리프레시된 쿠키 포함)을 받는다.
  return { supabase, getSupabaseResponse: () => supabaseResponse };
```

- [ ] **Step 2: `src/middleware.ts` 의 auth 구간 재작성**

파일 상단(1~24행)을 다음으로 교체 (`publicPaths` 이후 로직은 그대로 두되 Step 3 참고):

```ts
import { createMiddlewareClient } from "@/shared/lib/supabase/middleware";
import { isServiceUnavailable } from "@/shared/lib/service-status";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Supabase 장애 감지 후 이 시간 동안은 getUser() 호출을 건너뛰고 즉시 통과시킨다.
// (인스턴스별 상태 — 서버리스에서 완벽하진 않지만 요청마다 3초 타임아웃을
// 기다리는 것을 막아준다)
const DEGRADED_COOLDOWN_MS = 30_000;
let degradedUntil = 0;

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  let user: User | null = null;
  let degraded = Date.now() < degradedUntil;

  if (!degraded) {
    try {
      const { supabase, getSupabaseResponse } =
        createMiddlewareClient(request);
      const { data, error } = await supabase.auth.getUser();
      supabaseResponse = getSupabaseResponse();

      if (error && isServiceUnavailable(error)) {
        degraded = true;
      } else {
        user = data.user;
      }
    } catch (error) {
      // env 누락, 예기치 못한 throw 등 — 전 라우트 500 대신 장애 모드로 통과시킨다.
      console.error("[Middleware] Supabase unreachable, failing open:", error);
      degraded = true;
    }

    if (degraded) {
      degradedUntil = Date.now() + DEGRADED_COOLDOWN_MS;
    }
  }

  if (degraded) {
    // 로그인 여부를 알 수 없으므로 어떤 리다이렉트도 하지 않는다.
    // 보호 데이터는 각 API 라우트가 자체 인증으로 차단한다.
    supabaseResponse.headers.set("x-service-degraded", "1");
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;
```

- [ ] **Step 3: 기존 코드 정리**

- 기존 12~15행의 `isDevelopment` 계산과 19~24행의 `console.log("[Middleware]", ...)` 블록, 87행의 주석 `// if (!isDevelopment && !user) {` 을 삭제한다 (매 요청 로그 플러드 제거).
- 기존 17행 `const pathname = ...` 은 Step 2 마지막 줄로 대체되므로 중복 선언하지 않는다.
- `publicPaths` 부터 파일 끝(`config` 포함)까지의 나머지 로직은 변경하지 않는다.

- [ ] **Step 4: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건

- [ ] **Step 5: 커밋**

```bash
git add src/middleware.ts src/shared/lib/supabase/middleware.ts
git commit -m "Fail open in middleware when Supabase is unreachable"
```

---

### Task 3: 라우트 오류 헬퍼 + 인증 가드 503 정규화

**Files:**
- Create: `src/shared/lib/api/route-error.ts`
- Modify: `src/shared/lib/auth/guards.ts:27-37` (requireUser), `:80-83` (requireAdmin 오류 분기)

**Interfaces:**
- Consumes: `isServiceUnavailable` (`@/shared/lib/service-status`).
- Produces: `supabaseErrorResponse(error: { message: string }): NextResponse`, `unexpectedErrorResponse(scope: string, error: unknown): NextResponse` (`@/shared/lib/api/route-error`) — Task 4·5가 사용.
- Produces: `requireUser()` 가 Supabase 장애 시 503 `{ error: "SERVICE_UNAVAILABLE" }` 를 반환 (기존엔 401로 위장됨).

- [ ] **Step 1: `src/shared/lib/api/route-error.ts` 생성**

```ts
import { NextResponse } from "next/server";
import { isServiceUnavailable } from "@/shared/lib/service-status";

/**
 * Supabase 쿼리 결과의 error 객체를 HTTP 응답으로 변환한다.
 * 장애성 오류(프로젝트 정지, 네트워크, 타임아웃)는 503으로 구분해
 * 클라이언트가 "서버 버그(500)"와 "일시 장애(503)"를 다르게 처리할 수 있게 한다.
 */
export function supabaseErrorResponse(error: { message: string }) {
  if (isServiceUnavailable(error)) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE" },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

/** 라우트 최상위 catch 블록용 — 예기치 못한 throw 를 JSON 응답으로 변환한다. */
export function unexpectedErrorResponse(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  if (isServiceUnavailable(error)) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE" },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 },
  );
}
```

- [ ] **Step 2: `requireUser` 수정**

`src/shared/lib/auth/guards.ts` 의 `requireUser` 를 다음으로 교체하고, import 에 `import { isServiceUnavailable } from "@/shared/lib/service-status";` 를 추가:

```ts
/** 로그인한 사용자만 통과시킨다. */
export async function requireUser(): Promise<GuardResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Supabase 장애를 "미로그인(401)"으로 위장하지 않는다 — 클라이언트가
  // 로그아웃 처리를 하거나 로그인 페이지로 보내는 오동작을 막는다.
  if (error && isServiceUnavailable(error)) {
    return deny(503, "SERVICE_UNAVAILABLE");
  }

  if (!user) return deny(401, "Unauthorized");

  return { ok: true, user, supabase };
}
```

- [ ] **Step 3: `requireAdmin` 오류 분기 수정**

`requireAdmin` 내부의 admin_users 조회 오류 분기(기존 80~83행)를 다음으로 교체:

```ts
  if (error) {
    console.error("[requireAdmin] admin_users 조회 실패", error);
    if (isServiceUnavailable(error)) {
      return deny(503, "SERVICE_UNAVAILABLE");
    }
    return deny(500, "권한 확인에 실패했습니다.");
  }
```

- [ ] **Step 4: 검증**

Run: `npm run typecheck`
Expected: 오류 0건

- [ ] **Step 5: 커밋**

```bash
git add src/shared/lib/api/route-error.ts src/shared/lib/auth/guards.ts
git commit -m "Normalize Supabase outage to 503 in auth guards"
```

---

### Task 4: try/catch 없는 API 라우트 재작성

**Files:**
- Modify: `src/app/api/attendance/status/route.ts` (전체 교체)
- Modify: `src/app/api/points/balance/route.ts`
- Modify: `src/app/api/points/transactions/route.ts`
- Modify: `src/app/api/payments/history/route.ts`
- Modify: `src/app/api/payments/admin/all/route.ts`
- Modify: `src/app/api/community/posts/[id]/route.ts`
- Modify: `src/app/api/admin/lotto-draw-trends/route.ts`
- Modify: `src/app/api/lotto/search/route.ts`

**Interfaces:**
- Consumes: `requireUser`, `requireAdmin` (`@/shared/lib/auth/guards`), `supabaseErrorResponse`, `unexpectedErrorResponse` (`@/shared/lib/api/route-error`).
- Produces: 위 라우트 전부가 장애 시 JSON 바디를 가진 503/500을 반환. 응답 성공 스키마는 기존과 동일 (클라이언트 수정 불필요).

- [ ] **Step 1: `attendance/status` 전체 교체 (거짓 200 버그 수정 포함)**

기존 코드는 DB 오류를 버리고 `{ isCheckedIn: false }` 를 반환했다(장애 시 "출석 안 함"이라는 거짓 응답). 파일 전체를 다음으로 교체:

```ts
import { getKstDateString } from "@/shared/lib/date-utils";
import { requireUser } from "@/shared/lib/auth/guards";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const { user, supabase } = guard;

    const today = getKstDateString();

    const { data, error } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("check_in_date", today)
      .maybeSingle();

    if (error) return supabaseErrorResponse(error);

    return NextResponse.json({ isCheckedIn: !!data });
  } catch (error) {
    return unexpectedErrorResponse("api/attendance/status", error);
  }
}
```

- [ ] **Step 2: `points/balance`, `points/transactions`, `payments/history` 를 같은 패턴으로 수정**

세 라우트 모두 동일한 변환을 적용한다:
1. `import { requireUser } from "@/shared/lib/auth/guards";` 와 `import { supabaseErrorResponse, unexpectedErrorResponse } from "@/shared/lib/api/route-error";` 추가. `createClient` import 는 제거.
2. 핸들러 본문 전체를 `try { ... } catch (error) { return unexpectedErrorResponse("api/<경로>", error); }` 로 감싼다.
3. 인라인 `createClient()` + `getUser()` + 401 반환부를 다음으로 교체:
```ts
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const { user, supabase } = guard;
```
4. `if (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }` 를 `if (error) return supabaseErrorResponse(error);` 로 교체.
5. 나머지 쿼리/응답 로직은 그대로 유지 (예: points/balance 의 "레코드 없으면 0 반환" 분기).

`points/balance/route.ts` 완성본 (참고용 전체 교체 코드):

```ts
import { requireUser } from "@/shared/lib/auth/guards";
import {
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from "@/shared/lib/api/route-error";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const guard = await requireUser();
    if (!guard.ok) return guard.response;
    const { user, supabase } = guard;

    const { data, error } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return supabaseErrorResponse(error);

    if (!data) {
      // User has no points record yet, return 0 or create one?
      // Ideally handled by trigger, but fail safe:
      return NextResponse.json({
        user_id: user.id,
        balance: 0,
        total_earned: 0,
        total_spent: 0,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return unexpectedErrorResponse("api/points/balance", error);
  }
}
```

(`points/transactions`, `payments/history` 는 searchParams 파싱과 쿼리를 유지한 채 같은 뼈대 적용. `request: NextRequest` 파라미터는 searchParams 를 쓰는 라우트에서만 유지.)

- [ ] **Step 3: `admin/lotto-draw-trends` — 인라인 admin 판별을 `requireAdmin` 으로 교체**

기존 12~32행(인라인 getUser + admin_users 조회)을 다음으로 교체하고 본문 전체를 try/catch 로 감싼다. `createClient` import 를 `requireAdmin` import 로 교체:

```ts
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;
    const { supabase } = guard;
```

이후 기존 searchParams/쿼리 로직 유지, `if (error)` 분기는 `return supabaseErrorResponse(error);` 로 교체, 마지막에:

```ts
  } catch (error) {
    return unexpectedErrorResponse("api/admin/lotto-draw-trends", error);
  }
}
```

- [ ] **Step 4: `payments/admin/all`, `community/posts/[id]`, `lotto/search` — try/catch + 오류 응답 교체**

세 라우트 모두: 핸들러 본문 전체를 try/catch(`unexpectedErrorResponse("api/<경로>", error)`)로 감싸고, 모든 `return NextResponse.json({ error: error.message }, { status: 500 });` 를 `return supabaseErrorResponse(error);` 로 교체한다. 뷰카운트 증가·페이지네이션 등 나머지 로직은 변경하지 않는다.

- [ ] **Step 5: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건

- [ ] **Step 6: 커밋**

```bash
git add src/app/api
git commit -m "Add guardrails to unprotected API routes"
```

---

### Task 5: 나머지 API 라우트 오류 응답 스윕

**Files:**
- Modify: `src/app/api/**/route.ts` 중 Task 4에서 다루지 않은 전부 (약 20개, Step 1에서 확정)

**Interfaces:**
- Consumes: `supabaseErrorResponse`, `unexpectedErrorResponse` (`@/shared/lib/api/route-error`).

- [ ] **Step 1: 대상 열거**

Run: `grep -rln "status: 500" src/app/api --include=route.ts`
Task 4에서 수정한 8개 파일을 제외한 목록이 대상이다. 추가로 `grep -rLn "try" src/app/api --include=route.ts` 로 try/catch 없는 라우트가 남아있지 않은지 재확인한다 (스펙의 "29개 전수 재확인" 항목).

- [ ] **Step 2: 기계적 치환**

각 파일에서:
1. Supabase 쿼리의 `{ error }` 를 검사해 `NextResponse.json({ error: error.message }, { status: 500 })` 를 반환하는 분기 → `return supabaseErrorResponse(error);` 로 교체 (import 추가).
2. Supabase 오류가 아닌 고정 문구 500(예: 유효성 검사 실패)은 건드리지 않는다.
3. try/catch 가 아예 없는 라우트가 발견되면 Task 4 패턴으로 본문을 감싼다.
4. 기존 catch 블록이 이미 JSON 500을 반환하면 `return unexpectedErrorResponse("api/<경로>", error);` 로 통일한다.

- [ ] **Step 3: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건. 추가 확인: `grep -rn "error.message }, { status: 500" src/app/api --include=route.ts` 결과가 Supabase 오류 분기에서는 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/app/api
git commit -m "Normalize Supabase errors to 503 across API routes"
```

---

### Task 6: React Query 전역 재시도 정책

**Files:**
- Modify: `src/shared/lib/providers/query-provider.tsx`

**Interfaces:**
- Consumes: `isServiceUnavailable` (`@/shared/lib/service-status`).

- [ ] **Step 1: QueryClient 기본값 수정**

`new QueryClient({...})` 를 다음으로 교체하고 `import { isServiceUnavailable } from "@/shared/lib/service-status";` 추가:

```ts
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
      })
```

- [ ] **Step 2: 검증**

Run: `npm run typecheck`
Expected: 오류 0건

- [ ] **Step 3: 커밋**

```bash
git add src/shared/lib/providers/query-provider.tsx
git commit -m "Cap query retries and skip retrying outage errors"
```

---

### Task 7: 전역 장애 배너

**Files:**
- Create: `src/shared/components/service-status-banner.tsx`
- Modify: `src/app/layout.tsx:111-118`

**Interfaces:**
- Consumes: `isServiceUnavailable` (`@/shared/lib/service-status`).
- Produces: `<ServiceStatusBanner />` — QueryClientProvider 하위에서만 동작.

- [ ] **Step 1: `src/shared/components/service-status-banner.tsx` 생성**

```tsx
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
      className="sticky top-0 z-[60] bg-amber-500/95 px-4 py-2 text-center text-sm font-medium text-black"
    >
      일시적으로 서비스 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.
    </div>
  );
}
```

- [ ] **Step 2: 루트 레이아웃에 마운트**

`src/app/layout.tsx` 에 `import { ServiceStatusBanner } from "@/shared/components/service-status-banner";` 추가 후, `<QueryProvider>` 내부 최상단(기존 `<div className="min-h-screen flex flex-col">` 바로 위)에 `<ServiceStatusBanner />` 삽입:

```tsx
        <QueryProvider>
          <ServiceStatusBanner />
          <div className="min-h-screen flex flex-col">
```

- [ ] **Step 3: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건

- [ ] **Step 4: 커밋**

```bash
git add src/shared/components/service-status-banner.tsx src/app/layout.tsx
git commit -m "Show global banner when service is degraded"
```

---

### Task 8: 섹션 안내 컴포넌트 + 홈/커뮤니티/검색 적용

**Files:**
- Create: `src/shared/components/service-unavailable-notice.tsx`
- Modify: `src/features/lotto/api/lotto-api.ts:300-317` (getLatestDraw)
- Modify: `src/features/lotto/components/lotto-result-card.tsx:31,101-117`
- Modify: `src/app/(dashboard)/community/page.tsx:40-47` + posts 목록 렌더 분기
- Modify: `src/app/(dashboard)/lotto/search/page.tsx:71-85` + 결과 렌더 분기
- Modify: `src/app/(dashboard)/mypage/page.tsx:69-110,286` (저장 번호 목록)

**Interfaces:**
- Consumes: `ServiceUnavailableError`, `isServiceUnavailable` (`@/shared/lib/service-status`).
- Produces: `<ServiceUnavailableNotice onRetry?: () => void; message?: string; className?: string />` (`@/shared/components/service-unavailable-notice`) — Task 9·10이 사용.

- [ ] **Step 1: `src/shared/components/service-unavailable-notice.tsx` 생성**

```tsx
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
```

- [ ] **Step 2: `getLatestDraw` 가 장애를 throw 하도록 수정**

현재는 모든 오류를 삼키고 `null` 을 반환해 홈 카드가 "당첨번호 정보가 없습니다"라는 오해 소지 문구를 보여준다. `src/features/lotto/api/lotto-api.ts` 의 `getLatestDraw` 오류 분기를 다음으로 교체하고, 파일 상단에 `import { ServiceUnavailableError, isServiceUnavailable } from "@/shared/lib/service-status";` 추가:

```ts
    if (error) {
      // 장애는 throw 해서 useQuery 가 isError 상태로 구분할 수 있게 한다.
      if (isServiceUnavailable(error)) {
        throw new ServiceUnavailableError();
      }
      if (error.code !== "PGRST116") {
        console.error("Failed to fetch latest draw:", error);
      }
      return null;
    }
```

- [ ] **Step 3: `LottoResultCard` 에 안내 적용**

`src/features/lotto/components/lotto-result-card.tsx`:
1. import 추가: `import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";`
2. 31행을 `const { data: latestDraw, isLoading, isError, refetch } = useLottoLatest();` 로 교체.
3. `if (isLoading) {...}` 블록 바로 뒤에 추가:

```tsx
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            최신 로또 당첨번호
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceUnavailableNotice onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }
```

- [ ] **Step 4: 커뮤니티 목록 적용**

`src/app/(dashboard)/community/page.tsx`:
1. import 추가: `import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";` 와 `import { ServiceUnavailableError } from "@/shared/lib/service-status";`
2. 40~47행 쿼리를 다음으로 교체:

```ts
  const {
    data: posts,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: async () => {
      const res = await fetch("/api/community/posts");
      if (!res.ok) {
        if (res.status === 503) throw new ServiceUnavailableError();
        throw new Error("Failed to fetch posts");
      }
      return res.json();
    },
  });
```

3. JSX 에서 posts 목록을 렌더하는 분기(isLoading 스켈레톤 체크 인접)에 `isError` 분기를 추가: `{isError ? <ServiceUnavailableNotice onRetry={() => refetch()} /> : ...기존 목록 렌더...}`

- [ ] **Step 5: 검색 페이지 적용**

`src/app/(dashboard)/lotto/search/page.tsx`: 같은 패턴 — 71행 destructure 에 `isError, refetch` 추가, queryFn 의 `if (!res.ok) throw new Error("Search failed");` 를

```ts
      if (!res.ok) {
        if (res.status === 503) throw new ServiceUnavailableError();
        throw new Error("Search failed");
      }
```

로 교체, 결과 테이블 렌더 분기에 `{isError ? <ServiceUnavailableNotice onRetry={() => refetch()} /> : ...}` 추가. (import 는 커뮤니티 페이지와 동일하게 두 개 추가.)

- [ ] **Step 6: 마이페이지 적용 (React Query 미사용 — 수동 상태)**

`src/app/(dashboard)/mypage/page.tsx` 는 useState + fetch 패턴이므로 오류 상태를 직접 추가한다:
1. import 추가: `import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";`
2. 71행 근처 상태 선언에 추가: `const [isError, setIsError] = useState(false);`
3. `fetchSavedNumbers` 콜백 수정 — try 시작부에 `setIsError(false);` 추가, catch 블록을 다음으로 교체:

```ts
      } catch (error) {
        console.error("Failed to fetch saved numbers:", error);
        setIsError(true);
        toast.error("저장된 번호를 불러오지 못했습니다.");
      } finally {
```

4. 286행의 저장 번호 목록 렌더 분기 `{isLoading ? (` 를 다음 구조로 교체:

```tsx
          {isError ? (
            <ServiceUnavailableNotice onRetry={() => fetchSavedNumbers(0)} />
          ) : isLoading ? (
```

(기존 로딩/목록 분기와 닫는 괄호는 그대로.)

- [ ] **Step 7: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건

- [ ] **Step 8: 커밋**

```bash
git add src/shared/components/service-unavailable-notice.tsx src/features/lotto "src/app/(dashboard)/community/page.tsx" "src/app/(dashboard)/lotto/search/page.tsx" "src/app/(dashboard)/mypage/page.tsx"
git commit -m "Show outage notice in home, community, search, and mypage"
```

---

### Task 9: 통계 페이지 15곳 안내 적용

**Files:**
- Modify: `src/features/lotto/hooks/use-lotto-query.ts:51-62` (useLottoNumberStats queryFn)
- Modify: `src/app/(dashboard)/lotto/analysis/stats/{numbers,ranges,missing,odd-even,consecutive,regression,markov,japanese,monte-carlo,algorithm,ending-digit,nine-ranges,interval,compatibility,math}/page.tsx` (15개)

**Interfaces:**
- Consumes: `ServiceUnavailableError` (`@/shared/lib/service-status`), `<ServiceUnavailableNotice>` (`@/shared/components/service-unavailable-notice`).

- [ ] **Step 1: `useLottoNumberStats` queryFn 이 503을 구분하도록 수정**

`src/features/lotto/hooks/use-lotto-query.ts` 의 queryFn 내 오류 분기를 다음으로 교체하고 `import { ServiceUnavailableError } from "@/shared/lib/service-status";` 추가:

```ts
      if (!res.ok) {
        if (res.status === 503) throw new ServiceUnavailableError();
        const err = await res.json().catch(() => ({ error: null }));
        throw new Error(err.error || "분석에 실패했습니다.");
      }
```

(기존 `const err = await res.json();` 는 JSON 이 아닌 응답에서 2차 예외를 던지므로 `.catch` 가드도 함께 추가한다.)

- [ ] **Step 2: numbers 페이지에 적용 (완전한 예시)**

`src/app/(dashboard)/lotto/analysis/stats/numbers/page.tsx`:
1. import 추가: `import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";`
2. 46~48행을 다음으로 교체:

```ts
  const {
    data: statsData,
    isLoading,
    isError,
    refetch,
  } = useLottoNumberStats(filters || undefined);
```

3. JSX 의 `{!stats ? ( <EmptyStateCard ... /> ) : ( ... )}` 분기를 다음 구조로 교체:

```tsx
      {isError ? (
        <ServiceUnavailableNotice onRetry={() => refetch()} />
      ) : !stats ? (
        <EmptyStateCard
          icon={Info}
          title="분석을 시작해 주세요"
          description="상단의 필터를 설정하고 분석 적용 버튼을 누르면 통계 데이터가 표시됩니다."
        />
      ) : (
```

(기존 데이터 렌더 블록과 닫는 괄호는 그대로.)

- [ ] **Step 3: 나머지 14개 페이지에 같은 레시피 적용**

각 페이지에서 기계적으로 반복한다 — 페이지마다 EmptyStateCard 문구·데이터 렌더 내용은 다르지만 구조는 동일하다:
1. `ServiceUnavailableNotice` import 추가.
2. `useLottoNumberStats(...)` destructure 에 `isError, refetch` 추가 (이미 `isLoading` 별칭을 쓰는 페이지는 별칭 유지).
3. 통계 결과를 렌더하는 최상위 분기(`{!stats ? ... : ...}` 또는 동등한 빈 상태 분기)를 `{isError ? <ServiceUnavailableNotice onRetry={() => refetch()} /> : ...기존 분기...}` 로 감싼다.
4. `useLottoNumberStats` 를 쓰지 않고 다른 훅/fetch 를 쓰는 페이지가 있으면 같은 패턴으로 isError 를 노출해 적용한다.

- [ ] **Step 4: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건

- [ ] **Step 5: 커밋**

```bash
git add src/features/lotto/hooks/use-lotto-query.ts "src/app/(dashboard)/lotto/analysis/stats"
git commit -m "Show outage notice on stats pages"
```

---

### Task 10: auth 상태 3분화 (unknown 도입)

**Files:**
- Modify: `src/features/auth/api/auth-api.ts:53-66` (getCurrentUser)
- Modify: `src/features/auth/hooks/use-auth.ts:16-21,193-218`
- Modify: `src/shared/components/layout/header.tsx:84,384-408,614-622`
- Modify: `src/app/(dashboard)/lotto/generate/layout.tsx:28,45`
- Modify: `src/app/admin/page.tsx:26,44-46`
- Modify: `src/app/(dashboard)/lotto/generate/manual-pattern/page.tsx:73,688`

**Interfaces:**
- Consumes: `ServiceUnavailableError`, `isServiceUnavailable` (`@/shared/lib/service-status`), `<ServiceUnavailableNotice>`.
- Produces: `useAuth()` 반환 객체에 `authStatus: "loading" | "authenticated" | "unauthenticated" | "unknown"` 추가. `AuthStatus` 타입 export (`@/features/auth/hooks/use-auth`).

- [ ] **Step 1: `getCurrentUser` 수정**

`src/features/auth/api/auth-api.ts` 의 `getCurrentUser` 를 다음으로 교체하고 `import { ServiceUnavailableError, isServiceUnavailable } from "@/shared/lib/service-status";` 추가:

```ts
  async getCurrentUser() {
    const supabase = createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // 장애는 throw — "로그인 여부를 알 수 없음(unknown)" 으로 구분된다.
      if (isServiceUnavailable(error)) {
        throw new ServiceUnavailableError();
      }
      // 세션 없음(AuthSessionMissingError 등)은 정상적인 비로그인 상태다.
      // 기존에는 이것도 throw 해서 비로그인 방문자의 isLoading 이 영원히
      // true 로 남는 버그가 있었다.
      return null;
    }

    return user;
  },
```

- [ ] **Step 2: `useAuth` 에 authStatus 추가**

`src/features/auth/hooks/use-auth.ts`:
1. import 추가: `import { isServiceUnavailable } from "@/shared/lib/service-status";`
2. 파일 상단(useAuth 밖)에 타입 export:

```ts
export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "unknown";
```

3. 16~21행 쿼리 destructure 에 `error: userError` 추가:

```ts
  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });
```

4. return 문 직전에 파생값 계산:

```ts
  // 장애로 확인 불가(unknown)를 비로그인과 구분한다 — 보호 페이지가
  // 고장난 /login 으로 사용자를 내쫓는 것을 막는다.
  const authStatus: AuthStatus = isServiceUnavailable(userError)
    ? "unknown"
    : userLoading || isLoading
      ? "loading"
      : isAuthenticated
        ? "authenticated"
        : "unauthenticated";
```

5. return 객체에 `authStatus,` 추가 (기존 `user,` 다음 줄).

- [ ] **Step 3: 헤더 중립 상태**

`src/shared/components/layout/header.tsx`:
1. 84행: `const { user, isAuthenticated, signOut, authStatus } = useAuth();`
2. 데스크톱(384행) `{isAuthenticated ? (` 를 다음 구조로 교체:

```tsx
            {authStatus === "unknown" ? (
              <span className="text-xs text-muted-foreground">
                연결 확인 중
              </span>
            ) : isAuthenticated ? (
```

(기존 `<>...</>` 와 `) : ( <Link href="/login">...` 이하 분기는 그대로.)

3. 모바일(614행) `{!isAuthenticated ? (` 를 다음 구조로 교체:

```tsx
          {authStatus === "unknown" ? (
            <p className="text-xs text-center text-muted-foreground">
              일시적으로 로그인 상태를 확인할 수 없습니다. 잠시 후 다시
              시도해주세요.
            </p>
          ) : !isAuthenticated ? (
```

- [ ] **Step 4: 보호 페이지 3곳**

`src/app/(dashboard)/lotto/generate/layout.tsx`:
- 28행을 `const { authStatus } = useAuth();` 로 교체.
- 45행 `const isLocked = !tab.isPublic && !isAuthenticated && !isLoading;` 을 `const isLocked = !tab.isPublic && authStatus === "unauthenticated";` 로 교체.

`src/app/admin/page.tsx`:
- 26행: `const { user, isAuthenticated, authStatus } = useAuth();`
- import 추가: `import { ServiceUnavailableNotice } from "@/shared/components/service-unavailable-notice";`
- 46행 `if (!isAuthenticated || !isAdmin) {` 블록 **앞에** 삽입:

```tsx
  if (authStatus === "unknown") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ServiceUnavailableNotice message="일시적으로 로그인 상태를 확인할 수 없습니다. 잠시 후 다시 시도해주세요." />
      </div>
    );
  }
```

`src/app/(dashboard)/lotto/generate/manual-pattern/page.tsx`:
- 73행 destructure 에 `authStatus` 추가: `const { isAuthenticated, isLoading: authLoading, authStatus } = useAuth();`
- import 추가: `ServiceUnavailableNotice`.
- 688행 `if (authLoading || !isAuthenticated) {` 블록 **앞에** 삽입:

```tsx
  if (authStatus === "unknown") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ServiceUnavailableNotice message="일시적으로 로그인 상태를 확인할 수 없습니다. 잠시 후 다시 시도해주세요." />
      </div>
    );
  }
```

- [ ] **Step 5: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건

- [ ] **Step 6: 커밋**

```bash
git add src/features/auth src/shared/components/layout/header.tsx "src/app/(dashboard)/lotto/generate" src/app/admin/page.tsx
git commit -m "Distinguish unknown auth state during outages"
```

---

### Task 11: error.tsx / global-error.tsx 안전망

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/global-error.tsx`

**Interfaces:**
- Consumes: `Button` (`@/shared/ui/button`) — error.tsx 만. global-error.tsx 는 루트 레이아웃(글로벌 CSS 포함)을 대체하므로 Tailwind 에 의존하지 않는 인라인 스타일만 쓴다.

- [ ] **Step 1: `src/app/error.tsx` 생성**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/shared/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-bold">문제가 발생했습니다</h2>
      <p className="text-sm text-muted-foreground">
        일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
```

- [ ] **Step 2: `src/app/global-error.tsx` 생성**

```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2>문제가 발생했습니다</h2>
          <p>일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 검증**

Run: `npm run typecheck && npm run lint-error`
Expected: 오류 0건

- [ ] **Step 4: 커밋**

```bash
git add src/app/error.tsx src/app/global-error.tsx
git commit -m "Add error boundaries as last-resort safety net"
```

---

### Task 12: 수동 장애 시뮬레이션 검증

**Files:**
- 없음 (검증 전용 — 발견된 결함은 해당 파일에서 수정 후 커밋)

**Interfaces:**
- Consumes: 앞선 모든 태스크의 결과물.

- [ ] **Step 1: 정적 게이트**

Run: `npm run typecheck && npm run lint-error && npm run build`
Expected: 모두 통과

- [ ] **Step 2: "즉시 실패" 시나리오 (프로젝트 정지와 유사)**

`.env.local` 은 수정하지 않는다. 셸 환경변수로 덮어쓴다 (env-cmd 의 `--no-override` 는 기존 셸 값을 보존):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://paused-project.invalid \
  npx env-cmd -f .env.local --no-override next dev --turbopack
```

체크리스트 (브라우저 + curl):
1. `curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:3000/` → **200**, 5초 이내.
2. `curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/mypage"` → **200** (307 리다이렉트 아님 — fail-open 확인). 응답 헤더에 `x-service-degraded: 1` 확인: `curl -sI http://localhost:3000/mypage | grep -i x-service-degraded`.
3. `curl -s -w "\n%{http_code}\n" http://localhost:3000/api/points/balance` → JSON `{"error":"SERVICE_UNAVAILABLE"}` + **503** (401 아님).
4. 브라우저에서 `/` 접속 → 페이지 셸 + 헤더/푸터 렌더, 최신 당첨번호 카드에 안내+재시도 버튼, 상단에 전역 장애 배너 표시.
5. `/lotto/analysis/stats/numbers` 접속 → 분석 적용 시 안내 표시 (흰 화면/무한 스피너 아님).
6. 네트워크 탭에서 같은 API 가 쿼리당 최대 2회(원요청+재시도 1회) 또는 503 은 1회만 요청되는지 확인.

- [ ] **Step 3: "hang" 시나리오 (응답 없는 소켓)**

응답을 절대 주지 않는 로컬 소켓을 띄운다:

```bash
python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",9999)); s.listen()
while True:
    c,_=s.accept()' &
```

`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9999` 로 Step 2와 같이 dev 서버 재시작 후:
1. `curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" http://localhost:3000/` → **200**, 첫 요청 ~3초대(middleware 타임아웃), 이후 30초 쿨다운 동안 즉시 응답.
2. `curl -s -w "\n%{http_code} %{time_total}s\n" http://localhost:3000/api/points/balance` → **503**, ~8초 이내.
3. 완료 후 백그라운드 소켓 프로세스 종료 (`kill %1`).

- [ ] **Step 4: 정상 동작 회귀 확인**

환경변수 덮어쓰기 없이 `npm run dev` 로 재시작:
1. 홈에서 최신 당첨번호가 정상 표시되고 배너가 없다.
2. 로그인/로그아웃 정상 동작, 비로그인 상태로 `/mypage` 접근 시 기존대로 `/login` 리다이렉트.
3. 로그인 후 `/mypage`, 출석 카드, 포인트 잔액 정상 표시.

- [ ] **Step 5: 결함 수정 및 마무리 커밋**

체크리스트에서 발견된 결함을 수정하고 커밋한다. 모두 통과하면 브랜치 push 후 PR 생성은 사용자 확인을 받는다.
