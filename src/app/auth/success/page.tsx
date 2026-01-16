"use client";

import { approvalApi } from "@/features/auth/api/approval-api";
import { authApi } from "@/features/auth/api/auth-api";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AuthSuccessContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // URL에서 인증 결과 확인
        const error = searchParams?.get("error");
        const errorDescription = searchParams?.get("error_description");

        if (error) {
          setStatus("error");
          setError(`인증 실패: ${errorDescription || error}`);
          return;
        }

        // 현재 사용자 정보 가져오기
        const currentUser = await authApi.getCurrentUser();

        if (!currentUser) {
          setStatus("error");
          setError("사용자 정보를 가져올 수 없습니다.");
          return;
        }

        // 이메일 인증 성공 후 자동 승인 처리
        if (currentUser.email) {
          try {
            await approvalApi.approveUser(currentUser.email, "system");
            setStatus("success");
            setMessage("이메일 인증이 완료되었습니다.");
          } catch (approvalError) {
            console.error("자동 승인 실패:", approvalError);
            setStatus("success");
            setMessage(
              "이메일 인증이 완료되었습니다. 관리자 승인을 기다려주세요.",
            );
          }
        } else {
          setStatus("success");
          setMessage("이메일 인증이 완료되었습니다!");
        }
      } catch (err) {
        setStatus("error");
        setError(
          `인증 처리 중 오류가 발생했습니다: ${
            err instanceof Error ? err.message : "알 수 없는 오류"
          }`,
        );
      }
    };

    handleAuthSuccess();
  }, [searchParams]);

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleGoToHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            이메일 인증
          </CardTitle>
          <CardDescription>
            {status === "loading" && "이메일 인증을 처리하고 있습니다..."}
            {status === "success" && "인증이 성공적으로 완료되었습니다."}
            {status === "error" && "인증 처리 중 문제가 발생했습니다."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                잠시만 기다려주세요...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">인증 완료!</h3>
              <p className="text-muted-foreground mb-4">{message}</p>

              <div className="w-full p-4 bg-muted/50 rounded-lg text-left">
                <p className="text-xs text-muted-foreground">
                  <strong>참고:</strong> 이메일 인증이 완료되면 자동으로 계정이
                  승인됩니다. 문제가 발생하면 관리자에게 문의하세요.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-4">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-2">인증 실패</h3>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {status === "success" && (
            <>
              <Button onClick={handleGoToLogin} className="w-full">
                로그인하기
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full"
              >
                홈으로 이동
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <Button onClick={handleGoToLogin} className="w-full">
                로그인 페이지로
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full"
              >
                홈으로 이동
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            이메일 인증
          </CardTitle>
          <CardDescription>페이지를 로딩하고 있습니다...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthSuccessContent />
    </Suspense>
  );
}
