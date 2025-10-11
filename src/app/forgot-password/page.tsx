"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/features/auth/api/auth-api";
import { Button } from "@/shared/ui/button";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 개발 모드 감지
  const isDevelopment =
    process.env.NODE_ENV === "development" &&
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("dummy") ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("dummy") ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    // 개발 모드에서는 더미 응답
    if (isDevelopment) {
      setTimeout(() => {
        setMessage(
          "개발 모드: 비밀번호 재설정 링크가 전송되었습니다. (실제 이메일은 전송되지 않습니다)",
        );
        setEmail("");
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      // 먼저 이메일 존재 여부 확인
      const checkResult = await authApi.checkEmailExists(email);

      if ("error" in checkResult) {
        setError(checkResult.error);
        return;
      }

      if ("exists" in checkResult && !checkResult.exists) {
        setError(
          "입력하신 이메일로 가입된 계정이 없습니다. 이메일 주소를 다시 확인해주세요.",
        );
        return;
      }

      // 이메일이 존재하면 비밀번호 재설정 링크 전송
      const resetResult = await authApi.resetPassword(email);

      if ("error" in resetResult) {
        setError(
          `비밀번호 재설정 링크 전송에 실패했습니다: ${resetResult.error}`,
        );
      } else if ("success" in resetResult) {
        setMessage(
          "입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해주세요.",
        );
        setEmail(""); // 성공 시 이메일 필드 초기화
      } else {
        setError("예상치 못한 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } catch (err) {
      setError("비밀번호 재설정 요청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
          <p className="text-muted-foreground mt-2">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를
            보내드립니다.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">이메일 주소</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="가입하신 이메일을 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                {message}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "처리 중..." : "비밀번호 재설정 링크 보내기"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <Button
            variant="link"
            onClick={() => (window.location.href = "/login")}
          >
            로그인 페이지로 돌아가기
          </Button>
          <div className="text-sm text-muted-foreground">
            아이디를 잊으셨나요?{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={() => (window.location.href = "/find-id")}
            >
              아이디 찾기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
