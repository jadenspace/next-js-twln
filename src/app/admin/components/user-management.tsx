"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalApi } from "@/features/auth/api/approval-api";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function UserManagement() {
  const queryClient = useQueryClient();

  // 대기 중인 사용자
  const { data: pendingUsers, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "pending-users"],
    queryFn: approvalApi.getPendingUsers,
  });

  // 승인된 사용자
  const { data: approvedUsers, isLoading: approvedLoading } = useQuery({
    queryKey: ["admin", "approved-users"],
    queryFn: approvalApi.getApprovedUsers,
  });

  const approveMutation = useMutation({
    mutationFn: (email: string) =>
      approvalApi.approveUser(email, "System Admin"),
    onSuccess: () => {
      toast.success("사용자가 승인되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (email: string) => approvalApi.revokeApproval(email),
    onSuccess: () => {
      toast.success("승인이 취소되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  if (pendingLoading || approvedLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-12">
      {/* Pending Users */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          승인 대기 ({pendingUsers?.length || 0})
        </h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(user.email)}
                      disabled={approveMutation.isPending}
                    >
                      <UserCheck className="w-4 h-4 mr-1" /> 승인
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingUsers?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    대기 중인 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Approved Users */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          승인된 사용자 ({approvedUsers?.length || 0})
        </h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이메일</TableHead>
                <TableHead>승인일</TableHead>
                <TableHead>승인자</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedUsers?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.approved_at), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.approved_by}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeMutation.mutate(user.email)}
                      disabled={revokeMutation.isPending}
                    >
                      <UserX className="w-4 h-4 mr-1" /> 승인 취소
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {approvedUsers?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    승인된 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
