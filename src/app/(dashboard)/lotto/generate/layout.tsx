"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";

import { useAuth } from "@/features/auth/hooks/use-auth";

const TABS = [
  {
    href: "/lotto/generate/random",
    label: "3D 추첨 시뮬레이션",
    isPublic: true,
  },
  {
    href: "/lotto/generate/manual-pattern",
    label: "패턴 조합 생성기",
    isPublic: false,
  },
];

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            번호 생성
          </h1>
          <p className="text-sm text-muted-foreground">
            다양한 방식으로 행운의 번호를 생성해보세요.
          </p>
        </div>

        <div className="flex items-center gap-1 border-b">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const isLocked = !tab.isPublic && !isAuthenticated && !isLoading;

            return (
              <Link
                key={tab.href}
                href={isLocked ? "/login?callback=" + tab.href : tab.href}
                className={cn(
                  "px-6 py-3 text-sm font-medium transition-all relative",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
