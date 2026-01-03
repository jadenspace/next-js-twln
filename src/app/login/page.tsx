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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    if (signInMutation.error) {
      alert(signInMutation.error.message);
    }
    if (signUpMutation.error) {
      alert(signUpMutation.error.message);
    }
    if (signInMutation.data) {
      router.push("/");
    }
    if (signUpMutation.data) {
      alert("회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.");
      router.push("/");
    }
  }, [
    signInMutation.error,
    signUpMutation.error,
    signInMutation.data,
    signUpMutation.data,
    router,
  ]);

  const isLoading = isSigningIn || isSigningUp;

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
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                {!isSignUp && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:underline"
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
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "가입하기" : "로그인"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isSignUp ? "이미 계정이 있으신가요? " : "계정이 없으신가요? "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="underline underline-offset-4 hover:text-primary"
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
