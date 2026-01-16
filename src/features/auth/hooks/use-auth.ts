"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { approvalApi } from "../api/approval-api";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "../model/auth-store";

export const useAuth = () => {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } =
    useAuthStore();
  const queryClient = useQueryClient();

  // 현재 사용자 정보 가져오기 (항상 실행)
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  // 사용자 승인 상태 확인
  const { data: approvalStatus } = useQuery({
    queryKey: ["auth", "approval", currentUser?.email],
    queryFn: () => {
      if (!currentUser?.email) throw new Error("사용자 이메일이 없습니다.");
      return approvalApi.checkApprovalStatus(currentUser.email);
    },
    enabled: !!currentUser?.email,
    retry: false,
  });

  // 로그인 뮤테이션
  const signInMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const result = await authApi.signIn(email, password);
      if ("error" in result) {
        // 오류를 throw하지 말고 오류 객체 반환
        return Promise.reject(result.error);
      }
      return result.data;
    },
    onSuccess: async (data) => {
      // 로그인 성공 후 승인 상태 확인
      try {
        if (!data.user.email) {
          throw new Error("사용자 이메일이 없습니다.");
        }
        const approval = await approvalApi.checkApprovalStatus(data.user.email);
        if (!approval.is_approved) {
          throw new Error(
            "이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.",
          );
        }
      } catch (error) {
        console.error("승인 확인 실패:", error);
        // 승인되지 않은 사용자는 로그아웃 처리
        await authApi.signOut();
        throw error;
      }

      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      console.log("로그인 실패:", error);
    },
  });

  // 회원가입 뮤테이션
  const signUpMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const result = await authApi.signUp(email, password);
      if ("error" in result) {
        // 오류를 throw하지 말고 오류 객체 반환
        return Promise.reject(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      console.log("회원가입 실패:", error);
    },
  });

  // 로그아웃 뮤테이션
  const signOutMutation = useMutation({
    mutationFn: authApi.signOut,
    onSuccess: () => {
      logout();
      queryClient.clear();

      // 로그아웃 후 홈페이지(대시보드)로 이동
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    },
    onError: (error) => {
      console.error("로그아웃 실패:", error);
    },
  });

  // 비밀번호 재설정 뮤테이션
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await authApi.resetPassword(email);
      if ("error" in result) {
        return Promise.reject({ message: result.error });
      }
      return result;
    },
    onError: (error) => {
      console.error("비밀번호 재설정 실패:", error);
    },
  });

  // 이메일 존재 확인 뮤테이션
  const checkEmailMutation = useMutation({
    mutationFn: authApi.checkEmailExists,
    onError: (error) => {
      console.error("이메일 확인 실패:", error);
    },
  });

  // 비밀번호 업데이트 뮤테이션
  const updatePasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.updatePassword(token, password),
    onError: (error) => {
      console.error("비밀번호 업데이트 실패:", error);
    },
  });

  // 현재 사용자 정보가 변경되면 스토어 업데이트
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser, setUser]);

  return {
    user,
    isLoading: userLoading || isLoading,
    isAuthenticated,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    checkEmail: checkEmailMutation.mutate,
    updatePassword: updatePasswordMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isCheckingEmail: checkEmailMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
    signInMutation,
    signUpMutation,
    resetPasswordMutation,
    checkEmailMutation,
    updatePasswordMutation,
  };
};
