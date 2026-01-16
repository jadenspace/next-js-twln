"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ReportManagement() {
  const [drawNo, setDrawNo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleGenerate = async () => {
    if (!drawNo || isNaN(parseInt(drawNo))) {
      toast.error("유효한 회차 번호를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draw_no: parseInt(drawNo) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "리포트 생성에 실패했습니다.");
      }

      setResult({
        success: true,
        message: `${drawNo}회차 리포트가 생성되었습니다.`,
        data: data.report,
      });
      toast.success(`${drawNo}회차 리포트가 생성되었습니다.`);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "리포트 생성에 실패했습니다.",
      });
      toast.error(error.message || "리포트 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            주간 리포트 생성
          </CardTitle>
          <CardDescription>
            특정 회차의 당첨 결과 리포트를 수동으로 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="drawNo">회차 번호</Label>
              <Input
                id="drawNo"
                type="number"
                placeholder="예: 1160"
                value={drawNo}
                onChange={(e) => setDrawNo(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !drawNo}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "리포트 생성"
                )}
              </Button>
            </div>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                result.success
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{result.message}</p>
                {result.data && (
                  <p className="text-sm mt-1 opacity-80">
                    총 {result.data.total_entries}개 번호 분석 완료
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>사용 방법</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. 분석하려는 로또 회차 번호를 입력합니다.</p>
          <p>2. &quot;리포트 생성&quot; 버튼을 클릭합니다.</p>
          <p>
            3. 해당 회차의 당첨번호와 이전 회차 DB 업데이트 시점부터 현재 회차
            DB 업데이트 시점까지 저장된 모든 번호를 비교하여 당첨 결과를
            집계합니다.
          </p>
          <p>
            4. 생성된 리포트는{" "}
            <a href="/reports" className="text-primary hover:underline">
              /reports
            </a>{" "}
            페이지에서 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
