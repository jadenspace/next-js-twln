"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/features/auth/api/auth-api";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { AlertTriangle } from "lucide-react";

export default function WithdrawPage() {
  const router = useRouter();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // 로그아웃 처리가 이미 서버에서 되었을 수 있지만 클라이언트 상태 정리
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("회원 탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <PageHeader
        title="회원 탈퇴"
        description="서비스 탈퇴 및 계정 삭제를 진행합니다."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">
              경고: 이 작업은 되돌릴 수 없습니다.
            </span>
          </div>
          <CardTitle>계정을 삭제하시겠습니까?</CardTitle>
          <CardDescription>
            탈퇴 시 회원님의 모든 정보가 영구적으로 삭제됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
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

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="confirm"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
            />
            <Label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              위 내용을 모두 확인하였으며, 계정 삭제에 동의합니다.
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleWithdraw}
            disabled={!isConfirmed || isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "회원 탈퇴"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
