"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/ui/card";
import { AttendanceCard } from "@/features/points/components/attendance-card";
import { Search, BarChart3, TrendingUp, Sparkles, Binary } from "lucide-react";
import Link from "next/link";

import { UserLevelInfo } from "@/features/gamification/components/user-level-info";
import { LottoResultCard } from "@/features/lotto/components/lotto-result-card";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              통계 분석 기반으로 로또 당첨 확률을 높이는{" "}
              <br className="md:hidden" /> 프리미엄 인사이트를 경험하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Feature Cards */}
            <div className="lg:col-span-2 space-y-8">
              <LottoResultCard />

              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureLinkCard
                  title="당첨번호 검색"
                  description="역대 당첨번호를 회차별로 조회"
                  href="/lotto/search"
                  icon={<Search className="w-6 h-6" />}
                />
                <FeatureLinkCard
                  title="기본 통계 분석"
                  description="번호별 빈도 및 홀짝 비율 통계"
                  href="/lotto/analysis/stats"
                  icon={<BarChart3 className="w-6 h-6" />}
                />
                <FeatureLinkCard
                  title="패턴 조합 생성"
                  description="원하는 패턴을 선택하고 조건에 맞는 번호 조합을 생성"
                  href="/lotto/generate/pattern"
                  icon={<Sparkles className="w-6 h-6" />}
                />
                <FeatureLinkCard
                  title="당첨 시뮬레이션"
                  description="내 번호로 과거 모든 회차 분석"
                  href="/lotto/analysis/simulation"
                  icon={<Binary className="w-6 h-6" />}
                />
              </div>
            </div>

            {/* Right Column: User Info */}
            <div className="space-y-8">
              {!isAuthenticated ? (
                <Card>
                  <CardHeader>
                    <CardTitle>내 정보</CardTitle>
                    <CardDescription>로그인이 필요합니다</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg">
                      <span className="text-sm font-medium">
                        관리 승인 상태
                      </span>
                      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                        미로그인
                      </span>
                    </div>
                    <Link href="/login" className="block">
                      <Button id="btn-charge" className="w-full font-bold">
                        로그인하기
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="-mt-4 md:mt-0">
                    <AttendanceCard />
                  </div>
                  {user && <UserLevelInfo userId={user.id} />}
                  <Card>
                    <CardHeader>
                      <CardTitle>내 정보</CardTitle>
                      <CardDescription>{user?.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg">
                        <span className="text-sm font-medium">
                          관리 승인 상태
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-500 text-white rounded">
                          승인됨
                        </span>
                      </div>
                      <Link href="/points/charge" className="block">
                        <Button id="btn-charge" className="w-full font-bold">
                          포인트 충전하기
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureLinkCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors h-full">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="p-2 bg-secondary rounded-lg">{icon}</div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="line-clamp-1">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
