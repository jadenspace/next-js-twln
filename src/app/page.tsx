"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export default function Home() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">
            TWLN - Feature Sliced Design
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Next.js 앱이 FSD 아키텍처, Supabase Auth, TanStack Query, Zustand,
            shadcn/ui로 구성되어 있습니다.
          </p>

          {/* 인증 상태 표시 */}
          <div className="p-4 bg-muted rounded-lg max-w-md mx-auto">
            <p className="text-sm">
              <strong>인증 상태:</strong>{" "}
              {isAuthenticated ? "로그인됨" : "로그인되지 않음"}
            </p>
            {user && (
              <p className="text-sm text-muted-foreground mt-1">
                이메일: {user.email}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg">시작하기</Button>
            <Button variant="outline" size="lg">
              문서 보기
            </Button>
            {isAuthenticated ? (
              <>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => {
                    signOut();
                    // 로그아웃 후 즉시 로그인 페이지로 리다이렉트
                    setTimeout(() => {
                      window.location.href = "/login";
                    }, 100);
                  }}
                >
                  로그아웃
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => (window.location.href = "/admin")}
                >
                  관리자
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => (window.location.href = "/login")}
              >
                로그인
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle>Feature Sliced Design</CardTitle>
                <CardDescription>
                  확장 가능하고 유지보수하기 쉬운 아키텍처
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Supabase Auth</CardTitle>
                <CardDescription>SSR 지원 인증 시스템</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>TanStack Query</CardTitle>
                <CardDescription>강력한 서버 상태 관리</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* 개발 모드 알림 */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>개발 모드:</strong> 현재 더미 Supabase 설정을 사용
              중입니다. 실제 인증을 테스트하려면 Supabase 프로젝트를 설정하고
              환경 변수를 업데이트하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
