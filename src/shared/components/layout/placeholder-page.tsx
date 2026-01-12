"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/lotto/analysis/stats">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            통계 홈으로
          </Button>
        </Link>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{description}</p>
          <div className="p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground italic">
              해당 분석 페이지는 현재 준비 중입니다. <br />곧 더 상세한 통계
              서비스로 찾아뵙겠습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
