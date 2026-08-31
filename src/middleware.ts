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
      const { supabase, getSupabaseResponse } = createMiddlewareClient(request);
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

  // Public paths allowed for everyone
  const publicPaths = [
    "/",
    "/login",
    "/auth",
    "/reset-password",
    "/forgot-password",
    "/find-id",
    "/test-supabase",
    "/api",
    "/lotto/search",
    "/lotto/generate",
    "/lotto/generate/random",
    "/lotto/analysis/simulation",
    "/privacy",
    "/terms",
    "/refund-policy",
  ];

  const isPublicPath = publicPaths.some(
    (path) =>
      pathname === path || (path !== "/" && pathname.startsWith(path + "/")),
  );

  // Restricted Generate paths (require login)
  const restrictedGeneratePaths = ["/lotto/generate/manual-pattern"];
  const isRestrictedGeneratePath = restrictedGeneratePaths.some(
    (path) => pathname === path,
  );

  // Basic Statistics paths (allowed for everyone)
  const basicStatsPaths = [
    "/lotto/analysis/stats", // Dashboard/Main
    "/lotto/analysis/stats/numbers",
    "/lotto/analysis/stats/ranges",
    "/lotto/analysis/stats/missing",
    "/lotto/analysis/stats/odd-even",
    "/lotto/analysis/stats/consecutive",
  ];

  const isBasicStatsPath = basicStatsPaths.some((path) => pathname === path);

  // Advanced Statistics paths (require login)
  const advancedStatsPaths = [
    "/lotto/analysis/stats/regression",
    "/lotto/analysis/stats/markov",
    "/lotto/analysis/stats/japanese",
    "/lotto/analysis/stats/monte-carlo",
    "/lotto/analysis/stats/algorithm",
    "/lotto/analysis/stats/ending-digit",
    "/lotto/analysis/stats/nine-ranges",
    "/lotto/analysis/stats/interval",
    "/lotto/analysis/stats/compatibility",
    "/lotto/analysis/stats/math",
  ];

  const isAdvancedStatsPath = advancedStatsPaths.some(
    (path) => pathname === path,
  );

  // Redirection logic
  if (!user) {
    // If not public path and not basic stats path, redirect to login
    // BUT explicitly block advanced stats paths and restricted generate paths
    if (
      isAdvancedStatsPath ||
      isRestrictedGeneratePath ||
      (!isPublicPath && !isBasicStatsPath)
    ) {
      // Prevent infinite redirect loop if already on login page
      if (pathname === "/login") return supabaseResponse;

      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callback", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml
     * - robots.txt
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|html|ico|webmanifest)$).*)",
  ],
};
