"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const { signIn, signUp, isSigningIn, isSigningUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        await signUp({ email, password });
      } else {
        await signIn({ email, password });
      }
      router.push("/");
    } catch (error) {
      console.error("인증 에러:", error);
      alert(
        "인증에 실패했습니다. 더미 환경 변수를 사용 중이므로 실제 Supabase 프로젝트를 설정해주세요."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {isSignUp ? "회원가입" : "로그인"}
          </h1>
          <p className="mt-2 text-muted-foreground">
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
            className="w-full"
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
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isSignUp
              ? "이미 계정이 있으신가요? 로그인"
              : "계정이 없으신가요? 회원가입"}
          </button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>개발 모드:</strong> 현재 더미 Supabase 설정을 사용 중입니다.
            실제 인증을 테스트하려면 Supabase 프로젝트를 설정하고 환경 변수를
            업데이트하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
