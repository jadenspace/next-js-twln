"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import { PointBalance } from "@/features/points/components/point-balance";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/lotto/search", label: "번호 검색" },
  { href: "/lotto/analysis/stats", label: "기본 통계" },
  { href: "/lotto/analysis/pattern", label: "패턴 분석" },
  { href: "/lotto/analysis/recommend", label: "AI 추천" },
  { href: "/lotto/analysis/simulation", label: "시뮬레이션" },
  { href: "/community", label: "게시판" },
];

export function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl flex items-center gap-2">
            TWLN
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
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
