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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  Trash2,
  Copy,
  Loader2,
  Sparkles,
  Dices,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { getLottoBallColor } from "@/features/lotto/lib/lotto-colors";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface SavedNumber {
  id: string;
  user_id: string;
  numbers: number[];
  source: "simulation" | "pattern_generator";
  filters: Record<string, any> | null;
  created_at: string;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function MyPage() {
  const [savedNumbers, setSavedNumbers] = useState<SavedNumber[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSavedNumbers = useCallback(
    async (offset = 0) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        params.set("offset", offset.toString());
        if (sourceFilter !== "all") {
          params.set("source", sourceFilter);
        }

        const res = await fetch(`/api/lotto/saved-numbers?${params}`);
        if (!res.ok) {
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        setSavedNumbers(data.data || []);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Failed to fetch saved numbers:", error);
        toast.error("저장된 번호를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [sourceFilter],
  );

  useEffect(() => {
    fetchSavedNumbers(0);
  }, [fetchSavedNumbers]);

  const handleCopy = (numbers: number[]) => {
    const text = numbers.join(", ");
    navigator.clipboard.writeText(text);
    toast.success("번호가 클립보드에 복사되었습니다.", { description: text });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/lotto/saved-numbers/${deleteTarget}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      setSavedNumbers((prev) => prev.filter((n) => n.id !== deleteTarget));
      toast.success("번호가 삭제되었습니다.");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "simulation":
        return "3D 추첨";
      case "pattern_generator":
        return "패턴 생성기";
      default:
        return source;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "simulation":
        return <Dices className="w-3.5 h-3.5" />;
      case "pattern_generator":
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-10 px-4 md:px-0 space-y-6 pb-10">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">마이페이지</h1>
          <p className="text-sm text-muted-foreground mt-1">
            저장된 로또 번호를 관리하세요.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSavedNumbers(0)}
          disabled={isLoading}
          className="hidden md:flex"
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
          />
          새로고침
        </Button>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">저장된 번호</CardTitle>
          <CardDescription>
            {pagination &&
              `총 ${pagination.total}개의 번호가 저장되어 있습니다.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">소스:</span>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="simulation">3D 추첨</SelectItem>
                <SelectItem value="pattern_generator">패턴 생성기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 번호 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedNumbers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>저장된 번호가 없습니다.</p>
              <p className="text-sm mt-1">
                3D 추첨 시뮬레이션이나 패턴 생성기에서 번호를 저장해 보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedNumbers.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                    {/* 번호 */}
                    <div className="flex items-center gap-1.5">
                      {item.numbers.map((num, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm",
                          )}
                          style={{
                            backgroundColor: getLottoBallColor(num),
                          }}
                        >
                          {num}
                        </div>
                      ))}
                    </div>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded">
                        {getSourceIcon(item.source)}
                        {getSourceLabel(item.source)}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.numbers)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {pagination && pagination.hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  fetchSavedNumbers(pagination.offset + pagination.limit)
                }
                disabled={isLoading}
              >
                더 보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>번호 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 번호 조합을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
