"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { Loader2, ArrowLeft, MessageSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts/${params.id}`);
      if (!res.ok) throw new Error("게시글을 불러오지 못했습니다.");
      const data = await res.json();
      return data.data;
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/community/posts/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("댓글 작성 실패");
      return res.json();
    },
    onSuccess: () => {
      toast.success("댓글이 등록되었습니다.");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["post", params.id] });
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!post)
    return <div className="text-center p-20">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="container max-w-4xl py-10">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        목록으로
      </Button>

      <Card className="mb-8">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {post.user?.email}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{" "}
              {format(new Date(post.created_at), "yyyy-MM-dd HH:mm")}
            </span>
          </div>
          <CardTitle className="text-2xl">
            {post.is_notice && (
              <span className="text-primary mr-2">[공지]</span>
            )}
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 whitespace-pre-wrap">
          {post.content}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          댓글 {post.comments?.length || 0}
        </h3>

        <div className="space-y-4">
          {post.comments?.map((c: any) => (
            <div key={c.id} className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-primary">
                  {c.user?.email?.split("@")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(c.created_at), "MM-dd HH:mm")}
                </span>
              </div>
              <p className="text-sm">{c.content}</p>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Textarea
            placeholder="댓글을 입력하세요..."
            className="mb-2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              disabled={!comment.trim() || commentMutation.isPending}
              onClick={() => commentMutation.mutate(comment)}
            >
              {commentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              댓글 등록
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
