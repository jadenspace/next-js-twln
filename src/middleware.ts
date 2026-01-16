import { createMiddlewareClient } from "@/shared/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createMiddlewareClient(request);

  // AUTH CHECK
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDevelopment =
    process.env.NODE_ENV === "development" &&
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("dummy") ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("dummy"));

  const pathname = request.nextUrl.pathname;

  // Debug log
  console.log("[Middleware]", {
    pathname,
    hasUser: !!user,
    isDevelopment,
  });

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
    "/lotto/generate/random",
    "/lotto/generate/manual-pattern",
    "/lotto/analysis/simulation",
  ];

  const isPublicPath = publicPaths.some(
    (path) =>
      pathname === path || (path !== "/" && pathname.startsWith(path + "/")),
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
  if (!isDevelopment && !user) {
    // If not public path and not basic stats path, redirect to login
    // BUT explicitly block advanced stats paths
    if (isAdvancedStatsPath || (!isPublicPath && !isBasicStatsPath)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
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
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
