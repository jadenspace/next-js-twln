"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const {
    signIn,
    signUp,
    isSigningIn,
    isSigningUp,
    signInMutation,
    signUpMutation,
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      signUp({ email, password });
    } else {
      signIn({ email, password });
    }
  };

  // 오류 처리
  useEffect(() => {
    if (signInMutation.error) {
      const error = signInMutation.error;

      if (error.message.includes("승인되지 않은 사용자")) {
        alert("승인되지 않은 사용자입니다. 관리자에게 문의하세요.");
      } else if (error.message.includes("Invalid login credentials")) {
        alert("이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.");
      } else if (error.message.includes("Email not confirmed")) {
        alert("이메일 인증이 필요합니다. 이메일을 확인해주세요.");
      } else if (error.message.includes("Too many requests")) {
        alert("너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else {
        alert(`인증에 실패했습니다: ${error.message}`);
      }
    }

    if (signUpMutation.error) {
      const error = signUpMutation.error;
      alert(`회원가입에 실패했습니다: ${error.message}`);
    }
  }, [signInMutation.error, signUpMutation.error]);

  // 성공 처리
  useEffect(() => {
    if (signInMutation.data) {
      router.push("/");
    }

    if (signUpMutation.data) {
      alert("회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.");
      router.push("/");
    }
  }, [signInMutation.data, signUpMutation.data, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div
        className={`w-full max-w-md space-y-8 p-8 rounded-lg border-2 transition-all duration-300 ${
          isSignUp
            ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
        }`}
      >
        <div className="text-center">
          <h1
            className={`text-3xl font-bold ${
              isSignUp
                ? "text-blue-800 dark:text-blue-200"
                : "text-green-800 dark:text-green-200"
            }`}
          >
            {isSignUp ? "회원가입" : "로그인"}
          </h1>
          <p
            className={`mt-2 ${
              isSignUp
                ? "text-blue-600 dark:text-blue-300"
                : "text-green-600 dark:text-green-300"
            }`}
          >
            TWLN 계정으로 {isSignUp ? "가입" : "로그인"}하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className={`w-full transition-all duration-300 ${
              isSignUp
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            disabled={isSigningIn || isSigningUp}
          >
            {isSigningIn || isSigningUp
              ? "처리 중..."
              : isSignUp
              ? "회원가입"
              : "로그인"}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className={`text-sm font-medium transition-all duration-300 ${
              isSignUp
                ? "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                : "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            }`}
          >
            {isSignUp
              ? "이미 계정이 있으신가요? 로그인"
              : "계정이 없으신가요? 회원가입"}
          </button>
        </div>

        {!isSignUp && (
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              <button
                onClick={() => (window.location.href = "/find-id")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
              >
                아이디 찾기
              </button>
              <button
                onClick={() => (window.location.href = "/forgot-password")}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                비밀번호 찾기
              </button>
            </div>
          </div>
        )}

        <div
          className={`mt-8 p-4 rounded-lg border ${
            isSignUp
              ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
              : "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
          }`}
        >
          <p
            className={`text-sm ${
              isSignUp
                ? "text-blue-800 dark:text-blue-200"
                : "text-green-800 dark:text-green-200"
            }`}
          >
            <strong>개발 모드:</strong> 현재 더미 Supabase 설정을 사용 중입니다.
            실제 인증을 테스트하려면 Supabase 프로젝트를 설정하고 환경 변수를
            업데이트하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
