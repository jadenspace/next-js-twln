import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useState } from "react";
import { PointPackage } from "@/features/points/types";
import { paymentsApi } from "../api/payments-api";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME?.trim() || "은행명 미설정";
const BANK_ACCOUNT_NUMBER =
  process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER?.trim() || "계좌번호 미설정";
const BANK_ACCOUNT_HOLDER =
  process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER?.trim() || "로또탐정 서비스";

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PointPackage | null;
  onSuccess: () => void;
}

export function PaymentRequestModal({
  isOpen,
  onClose,
  selectedPackage,
  onSuccess,
}: PaymentRequestModalProps) {
  const [depositorName, setDepositorName] = useState("");

  const mutation = useMutation({
    mutationFn: (params: { packageId: string; depositorName: string }) =>
      paymentsApi.requestBankTransfer(params),
    onSuccess: () => {
      onSuccess();
      onClose();
      setDepositorName("");
    },
    onError: (error) => {
      alert(error.message); // Simple alert for MVP
    },
  });

  const handleSubmit = () => {
    if (!selectedPackage || !depositorName.trim()) return;
    mutation.mutate({
      packageId: selectedPackage.id,
      depositorName: depositorName,
    });
  };

  if (!selectedPackage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>무통장 입금 신청</DialogTitle>
          <DialogDescription>
            입금자명을 입력하고 입금 신청을 완료해주세요.
            <br />
            아래 계좌로 입금해주시면 확인 후 포인트를 지급해드립니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="p-4 bg-muted rounded-md space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">입금 은행</span>
              <span className="font-medium">{BANK_NAME}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">계좌번호</span>
              <div>
                <span className="font-medium">{BANK_ACCOUNT_NUMBER}</span>
                {/* Copy button logic could go here */}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">예금주</span>
              <span className="font-medium">{BANK_ACCOUNT_HOLDER}</span>
            </div>
            <div className="border-t my-2 pt-2 flex justify-between font-bold">
              <span>입금 금액</span>
              <span className="text-primary">
                {selectedPackage.price.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="depositor" className="text-right">
              입금자명
            </Label>
            <Input
              id="depositor"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              className="col-span-3"
              placeholder="입금하시는 분 성함"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!depositorName.trim() || mutation.isPending}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            입금 신청하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
