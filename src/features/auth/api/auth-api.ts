import { createClient } from "@/shared/lib/supabase/client";

export const authApi = {
  async signIn(email: string, password: string) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 오류를 throw하지 말고 오류 메시지만 반환
      return { error: error.message };
    }

    return { data };
  },

  async signUp(email: string, password: string) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/success`,
        data: {
          // 추가 메타데이터
        },
      },
    });

    if (error) {
      // 오류를 throw하지 말고 오류 메시지만 반환
      return { error: error.message };
    }

    // 회원가입 성공 후 수동으로 프로필 생성
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            is_approved: false,
          });

        if (profileError) {
          console.error("프로필 생성 실패:", profileError);
          // 프로필 생성 실패해도 회원가입은 성공으로 처리
        }
      } catch (profileErr) {
        console.error("프로필 생성 중 오류:", profileErr);
        // 프로필 생성 실패해도 회원가입은 성공으로 처리
      }
    }

    return { data };
  },

  async signOut() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  async getCurrentUser() {
    const supabase = createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return user;
  },

  async resetPassword(email: string) {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  },

  async updatePassword(token: string, newPassword: string) {
    const supabase = createClient();

    // 먼저 토큰으로 세션을 복원 시도
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(token);

      if (error) {
        // exchangeCodeForSession이 실패하면 기존 방식으로 시도
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        // 세션 복원 성공 후 비밀번호 업데이트
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          throw new Error(updateError.message);
        }
      }
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "비밀번호 업데이트 실패"
      );
    }
  },

  async confirmEmail(token: string, type?: string | null) {
    const supabase = createClient();

    try {
      // 이메일 인증 처리 - 여러 방식 시도
      const types = ["email", "signup", "signup_confirm"];

      for (const authType of types) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: authType as any,
          });

          if (!error && data) {
            return { data };
          }
        } catch (err) {
          // 다음 타입으로 시도
          continue;
        }
      }

      return {
        error:
          "이메일 인증에 실패했습니다. 토큰이 유효하지 않거나 만료되었습니다.",
      };
    } catch (err) {
      return {
        error: `인증 처리 중 오류가 발생했습니다: ${
          err instanceof Error ? err.message : "알 수 없는 오류"
        }`,
      };
    }
  },

  async checkEmailExists(email: string) {
    const supabase = createClient();

    try {
      // Supabase에서 이메일 존재 여부를 확인하는 더 정확한 방법
      // user_profiles 테이블에서 이메일로 검색
      const { data, error } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("email", email)
        .single();

      if (error) {
        // 데이터가 없거나 다른 오류
        if (error.code === "PGRST116") {
          // 데이터가 없음
          return { exists: false };
        }
        return { error: error.message };
      }

      // 데이터가 있으면 이메일이 존재함
      return { exists: true, email: data.email };
    } catch (err) {
      return {
        error: `이메일 확인 중 오류가 발생했습니다: ${
          err instanceof Error ? err.message : "알 수 없는 오류"
        }`,
      };
    }
  },
};
