"use client";

import { authApi } from "@/features/auth/api/auth-api";
import { createClient } from "@/shared/lib/supabase/client";
import { useState } from "react";

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const testConnection = async () => {
    setStatus("연결 테스트 중...");
    setError("");

    try {
      const supabase = createClient();

      // 환경 변수 확인
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      setStatus(`환경 변수 확인:
URL: ${url ? "설정됨" : "설정되지 않음"}
KEY: ${key ? "설정됨" : "설정되지 않음"}`);

      if (!url || !key) {
        setError("환경 변수가 설정되지 않았습니다.");
        return;
      }

      // Supabase 연결 테스트
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setError(`Supabase 연결 실패: ${error.message}`);
      } else {
        setStatus("Supabase 연결 성공! 인증 시스템이 정상 작동합니다.");
      }
    } catch (err) {
      setError(
        `테스트 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
    }
  };

  const testSignUp = async () => {
    setStatus("회원가입 테스트 중...");
    setError("");

    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      await authApi.signUp(testEmail, testPassword);
      setStatus(`회원가입 성공! 테스트 이메일: ${testEmail}`);
    } catch (err) {
      setError(
        `회원가입 실패: ${
          err instanceof Error ? err.message : "알 수 없는 오류"
        }`
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Supabase 연결 테스트</h1>
          <p className="text-muted-foreground">
            Supabase 연결과 인증 시스템을 테스트합니다.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={testConnection}
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            연결 테스트
          </button>

          <button
            onClick={testSignUp}
            className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            회원가입 테스트
          </button>
        </div>

        {status && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
              {status}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="text-center">
          <a href="/login" className="text-blue-600 hover:text-blue-700">
            로그인 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
