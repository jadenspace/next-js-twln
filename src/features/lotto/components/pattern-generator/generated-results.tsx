"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Sparkles, Copy, Save } from "lucide-react";
import { toast } from "sonner";
import { getLottoBallColor } from "../../lib/lotto-colors";
import type { GeneratedCombination } from "../../types/pattern-filter.types";

interface GeneratedResultsProps {
  results: GeneratedCombination[];
  onSave?: () => void;
}

export function GeneratedResults({ results, onSave }: GeneratedResultsProps) {
  const handleCopyAll = () => {
    const text = results
      .map((r, i) => `(${i + 1}) ${r.numbers.join(", ")}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("전체 조합이 복사되었습니다.", {
      description: `${results.length}개 조합`,
    });
  };

  const handleCopySingle = (numbers: number[], index: number) => {
    const text = numbers.join(", ");
    navigator.clipboard.writeText(text);
    toast.success(`${index + 1}번 조합이 복사되었습니다.`, {
      description: text,
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      toast.info("저장 기능 준비 중입니다.");
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            생성된 조합
            <span className="text-sm font-normal text-muted-foreground">
              ({results.length}개)
            </span>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              <Copy className="w-4 h-4 mr-2" />
              전체 복사
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              저장하기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl transition-all",
                "bg-muted/30 hover:bg-muted/50",
                "animate-in fade-in slide-in-from-bottom-2 duration-300",
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground w-8">
                  #{idx + 1}
                </span>
                <div className="flex gap-2">
                  {result.numbers.map((num) => (
                    <div
                      key={num}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                      style={{ backgroundColor: getLottoBallColor(num) }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground space-x-2">
                  <span>
                    합: <strong>{result.patterns.sum}</strong>
                  </span>
                  <span className="text-muted-foreground/50">|</span>
                  <span>
                    홀짝: <strong>{result.patterns.oddEven}</strong>
                  </span>
                  <span className="text-muted-foreground/50">|</span>
                  <span>
                    AC: <strong>{result.patterns.ac}</strong>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySingle(result.numbers, idx)}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
