"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import { PointBalance } from "@/features/points/components/point-balance";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/auth/api/admin-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  ChevronDown,
  BarChart2,
  Zap,
  Search,
  Brain,
  PlayCircle,
  Users,
  Binary,
} from "lucide-react";

const STATS_MENU = {
  basic: [
    { href: "/lotto/analysis/stats/numbers", label: "번호별 통계" },
    { href: "/lotto/analysis/stats/ranges", label: "구간별 출현횟수" },
    { href: "/lotto/analysis/stats/missing", label: "기간별 미출현 번호" },
    { href: "/lotto/analysis/stats/odd-even", label: "홀짝 통계" },
    { href: "/lotto/analysis/stats/consecutive", label: "연속번호 출현" },
  ],
  advanced: [
    { href: "/lotto/analysis/stats/regression", label: "n회귀 통계" },
    {
      href: "/lotto/analysis/stats/markov",
      label: "마르코프 체인 / 전이 확률",
    },
    { href: "/lotto/analysis/stats/japanese", label: "후나츠 사카이 분석" },
    {
      href: "/lotto/analysis/stats/monte-carlo",
      label: "몬테카를로 시뮬레이션",
    },
    { href: "/lotto/analysis/stats/algorithm", label: "알고리즘 기법 (MC 등)" },
    { href: "/lotto/analysis/stats/ending-digit", label: "끝수 통계" },
    { href: "/lotto/analysis/stats/nine-ranges", label: "9구간 통계" },
    { href: "/lotto/analysis/stats/interval", label: "간격 통계" },
    { href: "/lotto/analysis/stats/compatibility", label: "궁합수 통계" },
    { href: "/lotto/analysis/stats/math", label: "소수/합성수/3배수 통계" },
  ],
};
const GENERATE_MENU = [
  { href: "/lotto/generate/random", label: "실시간 추첨" },
  { href: "/lotto/generate/pattern", label: "패턴 조합" },
];

const NAV_ITEMS = [
  {
    href: "/lotto/search",
    label: "당첨번호 검색",
    icon: Search,
    isPublic: true,
  },
  {
    href: "/lotto/analysis/recommend",
    label: "AI 추천",
    icon: Brain,
    isPublic: false,
  },
  {
    href: "/lotto/analysis/simulation",
    label: "시뮬레이션",
    icon: PlayCircle,
    isPublic: false,
  },
  { href: "/community", label: "게시판", icon: Users, isPublic: true },
];

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();

  const { data: isAdmin } = useQuery({
    queryKey: ["admin", "is-admin", user?.email],
    queryFn: () => (user?.email ? adminApi.isUserAdmin(user.email) : false),
    enabled: !!user?.email,
  });

  const isStatsActive = pathname?.includes("/lotto/analysis/stats");
  const isGenerateActive = pathname?.includes("/lotto/generate");

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              D
            </div>
            로또탐정
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md",
                    isStatsActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground",
                  )}
                >
                  <BarChart2 className="w-4 h-4" />
                  번호 통계
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[480px] p-0" align="start">
                <div className="grid grid-cols-2">
                  <div className="p-4 border-r bg-muted/20">
                    <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-3 uppercase tracking-wider">
                      기본 통계
                    </h4>
                    <div className="space-y-1">
                      {STATS_MENU.basic.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "block px-2 py-1.5 text-sm rounded-md transition-colors",
                            pathname === item.href
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground px-2 mb-3 uppercase tracking-wider flex justify-between items-center">
                      심화 통계
                      {!isAuthenticated && (
                        <span className="text-[10px] text-orange-500 font-bold border border-orange-200 px-1.5 rounded animate-pulse">
                          로그인 필요
                        </span>
                      )}
                    </h4>
                    <div className="space-y-1">
                      {STATS_MENU.advanced.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "block px-2 py-1.5 text-sm rounded-md transition-colors",
                            pathname === item.href
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                            !isAuthenticated && "opacity-60",
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md",
                    isGenerateActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground",
                  )}
                >
                  <Zap className="w-4 h-4" />
                  번호 생성
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-1">
                  {GENERATE_MENU.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block px-3 py-2 text-sm rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        !isAuthenticated && "opacity-60",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isPrivate = !item.isPublic && !isAuthenticated;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-primary rounded-md relative",
                    pathname === item.href
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:bg-muted/50",
                    isPrivate && "opacity-60",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:block text-xs text-muted-foreground hover:text-primary font-medium mr-2"
                >
                  관리자
                </Link>
              )}
              <PointBalance />
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                로그아웃
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">로그인</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
