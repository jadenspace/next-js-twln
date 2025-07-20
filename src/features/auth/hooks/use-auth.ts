"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "../model/auth-store";

export const useAuth = () => {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } =
    useAuthStore();
  const queryClient = useQueryClient();

  // 현재 사용자 정보 가져오기
  const { data: currentUser } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: authApi.getCurrentUser,
    enabled: !isAuthenticated && !isLoading,
    retry: false,
  });

  // 로그인 뮤테이션
  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.signIn(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      console.error("로그인 실패:", error);
    },
  });

  // 회원가입 뮤테이션
  const signUpMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.signUp(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      console.error("회원가입 실패:", error);
    },
  });

  // 로그아웃 뮤테이션
  const signOutMutation = useMutation({
    mutationFn: authApi.signOut,
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: (error) => {
      console.error("로그아웃 실패:", error);
    },
  });

  // 비밀번호 재설정 뮤테이션
  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onError: (error) => {
      console.error("비밀번호 재설정 실패:", error);
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
    isLoading,
    isAuthenticated,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
  };
};
