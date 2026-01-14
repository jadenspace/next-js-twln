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
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { adminApi } from "@/features/auth/api/admin-api";

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const { user } = useAuth();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ["admin", "is-admin", user?.email],
    queryFn: () => (user?.email ? adminApi.isUserAdmin(user.email) : false),
    enabled: !!user?.email,
  });
  const { data: adminUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.getAdminUsers,
  });
  const adminEmails = new Set(adminUsers?.map((admin) => admin.email) ?? []);

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts/${id}`);
      if (!res.ok) throw new Error("문의글을 불러오지 못했습니다.");
      const data = await res.json();
      return data.data;
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/community/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("답변 등록 실패");
      return res.json();
    },
    onSuccess: () => {
      toast.success("답변이 등록되었습니다.");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["post", id] });
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!post)
    return <div className="text-center p-20">문의글을 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-4xl mx-auto py-10">
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
          <CardTitle className="text-base">
            {post.is_notice && (
              <span className="text-primary mr-2">[공지]</span>
            )}
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-sm whitespace-pre-wrap">
          {post.content}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          답변 {post.comments?.length || 0}
        </h3>

        <div className="space-y-4">
          {post.comments?.map((c: any) => (
            <div key={c.id} className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">
                    {c.user?.email?.split("@")[0]}
                  </span>
                  {adminEmails.has(c.user?.email) && (
                    <span className="text-[10px] font-semibold rounded-full border px-2 py-0.5 text-primary">
                      관리자
                    </span>
                  )}
                </div>
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
            placeholder={
              isAdmin
                ? "답변을 입력하세요..."
                : "관리자만 답변을 등록할 수 있습니다."
            }
            className="mb-2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!isAdmin}
          />
          {!isAdmin && !isAdminLoading && (
            <p className="text-xs text-muted-foreground mb-2">
              답변은 관리자만 등록할 수 있습니다.
            </p>
          )}
          <div className="flex justify-end">
            <Button
              disabled={
                !comment.trim() || commentMutation.isPending || !isAdmin
              }
              onClick={() => commentMutation.mutate(comment)}
            >
              {commentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              답변 등록
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
