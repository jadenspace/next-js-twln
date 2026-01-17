"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Loader2, PenSquare, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/page-header";

export default function CommunityPage() {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["communityPosts"],
    queryFn: async () => {
      const res = await fetch("/api/community/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; content: string }) => {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("문의 등록 실패");
      return res.json();
    },
    onSuccess: () => {
      toast.success("문의가 등록되었습니다.");
      setIsCreateOpen(false);
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate({ title, content });
  };

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
        <PageHeader
          title="문의/답변"
          description="서비스 이용 중 궁금한 내용을 문의해 주세요."
          className="mb-0 md:mb-0"
        />

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PenSquare className="w-4 h-4 mr-2" />
              문의하기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>새 문의 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">문의 제목</label>
                <Input
                  placeholder="문의 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">문의 내용</label>
                <Textarea
                  placeholder="문의 내용을 입력하세요"
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                문의 등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell w-[80px] text-center">
                    번호
                  </TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="hidden md:table-cell w-[150px]">
                    문의자
                  </TableHead>
                  <TableHead className="w-[120px] text-center">
                    문의일
                  </TableHead>
                  <TableHead className="w-[80px] text-center">조회수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts?.data?.map((post: any, index: number) => (
                  <TableRow
                    key={post.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/community/${post.id}`)}
                  >
                    <TableCell className="hidden md:table-cell text-center text-muted-foreground">
                      {posts.count - index}
                    </TableCell>
                    <TableCell className="font-medium">
                      {post.is_notice && (
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 uppercase">
                          Notice
                        </span>
                      )}
                      {post.title}
                      <span className="ml-2 text-xs text-muted-foreground flex inline-flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> 0
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {post.user?.email?.split("@")[0]}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {format(new Date(post.created_at), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {post.view_count}
                    </TableCell>
                  </TableRow>
                ))}
                {posts?.data?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-20 text-muted-foreground"
                    >
                      첫 문의를 등록해보세요!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
