"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PaymentStatus } from "@/features/payments/types";

export default function PaymentsHistoryPage() {
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
    <div className="container max-w-5xl py-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/points/charge">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">결제 내역</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>무통장 입금 신청 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : payments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>신청일시</TableHead>
                    <TableHead>주문번호</TableHead>
                    <TableHead>입금자명</TableHead>
                    <TableHead className="text-right">결제금액</TableHead>
                    <TableHead className="text-right">충전 포인트</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(
                          new Date(payment.created_at),
                          "yyyy-MM-dd HH:mm",
                          { locale: ko },
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {payment.order_id}
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

              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  다음
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              결제 내역이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
