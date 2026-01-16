"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Loader2, RefreshCw, Trophy, Target, TrendingUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";

interface WeeklyReport {
  id: string;
  draw_no: number;
  draw_date: string;
  winning_numbers: number[];
  bonus_number: number;
  period_start: string;
  period_end: string;
  total_entries: number;
  rank_1_count: number;
  rank_2_count: number;
  rank_3_count: number;
  rank_4_count: number;
  rank_5_count: number;
  no_win_count: number;
  stats_by_source: {
    simulation: {
      total: number;
      rank_1: number;
      rank_2: number;
      rank_3: number;
      rank_4: number;
      rank_5: number;
      no_win: number;
    };
    pattern_generator: {
      total: number;
      rank_1: number;
      rank_2: number;
      rank_3: number;
      rank_4: number;
      rank_5: number;
      no_win: number;
    };
  } | null;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reports?limit=20");
      if (res.ok) {
        const data = await res.json();
        setReports(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getBallColor = (num: number) => {
    if (num <= 10) return "bg-yellow-500";
    if (num <= 20) return "bg-blue-500";
    if (num <= 30) return "bg-red-500";
    if (num <= 40) return "bg-zinc-500";
    return "bg-green-500";
  };

  const getTotalWinners = (report: WeeklyReport) => {
    return (
      report.rank_1_count +
      report.rank_2_count +
      report.rank_3_count +
      report.rank_4_count +
      report.rank_5_count
    );
  };

  const getWinRate = (report: WeeklyReport) => {
    if (report.total_entries === 0) return 0;
    return ((getTotalWinners(report) / report.total_entries) * 100).toFixed(1);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-10 px-4 md:px-0 space-y-6 pb-10">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">주간 당첨 리포트</h1>
          <p className="text-sm text-muted-foreground mt-1">
            매주 생성된 번호의 당첨 결과를 확인하세요.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReports}
          disabled={isLoading}
          className="hidden md:flex"
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
          />
          새로고침
        </Button>
      </div>

      {/* 리포트 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>아직 생성된 리포트가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="font-bold">{report.draw_no}회차</span>
                      <Badge variant="outline" className="font-normal">
                        {format(new Date(report.draw_date), "yyyy.MM.dd")}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formatDistanceToNow(new Date(report.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}{" "}
                      집계됨
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {report.total_entries.toLocaleString()}개
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{getWinRate(report)}%</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* 당첨 번호 */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {report.winning_numbers.map((num, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow",
                      )}
                      style={{
                        backgroundColor:
                          getBallColor(num).replace("bg-", "") === "zinc-500"
                            ? "#71717a"
                            : undefined,
                      }}
                      // Fallback for tailwind classes
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center",
                          getBallColor(num),
                        )}
                      >
                        {num}
                      </div>
                    </div>
                  ))}
                  <span className="text-xs text-muted-foreground mx-1">+</span>
                  <div className="w-9 h-9 rounded-full border-2 border-zinc-400 flex items-center justify-center font-bold text-sm text-zinc-600">
                    {report.bonus_number}
                  </div>
                </div>

                {/* 등위별 결과 */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  {[
                    {
                      label: "1등",
                      count: report.rank_1_count,
                      color: "text-yellow-600",
                    },
                    {
                      label: "2등",
                      count: report.rank_2_count,
                      color: "text-zinc-500",
                    },
                    {
                      label: "3등",
                      count: report.rank_3_count,
                      color: "text-amber-700",
                    },
                    {
                      label: "4등",
                      count: report.rank_4_count,
                      color: "text-zinc-600",
                    },
                    {
                      label: "5등",
                      count: report.rank_5_count,
                      color: "text-zinc-600",
                    },
                    {
                      label: "낙첨",
                      count: report.no_win_count,
                      color: "text-zinc-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className="p-2 rounded bg-muted/50">
                      <div className={cn("text-lg font-bold", item.color)}>
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
