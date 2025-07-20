"use client";

import { approvalApi } from "@/features/auth/api/approval-api";
import { authApi } from "@/features/auth/api/auth-api";
import { Button } from "@/shared/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthSuccessPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
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
            setMessage("이메일 인증이 완료되었고, 계정이 승인되었습니다!");
          } catch (approvalError) {
            console.error("자동 승인 실패:", approvalError);
            setStatus("success");
            setMessage(
              "이메일 인증이 완료되었습니다. 관리자 승인을 기다려주세요."
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
          }`
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 rounded-lg border-2 bg-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">이메일 인증</h1>
          <p className="text-muted-foreground">
            이메일 인증을 처리하고 있습니다...
          </p>
        </div>

        <div className="space-y-6">
          {status === "loading" && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                인증을 처리하고 있습니다...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                인증 완료!
              </h2>
              <p className="text-green-700 dark:text-green-300 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleGoToLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  로그인하기
                </Button>
                <Button
                  onClick={handleGoToHome}
                  variant="outline"
                  className="w-full"
                >
                  홈으로 이동
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                인증 실패
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
              <div className="space-y-3">
                <Button
                  onClick={handleGoToLogin}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  로그인 페이지로
                </Button>
                <Button
                  onClick={handleGoToHome}
                  variant="outline"
                  className="w-full"
                >
                  홈으로 이동
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>참고:</strong> 이메일 인증이 완료되면 자동으로 계정이
            승인됩니다. 문제가 발생하면 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
