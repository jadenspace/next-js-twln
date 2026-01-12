"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { LottoMachine3D } from "@/features/lotto/components/lotto-machine-3d";
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

export default function RandomGeneratePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [targetNumbers, setTargetNumbers] = useState<number[]>([]);

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

  const handleSave = () => {
    toast.info("추천 번호가 저장되었습니다. (준비 중)");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">실시간 랜덤 추첨</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                3D 시뮬레이션을 통해 행운의 번호를 직접 뽑아보세요.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDrawnNumbers([]);
                setTargetNumbers([]);
                setIsCompleted(false);
                setIsModalOpen(false);
              }}
              disabled={isSpinning || drawnNumbers.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              초기화
            </Button>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              disabled={!isCompleted}
            >
              <Save className="w-4 h-4 mr-2" />
              추첨 결과
            </Button>
          </div>
        </div>

        <LottoMachine3D
          isSpinning={isSpinning}
          drawnNumbers={targetNumbers}
          onBallDrawn={handleBallDrawn}
        />

        <div className="flex justify-center">
          <Button
            size="lg"
            className="h-16 px-12 text-lg font-bold shadow-xl transition-colors"
            onClick={startDraw}
            disabled={isSpinning || isCompleted}
          >
            {isSpinning ? (
              <>
                <RotateCcw className="w-6 h-6 mr-3 animate-spin" />
                추첨 중...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-3 text-yellow-400" />
                행운의 번호 뽑기
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 결과 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              추첨 결과
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              오늘의 행운을 잡으셨나요? 번호를 확인하고 복사해보세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 flex justify-center gap-3">
            {drawnNumbers
              .sort((a, b) => a - b)
              .map((num, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/10 animate-in zoom-in duration-500",
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

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4 mr-2" />
              번호 복사하기
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-2" />
              서버에 저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
