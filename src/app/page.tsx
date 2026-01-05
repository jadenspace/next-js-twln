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
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
              TWLN 로또 분석 서비스
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              빅데이터와 AI 기반으로 로또 당첨 확률을 높이는 프리미엄 인사이트를
              경험하세요.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <LottoResultCard />
            </div>
          </div>

          {isAuthenticated ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Dashboard Basics */}
              <div className="lg:col-span-2 space-y-8">
                <AttendanceCard />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FeatureLinkCard
                    title="번호 검색"
                    description="역대 당첨번호를 회차별, 날짜별로 조회"
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
                    title="패턴 분석"
                    description="연속번호, AC값 등 심층 패턴 매칭"
                    href="/lotto/analysis/pattern"
                    icon={<TrendingUp className="w-6 h-6" />}
                  />
                  <FeatureLinkCard
                    title="AI 번호 추천"
                    description="AI가 제안하는 이번 주 행운의 번호"
                    href="/lotto/analysis/recommend"
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

              {/* Right Column: User Info / Points Info */}
              <div className="space-y-6">
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
              </div>
            </div>
          ) : (
            <div className="text-center space-y-8">
              <div className="flex justify-center gap-4">
                <Link href="/login">
                  <Button id="btn-get-started" size="lg" className="px-8">
                    시작하기
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI 추천 서비스</CardTitle>
                    <CardDescription>
                      머신러닝 알고리즘 기반 추천
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>통계 데이터</CardTitle>
                    <CardDescription>
                      1,200회 이상의 누적 데이터
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>포인트 시스템</CardTitle>
                    <CardDescription>합리적인 포인트 기반 과금</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          )}
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
