"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { CalendarCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AttendanceCard() {
  const queryClient = useQueryClient();

  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ["attendanceStatus"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/check-in", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Check-in failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`출석체크 완료! ${data.reward}P가 지급되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ["attendanceStatus"] });
      queryClient.invalidateQueries({ queryKey: ["userPoints"] }); // Invalidate points to update header
      queryClient.invalidateQueries({ queryKey: ["pointTransactions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (isStatusLoading) return null;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          <CalendarCheck2 className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-xl">일일 출석체크</CardTitle>
          <CardDescription>
            매일매일 출석하고 보너스 포인트를 받으세요!
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium">
          {status?.isCheckedIn ? (
            <span className="text-green-600 font-bold">
              오늘 출석을 이미 완료했습니다!
            </span>
          ) : (
            <span className="text-muted-foreground">오늘의 보너스: 50P</span>
          )}
        </div>
        <Button
          disabled={status?.isCheckedIn || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="min-w-[100px]"
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          )}
          {status?.isCheckedIn ? "출석 완료" : "지금 출석하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
