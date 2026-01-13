"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function PaymentManagement() {
  const queryClient = useQueryClient();

  const {
    data: payments,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments/admin/all");
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      return data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch("/api/payments/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (!res.ok) throw new Error("Approval failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("결제 승인이 완료되었습니다.");
      refetch(); // 데이터를 직접 다시 불러옵니다.
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["userPoints"] }); // 헤더의 포인트 잔액 쿼리 키와 일치
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">결제 요청 관리</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["admin", "payments"] })
          }
        >
          새로고침
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>입금자명</TableHead>
              <TableHead>상품</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>요청일시</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.user?.email}
                </TableCell>
                <TableCell>{payment.depositor_name}</TableCell>
                <TableCell>{payment.package_name}</TableCell>
                <TableCell>{payment.amount.toLocaleString()}원</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      payment.status === "completed"
                        ? "default"
                        : payment.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {payment.status === "pending"
                      ? "대기중"
                      : payment.status === "completed"
                        ? "완료"
                        : "취소됨"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(payment.created_at), "yyyy-MM-dd HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  {payment.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(payment.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      승인
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {payments?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  결제 요청 내역이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
