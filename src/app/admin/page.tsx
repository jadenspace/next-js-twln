"use client";

import { approvalApi } from "@/features/auth/api/approval-api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ApprovedUser, PendingUser } from "@/shared/types/auth";
import { Button } from "@/shared/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string>("");

  // 개발 모드에서는 인증 체크를 건너뜀
  const isDevelopment = process.env.NODE_ENV === "development";

  // 승인 대기 중인 사용자 목록
  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "pending-users"],
    queryFn: approvalApi.getPendingUsers,
    enabled: isAuthenticated || isDevelopment,
  });

  // 승인된 사용자 목록
  const { data: approvedUsers, isLoading: approvedLoading } = useQuery({
    queryKey: ["admin", "approved-users"],
    queryFn: approvalApi.getApprovedUsers,
    enabled: isAuthenticated || isDevelopment,
  });

  // 사용자 승인 뮤테이션
  const approveMutation = useMutation({
    mutationFn: ({ email }: { email: string }) =>
      approvalApi.approveUser(email, user?.email || "admin"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setSelectedUser("");
    },
  });

  // 사용자 승인 취소 뮤테이션
  const revokeMutation = useMutation({
    mutationFn: ({ email }: { email: string }) =>
      approvalApi.revokeApproval(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setSelectedUser("");
    },
  });

  // 관리자가 아닌 경우 접근 차단 (개발 모드에서는 허용)
  if (!isAuthenticated && !isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
          <p className="text-muted-foreground">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">사용자 승인 및 관리</p>

          {isDevelopment && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>개발 모드:</strong> 현재 개발 환경에서 실행 중입니다.
                관리자 페이지에 자유롭게 접근할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 승인 대기 중인 사용자 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              승인 대기 중 ({pendingUsers?.length || 0})
            </h2>

            {pendingLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : pendingUsers && pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.map((user: PendingUser) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.email}</p>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground">
                          {user.full_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        가입일: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        approveMutation.mutate({ email: user.email })
                      }
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? "승인 중..." : "승인"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  승인 대기 중인 사용자가 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* 승인된 사용자 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              승인된 사용자 ({approvedUsers?.length || 0})
            </h2>

            {approvedLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">로딩 중...</p>
              </div>
            ) : approvedUsers && approvedUsers.length > 0 ? (
              <div className="space-y-4">
                {approvedUsers.map((user: ApprovedUser) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        승인일:{" "}
                        {new Date(user.approved_at).toLocaleDateString()}
                      </p>
                      {user.approved_by && (
                        <p className="text-xs text-muted-foreground">
                          승인자: {user.approved_by}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        revokeMutation.mutate({ email: user.email })
                      }
                      disabled={revokeMutation.isPending}
                    >
                      {revokeMutation.isPending ? "취소 중..." : "승인 취소"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  승인된 사용자가 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 통계 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border rounded-lg p-4 text-center">
            <h3 className="text-lg font-semibold">
              {pendingUsers?.length || 0}
            </h3>
            <p className="text-sm text-muted-foreground">승인 대기</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <h3 className="text-lg font-semibold">
              {approvedUsers?.length || 0}
            </h3>
            <p className="text-sm text-muted-foreground">승인된 사용자</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <h3 className="text-lg font-semibold">
              {(approvedUsers?.length || 0) + (pendingUsers?.length || 0)}
            </h3>
            <p className="text-sm text-muted-foreground">전체 사용자</p>
          </div>
        </div>
      </div>
    </div>
  );
}
