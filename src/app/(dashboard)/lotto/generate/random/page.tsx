"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { LottoMachine3D } from "@/features/lotto/components/lotto-machine-3d";
import { Sparkles, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

export default function RandomGeneratePage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const startDraw = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setDrawnNumbers([]);
    setIsCompleted(false);

    // 1. 초기 셔플 단계 (강하게 섞기) - 1.5초
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const numbers: number[] = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }

    // 2. 숫자를 하나씩 추출하는 단계
    // 공들이 통 안에서 사라지며 하단 UI에 나타남
    for (let i = 0; i < 6; i++) {
      // 추출 간격 단축 (더 깔끔한 느낌)
      await new Promise((resolve) => setTimeout(resolve, 600));
      setDrawnNumbers((prev) => [...prev, numbers[i]]);
    }

    // 3. 종료 단계
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSpinning(false);
    setIsCompleted(true);
    toast.success("행운의 번호가 추출되었습니다!", {
      description: "번호 저장 버튼을 눌러 보관할 수 있습니다.",
      duration: 3000,
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
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-[10px] font-bold text-primary uppercase">
                  Ball Count
                </span>
                <span className="text-xs font-bold text-primary">
                  {45 - drawnNumbers.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDrawnNumbers([]);
                setIsCompleted(false);
              }}
              disabled={isSpinning || drawnNumbers.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              초기화
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isCompleted || isSpinning}
            >
              <Save className="w-4 h-4 mr-2" />
              번호 저장
            </Button>
          </div>
        </div>

        <LottoMachine3D isSpinning={isSpinning} drawnNumbers={drawnNumbers} />

        <div className="flex justify-center">
          <Button
            size="lg"
            className="h-16 px-12 text-lg font-bold shadow-xl hover:scale-105 transition-transform"
            onClick={startDraw}
            disabled={isSpinning}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-muted/30 border-none">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">현재 추출된 번호</h3>
            <div className="flex flex-wrap gap-3">
              {drawnNumbers.length > 0 ? (
                drawnNumbers.map((num, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md animate-in zoom-in duration-300",
                      getLottoBgColor(num),
                    )}
                  >
                    {num}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  뽑기 버튼을 누르면 번호가 이곳에 나타납니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6 border-l-4 border-primary">
            <h3 className="font-semibold mb-2">오늘의 운세 팁</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              랜덤 추첨 시스템은 물리 법칙을 시뮬레이션하여 가장 공정한 숫자를
              제공합니다. 마음을 비우고 버튼을 클릭하는 순간의 직관을
              믿어보세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getLottoBgColor(num: number): string {
  if (num <= 10) return "bg-[#fbc400]";
  if (num <= 20) return "bg-[#69c8f2]";
  if (num <= 30) return "bg-[#ff7272]";
  if (num <= 40) return "bg-[#aaa]";
  return "bg-[#b0d840]";
}
