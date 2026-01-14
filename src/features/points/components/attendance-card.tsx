"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export function AttendanceCard() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ["attendanceStatus"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/status");
      if (!res.ok) {
        if (res.status === 401) {
          return { isCheckedIn: false, error: "Unauthorized" };
        }
        throw new Error("Failed to fetch status");
      }
      return res.json();
    },
    enabled: !!isAuthenticated,
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ["userPoints"] });
      queryClient.invalidateQueries({ queryKey: ["pointTransactions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 미로그인 시 카드 숨김
  if (!isAuthenticated) {
    return null;
  }

  if (isAuthLoading) {
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
        <CardContent className="flex items-center justify-center h-[60px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (status?.error) {
    return null;
  }

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
        {isStatusLoading ? (
          <div className="flex items-center justify-center w-full">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="text-sm font-medium">
              {status?.isCheckedIn ? (
                <span className="text-green-600 font-bold">
                  오늘 출석을 이미 완료했습니다!
                </span>
              ) : (
                <span className="text-muted-foreground">
                  오늘의 보너스: 50P
                </span>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
