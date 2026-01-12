"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Hammer } from "lucide-react";

export default function PatternGeneratePage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Hammer className="w-12 h-12 text-primary animate-bounce" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">패턴 조합기 준비 중</CardTitle>
            <CardDescription className="text-lg mt-2">
              사용자가 지정한 패턴(홀짝 비율, 합계 범위 등)을 기반으로 <br />
              최적의 번호 조합을 생성하는 기능을 준비하고 있습니다.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
