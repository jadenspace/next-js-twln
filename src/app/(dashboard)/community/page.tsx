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
      if (!res.ok) throw new Error("게시글 작성 실패");
      return res.json();
    },
    onSuccess: () => {
      toast.success("게시글이 등록되었습니다.");
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
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">자유 게시판</h1>
          <p className="text-muted-foreground mt-1">
            로또 당첨 후기 및 분석 노하우를 공유해보세요.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PenSquare className="w-4 h-4 mr-2" />
              글쓰기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>새 게시글 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">제목</label>
                <Input
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">내용</label>
                <Textarea
                  placeholder="내용을 입력하세요"
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
                등록하기
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
                    작성자
                  </TableHead>
                  <TableHead className="w-[120px] text-center">
                    작성일
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
                      첫 게시글을 작성해보세요!
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
