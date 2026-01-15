import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-6 pb-4 sm:px-6 shrink-0">
          <DialogTitle>포인트 내역</DialogTitle>
        </DialogHeader>

        <div className="h-[480px] flex flex-col px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border rounded-lg p-4 space-y-2 bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={tx.amount > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {getTransactionTypeLabel(tx.transaction_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "MM-dd HH:mm", {
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <div className="text-sm">{tx.description}</div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span
                        className={`font-bold ${getAmountColor(tx.amount)}`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount.toLocaleString()} P
                      </span>
                      <span className="text-sm text-muted-foreground">
                        잔액: {tx.balance_after.toLocaleString()} P
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex justify-center items-center text-gray-500">
                거래 내역이 없습니다.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
            >
              이전
            </Button>
            <span className="text-sm text-gray-500">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
