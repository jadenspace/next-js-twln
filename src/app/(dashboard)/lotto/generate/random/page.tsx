"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/shared/ui/button";

// Three.js 관련 컴포넌트 동적 로딩 (~300KB 메인 번들에서 분리)
const LottoMachine3D = dynamic(
  () =>
    import("@/features/lotto/components/lotto-machine-3d").then(
      (m) => m.LottoMachine3D,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] md:h-[500px] bg-muted/20 rounded-lg">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    ),
  },
);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Sparkles, RotateCcw, Save, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { getLottoBallColor } from "@/features/lotto/lib/lotto-colors";
import { PageHeader } from "@/shared/ui/page-header";

export default function RandomGeneratePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetNumbers, setTargetNumbers] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false); // 초기 로딩 완료 여부

  const [isModalOpen, setIsModalOpen] = useState(false);

  const startDraw = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setDrawnNumbers([]);
    setTargetNumbers([]);
    setIsCompleted(false);
    setIsModalOpen(false);

    // 미리 뽑을 번호 6개를 결정 (타겟)
    const candidates: number[] = [];
    while (candidates.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!candidates.includes(num)) {
        candidates.push(num);
      }
    }
    setTargetNumbers(candidates);
  };

  const handleBallDrawn = (num: number) => {
    setDrawnNumbers((prev) => {
      if (prev.includes(num)) return prev;

      const next = [...prev, num];
      if (next.length === 6) {
        setIsCompleted(true);
        setIsSpinning(false);
        setIsModalOpen(true);
      }
      return next;
    });
  };

  const handleCopy = () => {
    const text = drawnNumbers.sort((a, b) => a - b).join(", ");
    navigator.clipboard.writeText(text);
    toast.success("번호가 클립보드에 복사되었습니다.", {
      description: text,
    });
  };

  const handleSave = async () => {
    if (drawnNumbers.length !== 6) {
      toast.error("추첨이 완료되지 않았습니다.");
      return;
    }

    try {
      const res = await fetch("/api/lotto/saved-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numbers: drawnNumbers.sort((a, b) => a - b),
          source: "simulation",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장에 실패했습니다.");
      }

      toast.success("마이페이지에 번호가 저장되었습니다!", {
        description: drawnNumbers.sort((a, b) => a - b).join(", "),
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(
        error.message || "저장에 실패했습니다. 로그인 상태를 확인해주세요.",
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
        <PageHeader
          title="3D 추첨 시뮬레이션"
          description="실제 로또 추첨기와 동일한 물리 시뮬레이션으로 행운의 번호를 뽑아보세요."
          className="mb-0 md:mb-0"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
            onClick={() => {
              setDrawnNumbers([]);
              setTargetNumbers([]);
              setIsCompleted(false);
              setIsModalOpen(false);
              setIsSpinning(false);
            }}
            disabled={isSpinning || drawnNumbers.length === 0}
          >
            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
            초기화
          </Button>
          <Button
            size="sm"
            className="flex-1 md:flex-none text-xs md:text-sm"
            onClick={() => setIsModalOpen(true)}
            disabled={!isCompleted}
          >
            <Save className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
            추첨 결과
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:gap-4">
        <div className="relative">
          <LottoMachine3D
            isSpinning={isSpinning}
            drawnNumbers={targetNumbers}
            onBallDrawn={handleBallDrawn}
            onReady={() => setIsReady(true)}
          />

          {/* Canvas 중앙의 시작 버튼 (오버레이) - 준비 완료 후 & 초기화 상태에서만 표시 */}
          {!isSpinning && isReady && drawnNumbers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Button
                size="default"
                className="md:scale-110 pointer-events-auto backdrop-blur-sm bg-primary/90 hover:bg-primary shadow-2xl border border-white/20 transition-transform duration-300 animate-in fade-in"
                style={{ animationDuration: "300ms" }}
                onClick={startDraw}
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400" />
                행운의 번호 뽑기
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 결과 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl md:text-2xl font-black mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
              추첨 결과
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs md:text-sm">
              오늘의 행운을 잡으셨나요? 번호를 확인하고 복사해보세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 md:py-8 flex justify-center gap-2 md:gap-3 flex-wrap">
            {drawnNumbers
              .sort((a, b) => a - b)
              .map((num, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg ring-2 ring-white/10 animate-in zoom-in duration-500",
                  )}
                  style={{
                    animationDelay: `${idx * 100}ms`,
                    backgroundColor: getLottoBallColor(num),
                  }}
                >
                  {num}
                </div>
              ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-4">
            <Button
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white text-xs md:text-sm"
              onClick={handleCopy}
            >
              <Copy className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
              번호 복사하기
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-xs md:text-sm"
              onClick={handleSave}
            >
              <Save className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
              마이페이지에 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
