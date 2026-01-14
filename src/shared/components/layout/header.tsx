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
  Menu,
  X,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

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
  { href: "/community", label: "문의/답변", icon: Users, isPublic: true },
];

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  // Mobile Menu States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [isMobileGenerateOpen, setIsMobileGenerateOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["admin", "is-admin", user?.email],
    queryFn: () => (user?.email ? adminApi.isUserAdmin(user.email) : false),
    enabled: !!user?.email,
  });

  const isStatsActive = pathname?.includes("/lotto/analysis/stats");
  const isGenerateActive = pathname?.includes("/lotto/generate");

  // Auto-open submenus when mobile menu opens if on that page
  useEffect(() => {
    if (isMobileMenuOpen) {
      if (isStatsActive) {
        setIsMobileStatsOpen(true);
      }
      if (isGenerateActive) {
        setIsMobileGenerateOpen(true);
      }
    }
  }, [isMobileMenuOpen, isStatsActive, isGenerateActive]);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="w-full max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-4 xl:gap-8">
            {/* Mobile Hamburger Button */}
            <button
              className="xl:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link
              href="/"
              className="font-bold text-xl flex items-center gap-2 absolute left-1/2 -translate-x-1/2 xl:static xl:left-auto xl:translate-x-0"
            >
              <div className="hidden xl:flex w-8 h-8 bg-primary rounded-lg items-center justify-center text-primary-foreground">
                D
              </div>
              <span className="hidden sm:inline-block">로또탐정</span>
              <span className="sm:hidden">로또탐정</span>
            </Link>

            <nav className="hidden xl:flex items-center gap-1">
              <Popover open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                <PopoverTrigger asChild>
                  <button
                    onMouseEnter={() => setIsStatsOpen(true)}
                    onMouseLeave={() => setIsStatsOpen(false)}
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
                <PopoverContent
                  onMouseEnter={() => setIsStatsOpen(true)}
                  onMouseLeave={() => setIsStatsOpen(false)}
                  className="w-[480px] p-0"
                  align="start"
                >
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
                            href={!isAuthenticated ? "#" : item.href}
                            className={cn(
                              "block px-2 py-1.5 text-sm rounded-md transition-colors",
                              pathname === item.href
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground",
                              !isAuthenticated
                                ? "opacity-60 pointer-events-none"
                                : "hover:bg-muted hover:text-foreground",
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

              <Popover open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <PopoverTrigger asChild>
                  <button
                    onMouseEnter={() => setIsGenerateOpen(true)}
                    onMouseLeave={() => setIsGenerateOpen(false)}
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
                <PopoverContent
                  onMouseEnter={() => setIsGenerateOpen(true)}
                  onMouseLeave={() => setIsGenerateOpen(false)}
                  className="w-48 p-2"
                  align="start"
                >
                  <div className="space-y-1">
                    {GENERATE_MENU.map((item) => (
                      <Link
                        key={item.href}
                        href={!isAuthenticated ? "#" : item.href}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-md transition-colors",
                          pathname === item.href
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground",
                          !isAuthenticated
                            ? "opacity-60 pointer-events-none"
                            : "hover:bg-muted hover:text-foreground",
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
                    href={isPrivate ? "#" : item.href}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md relative",
                      pathname === item.href
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground",
                      isPrivate
                        ? "opacity-60 pointer-events-none"
                        : "hover:text-primary hover:bg-muted/50",
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="hidden xl:inline-flex"
                >
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

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 xl:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-[80%] max-w-[320px] bg-background z-[51] xl:hidden flex flex-col shadow-xl transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
          <Link
            href="/"
            className="font-bold text-xl flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              D
            </div>
            로또탐정
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {/* Stats Section */}
          <div className="border-b pb-2 mb-2">
            <button
              onClick={() => setIsMobileStatsOpen(!isMobileStatsOpen)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-md transition-colors",
                isStatsActive
                  ? "text-primary bg-primary/5"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                번호 통계
              </div>
              {isMobileStatsOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {isMobileStatsOpen && (
              <div className="px-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  기본 통계
                </div>
                {STATS_MENU.basic.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-3 py-2 text-sm rounded-md pl-9 transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="px-3 py-1.5 mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  심화 통계
                  {!isAuthenticated && (
                    <span className="text-[10px] text-orange-500 font-bold">
                      로그인 필요
                    </span>
                  )}
                </div>
                {STATS_MENU.advanced.map((item) => (
                  <Link
                    key={item.href}
                    href={!isAuthenticated ? "#" : item.href}
                    className={cn(
                      "block px-3 py-2 text-sm rounded-md pl-9 transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground",
                      !isAuthenticated
                        ? "opacity-60 pointer-events-none"
                        : "hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Generate Section */}
          <div className="border-b pb-2 mb-2">
            <button
              onClick={() => setIsMobileGenerateOpen(!isMobileGenerateOpen)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-md transition-colors",
                isGenerateActive
                  ? "text-primary bg-primary/5"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                번호 생성
              </div>
              {isMobileGenerateOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {isMobileGenerateOpen && (
              <div className="px-2 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {GENERATE_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={!isAuthenticated ? "#" : item.href}
                    className={cn(
                      "block px-3 py-2 text-sm rounded-md pl-9 transition-colors",
                      pathname === item.href
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground",
                      !isAuthenticated
                        ? "opacity-60 pointer-events-none"
                        : "hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Other Nav Items */}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isPrivate = !item.isPublic && !isAuthenticated;
            return (
              <Link
                key={item.href}
                href={isPrivate ? "#" : item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors rounded-md",
                  pathname === item.href
                    ? "text-primary bg-primary/5"
                    : "text-foreground hover:bg-muted",
                  isPrivate ? "opacity-60 pointer-events-none" : "",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t bg-muted/20">
          {!isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link href="/login" className="w-full">
                <Button className="w-full">로그인</Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">
                로그인 후 모든 기능을 이용해보세요
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground px-1">
                {user?.email}
              </p>
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    관리자 페이지
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={() => signOut()}
              >
                로그아웃
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
