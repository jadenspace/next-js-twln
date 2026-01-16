"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback");
  const {
    signIn,
    signUp,
    isSigningIn,
    isSigningUp,
    signInMutation,
    signUpMutation,
    resendVerification,
    isResendingVerification,
    resendVerificationMutation,
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      if (password !== confirmPassword) {
        return;
      }
      signUp({ email, password });
    } else {
      signIn({ email, password });
    }
  };

  // 로그인 처리 관련 Effect
  useEffect(() => {
    if (signInMutation.error) {
      const error = signInMutation.error as any;
      if (
        error.code === "invalid_credentials" ||
        error.message?.includes("Invalid login credentials")
      ) {
        alert("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (
        error.code === "email_not_confirmed" ||
        error.message?.includes("Email not confirmed")
      ) {
        setShowResendButton(true);
        setResendEmail(email);
        alert(
          "이메일 인증이 필요합니다. 가입 시 입력한 이메일을 확인해주세요.",
        );
      } else {
        alert(error.message || "로그인 중 오류가 발생했습니다.");
      }
    }

    if (signInMutation.data) {
      const redirectUrl = callbackUrl || "/";
      router.push(redirectUrl);
    }
  }, [signInMutation.error, signInMutation.data, router, callbackUrl]);

  // 회원가입 처리 관련 Effect
  useEffect(() => {
    if (signUpMutation.error) {
      const error = signUpMutation.error as any;
      if (
        error.code === "user_already_exists" ||
        error.message?.includes("User already registered")
      ) {
        alert("이미 가입된 이메일입니다.");
      } else {
        alert(error.message || "회원가입 중 오류가 발생했습니다.");
      }
    }

    if (signUpMutation.data) {
      alert(
        "입력하신 이메일로 인증 메일을 발송했습니다. 인증 후 로그인해주세요.",
      );
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      signUpMutation.reset();

      const redirectUrl = callbackUrl || "/login";
      if (redirectUrl !== "/login") {
        router.push(redirectUrl);
      }
    }
  }, [signUpMutation.error, signUpMutation.data, router, callbackUrl]);

  // 재인증 메일 발송 처리 Effect
  useEffect(() => {
    if (resendVerificationMutation.error) {
      const error = resendVerificationMutation.error as any;
      alert(error.message || "인증 메일 재발송 중 오류가 발생했습니다.");
    }

    if (resendVerificationMutation.data) {
      alert("인증 메일이 재발송되었습니다. 이메일을 확인해주세요.");
      setShowResendButton(false);
      resendVerificationMutation.reset();
    }
  }, [resendVerificationMutation.error, resendVerificationMutation.data]);

  const isLoading = isSigningIn || isSigningUp;

  const handleModeToggle = () => {
    setIsSignUp(!isSignUp);
    signInMutation.reset();
    signUpMutation.reset();
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowResendButton(false);
  };

  const handleResendVerification = () => {
    if (resendEmail) {
      resendVerification(resendEmail);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? "회원가입" : "로그인"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "서비스 이용을 위해 계정을 생성해주세요."
              : "서비스 이용을 위해 로그인이 필요합니다."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                tabIndex={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                {!isSignUp && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:underline"
                    tabIndex={5}
                  >
                    비밀번호 찾기
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                tabIndex={2}
              />
            </div>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  tabIndex={3}
                />
                {password &&
                  confirmPassword &&
                  password !== confirmPassword && (
                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1">
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button
              className="w-full"
              type="submit"
              disabled={isLoading || (isSignUp && password !== confirmPassword)}
              tabIndex={4}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "가입하기" : "로그인"}
            </Button>

            {showResendButton && !isSignUp && (
              <Button
                variant="outline"
                className="w-full border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
              >
                {isResendingVerification && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                인증 메일 재발송하기
              </Button>
            )}

            <div className="text-center text-sm text-muted-foreground">
              {isSignUp ? "이미 계정이 있으신가요? " : "계정이 없으신가요? "}
              <button
                type="button"
                onClick={handleModeToggle}
                className="underline underline-offset-4 hover:text-primary"
                tabIndex={6}
              >
                {isSignUp ? "로그인" : "회원가입"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">
                로딩 중...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
