"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  const handleWithdraw = async () => {
    if (!isConfirmed) return;

    try {
      setIsSubmitting(true);

      const result = await authApi.withdraw();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("회원 탈퇴가 완료되었습니다.");

      // 클라이언트 상태 초기화
      logout();
      queryClient.clear();

      // 모달 닫기
      onClose();

      // 페이지 완전 새로고침으로 이동
      window.location.href = "/";
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("회원 탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsConfirmed(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">
              경고: 이 작업은 되돌릴 수 없습니다.
            </span>
          </div>
          <DialogTitle>계정을 삭제하시겠습니까?</DialogTitle>
          <DialogDescription>
            탈퇴 시 회원님의 모든 정보가 영구적으로 삭제됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 text-muted-foreground">
            <p className="font-medium text-foreground">
              다음 데이터가 모두 삭제됩니다:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>사용자 프로필 및 개인정보</li>
              <li>저장된 로또 번호 및 분석 기록</li>
              <li>결제 내역 및 포인트 정보 (환불 불가)</li>
              <li>기타 서비스 이용 내역</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-withdraw"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
            />
            <Label
              htmlFor="confirm-withdraw"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              위 내용을 모두 확인하였으며, 계정 삭제에 동의합니다.
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleWithdraw}
            disabled={!isConfirmed || isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            회원 탈퇴
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
