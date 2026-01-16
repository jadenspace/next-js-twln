"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { usePaymentHistory } from "@/features/payments/hooks/use-payments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { PaymentStatus } from "@/features/payments/types";

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentHistoryModal({
  isOpen,
  onClose,
}: PaymentHistoryModalProps) {
  const { payments, isLoading, page, setPage, totalCount, LIMIT } =
    usePaymentHistory();

  const totalPages = Math.ceil(totalCount / LIMIT);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">완료</Badge>;
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
          >
            입금 대기
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-6 pb-4 sm:px-6 shrink-0">
          <DialogTitle>결제 내역</DialogTitle>
        </DialogHeader>

        <div className="h-[480px] flex flex-col px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : payments.length > 0 ? (
              <>
                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>신청일시</TableHead>
                        <TableHead>입금자명</TableHead>
                        <TableHead className="text-right">결제금액</TableHead>
                        <TableHead className="text-right">
                          충전 포인트
                        </TableHead>
                        <TableHead className="text-center">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm">
                            {format(
                              new Date(payment.created_at),
                              "MM-dd HH:mm",
                              { locale: ko },
                            )}
                          </TableCell>
                          <TableCell>{payment.depositor_name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {payment.amount.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-right text-blue-600">
                            +{payment.points_amount.toLocaleString()} P
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(payment.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-4 space-y-2 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), "MM-dd HH:mm", {
                            locale: ko,
                          })}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          입금자
                        </span>
                        <span className="font-medium">
                          {payment.depositor_name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-bold">
                          {payment.amount.toLocaleString()}원
                        </span>
                        <span className="font-bold text-blue-600">
                          +{payment.points_amount.toLocaleString()} P
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex justify-center items-center text-muted-foreground">
                결제 내역이 없습니다.
              </div>
            )}
          </div>

          {payments.length > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isLoading}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
