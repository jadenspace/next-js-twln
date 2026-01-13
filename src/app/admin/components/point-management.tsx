"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { approvalApi } from "@/features/auth/api/approval-api";

export function PointManagement() {
  const [targetEmail, setTargetEmail] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  // Need list of users to find ID by email or just use email if API supports it
  // For now, let's assume we need to find the user first or the API handles email (but existing grant API uses targetUserId)
  // Let's check if we can get user by email
  const { data: approvedUsers } = useQuery({
    queryKey: ["admin", "approved-users"],
    queryFn: approvalApi.getApprovedUsers,
  });

  const grantMutation = useMutation({
    mutationFn: async (payload: {
      targetEmail: string;
      amount: number;
      description: string;
    }) => {
      const res = await fetch("/api/points/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorBody = await res
          .json()
          .catch(() => ({ error: "포인트 처리 실패" }));
        throw new Error(errorBody.error || "알 수 없는 오류가 발생했습니다.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("포인트 처리가 완료되었습니다.");
      setAmount(0);
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["userPoints"] }); // 헤더의 포인트 잔액 쿼리 키와 일치
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleGrant = () => {
    if (!targetEmail) {
      toast.error("대상을 선택해주세요.");
      return;
    }
    if (amount === 0) return;

    grantMutation.mutate({
      targetEmail,
      amount,
      description: description || "Admin manual adjustment",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            포인트 수동 지급/차감
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>대상 사용자 선택</Label>
            <select
              className="w-full p-2 border rounded-md bg-background"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
            >
              <option value="">사용자 선택...</option>
              {approvedUsers?.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>금액 (음수 입력 시 차감)</Label>
            <Input
              type="number"
              placeholder="예: 1000 또는 -500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>사유</Label>
            <Input
              placeholder="지급/차감 사유 입력"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleGrant}
            disabled={!targetEmail || amount === 0 || grantMutation.isPending}
          >
            {grantMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            적용하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
