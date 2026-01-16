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
        // URL에서 인증 결과 확인 (Query String 및 Hash Fragment 모두 확인)
        const hash =
          typeof window !== "undefined"
            ? window.location.hash.substring(1)
            : "";
        const hashParams = new URLSearchParams(hash);

        const errorParam =
          searchParams?.get("error") || hashParams.get("error");
        const errorDescription =
          searchParams?.get("error_description") ||
          hashParams.get("error_description");

        if (errorParam) {
          setStatus("error");
          setError(`인증 실패: ${errorDescription || errorParam}`);
          return;
        }

        // 토큰이 hash에 있는 경우 Supabase Client가 세션을 처리할 시간을 주기 위해 잠시 대기
        const hasTokens =
          hash.includes("access_token") || hash.includes("refresh_token");
        if (hasTokens) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // 현재 사용자 정보 가져오기 (최대 3회 재시도)
        let currentUser = null;
        for (let i = 0; i < 3; i++) {
          currentUser = await authApi.getCurrentUser();
          if (currentUser) break;
          // 토큰이 있는 경우에만 재시도
          if (hasTokens) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          } else {
            break;
          }
        }

        if (!currentUser) {
          // 토큰이 아예 없는 경우라면 그냥 로그인 페이지로 유도
          if (!hasTokens) {
            setStatus("error");
            setError("인증 정보가 없습니다. 다시 로그인해 주세요.");
          } else {
            setStatus("error");
            setError(
              "사용자 정보를 가져올 수 없습니다. 로그인을 다시 시도해 주세요.",
            );
          }
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
              <p className="text-muted-foreground text-sm mb-4">{error}</p>

              {error.includes("otp_expired") ||
              error.includes("invalid or has expired") ? (
                <div className="w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-left">
                  <p className="text-xs text-amber-600 font-bold mb-1">
                    인증 링크 만료 안내:
                  </p>
                  <ul className="text-[11px] text-amber-700 space-y-1 list-disc list-inside">
                    <li>
                      인증 메일을 여러 번 요청했다면 가장 최신 메일의 링크를
                      클릭해주세요.
                    </li>
                    <li>
                      메일의 링크는 보안을 위해 1회용이며 일정 시간이 지나면
                      만료됩니다.
                    </li>
                    <li>
                      로그인 페이지에서 '인증 메일 재발송' 버튼을 눌러 새 메일을
                      받아보세요.
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="w-full p-4 bg-muted/50 rounded-lg text-left">
                  <p className="text-xs text-muted-foreground">
                    문제가 지속되면 고객센터나 관리자에게 문의해주세요.
                  </p>
                </div>
              )}
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
