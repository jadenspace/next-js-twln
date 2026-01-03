import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { useQuery } from "@tanstack/react-query";
import { pointsApi } from "../api/points-api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

interface PointHistoryModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PointHistoryModal({
  userId,
  isOpen,
  onClose,
}: PointHistoryModalProps) {
  const [page, setPage] = useState(0);
  const LIMIT = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["pointTransactions", userId, page],
    queryFn: () => pointsApi.getPointTransactions(userId, LIMIT, page * LIMIT),
    enabled: isOpen && !!userId,
  });

  const transactions = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / LIMIT);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "charge":
        return "충전";
      case "use":
        return "사용";
      case "refund":
        return "환불";
      case "bonus":
        return "보너스";
      case "expire":
        return "소멸";
      default:
        return type;
    }
  };

  const getAmountColor = (amount: number) => {
    return amount > 0 ? "text-blue-600" : "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>포인트 내역</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>일시</TableHead>
                    <TableHead>구분</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead className="text-right">변동금액</TableHead>
                    <TableHead className="text-right">잔액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(tx.created_at), "yyyy-MM-dd HH:mm", {
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.amount > 0 ? "default" : "secondary"}
                        >
                          {getTransactionTypeLabel(tx.transaction_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${getAmountColor(tx.amount)}`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount.toLocaleString()} P
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {tx.balance_after.toLocaleString()} P
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  이전
                </Button>
                <span className="text-sm text-gray-500">
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
            <div className="text-center py-8 text-gray-500">
              거래 내역이 없습니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
