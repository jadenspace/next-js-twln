"use client";

import React, { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Sparkles, ArrowRight, Clipboard } from "lucide-react";
import { toast } from "sonner";

interface QrManualInputProps {
  onSubmit: (text: string) => void;
}

export function QrManualInput({ onSubmit }: QrManualInputProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      toast.error("QR 코드 주소나 번호를 입력해주세요.");
      return;
    }
    onSubmit(inputText.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        toast.success("클립보드 내용이 붙여넣어졌습니다.");
      }
    } catch {
      toast.error("클립보드 접근 권한이 필요합니다.");
    }
  };

  // 체험용 샘플 QR 데이터
  const handleSampleClick = (type: "1등" | "3등" | "낙첨") => {
    let sample = "";
    if (type === "1등") {
      // 1100회 당첨번호: 17, 26, 29, 30, 31, 43
      sample =
        "https://m.dhlottery.co.kr/qr.do?method=winQr&v=1100m172629303143q010203040506";
    } else if (type === "3등") {
      sample =
        "https://m.dhlottery.co.kr/qr.do?method=winQr&v=1100m172629303101q051219253342";
    } else {
      sample =
        "https://m.dhlottery.co.kr/qr.do?method=winQr&v=1100m010203040506q070809101112";
    }
    setInputText(sample);
    onSubmit(sample);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Label
          htmlFor="qr-input"
          className="text-xs font-semibold text-muted-foreground"
        >
          동행복권 QR 링크 또는 코드 직접 입력
        </Label>
        <div className="relative flex items-center">
          <Input
            id="qr-input"
            placeholder="https://m.dhlottery.co.kr/qr.do?method=winQr&v=..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="pr-20 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="absolute right-1 text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <Clipboard className="w-3.5 h-3.5 mr-1" /> 붙여넣기
          </Button>
        </div>

        <Button type="submit" className="w-full gap-2 font-bold">
          당첨 확인하기 <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      {/* 샘플 체험 버튼 */}
      <div className="pt-3 border-t border-dashed">
        <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" /> 복권이 없다면 샘플로
          먼저 체험해보세요
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSampleClick("1등")}
            className="flex-1 text-xs h-8 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
          >
            🎉 1등 당첨 샘플
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSampleClick("3등")}
            className="flex-1 text-xs h-8 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
          >
            🥈 3등 당첨 샘플
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSampleClick("낙첨")}
            className="flex-1 text-xs h-8"
          >
            낙첨 샘플
          </Button>
        </div>
      </div>
    </div>
  );
}
