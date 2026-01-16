"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Slider } from "@/shared/ui/slider";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import { Lock, Unlock, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import { PatternConstraintCalculator } from "../../services/pattern-constraint-calculator";

const ODD_EVEN_OPTIONS = ["0:6", "1:5", "2:4", "3:3", "4:2", "5:1", "6:0"];
const HIGH_LOW_OPTIONS = ["0:6", "1:5", "2:4", "3:3", "4:2", "5:1", "6:0"];

interface ConstrainedBasicFilterProps {
  fixedNumbers: number[];
  excludedNumbers: number[];
  sumRange: [number, number];
  oddEvenRatios: string[];
  highLowRatios: string[];
  acRange: [number, number];
  onSumRangeChange: (value: [number, number]) => void;
  onOddEvenRatiosChange: (value: string[]) => void;
  onHighLowRatiosChange: (value: string[]) => void;
  onACRangeChange: (value: [number, number]) => void;
  disabled?: boolean;
}

export function ConstrainedBasicFilter({
  fixedNumbers,
  excludedNumbers,
  sumRange,
  oddEvenRatios,
  highLowRatios,
  acRange,
  onSumRangeChange,
  onOddEvenRatiosChange,
  onHighLowRatiosChange,
  onACRangeChange,
  disabled = false,
}: ConstrainedBasicFilterProps) {
  const [showACExplanation, setShowACExplanation] = useState(false);

  const calculator = useMemo(() => new PatternConstraintCalculator(), []);

  // 가능한 범위/옵션 계산
  const constraints = useMemo(
    () => ({
      sumRange: calculator.calculateSumRange(fixedNumbers, excludedNumbers),
      oddEvenRatios: calculator.getAvailableOddEvenRatios(
        fixedNumbers,
        excludedNumbers,
      ),
      highLowRatios: calculator.getAvailableHighLowRatios(
        fixedNumbers,
        excludedNumbers,
      ),
      acRange: calculator.calculateACRange(fixedNumbers, excludedNumbers),
    }),
    [calculator, fixedNumbers, excludedNumbers],
  );

  const toggleOption = (
    currentValues: string[],
    value: string,
    onChange: (value: string[]) => void,
  ) => {
    if (disabled) return;
    const updated = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onChange(updated);
  };

  return (
    <Card className={cn(disabled && "opacity-60")}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            2
          </span>
          기본 수치 패턴
          {disabled && (
            <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
          )}
          {!disabled && <Unlock className="w-4 h-4 text-primary ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* 번호 총합 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">번호 총합</Label>
            <span className="text-xs text-muted-foreground">
              추천: 100 ~ 175
            </span>
          </div>
          <Slider
            min={constraints.sumRange[0]}
            max={constraints.sumRange[1]}
            step={1}
            value={[
              Math.max(sumRange[0], constraints.sumRange[0]),
              Math.min(sumRange[1], constraints.sumRange[1]),
            ]}
            onValueChange={(value) =>
              onSumRangeChange(value as [number, number])
            }
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>최소 {constraints.sumRange[0]}</span>
            <span className="font-semibold text-primary">
              현재: {sumRange[0]} ~ {sumRange[1]}
            </span>
            <span>최대 {constraints.sumRange[1]}</span>
          </div>
        </div>

        {/* 홀짝 비율 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">홀짝 비율 (홀수:짝수)</Label>
            <span className="text-xs text-muted-foreground">
              {oddEvenRatios.length}개 선택
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ODD_EVEN_OPTIONS.map((ratio) => {
              const isAvailable = constraints.oddEvenRatios.includes(ratio);
              const isSelected = oddEvenRatios.includes(ratio);
              return (
                <Button
                  key={ratio}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={disabled || !isAvailable}
                  onClick={() =>
                    toggleOption(oddEvenRatios, ratio, onOddEvenRatiosChange)
                  }
                  className={cn(
                    "min-w-[52px] relative",
                    isSelected && "bg-primary hover:bg-primary/90",
                    !isAvailable &&
                      "opacity-30 cursor-not-allowed bg-muted text-muted-foreground line-through border-dashed",
                  )}
                >
                  {ratio}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            회색 버튼: 고정수/제외수로 인해 불가능한 비율
          </p>
        </div>

        {/* 고저 비율 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              고저 비율 (고번호:저번호)
            </Label>
            <span className="text-xs text-muted-foreground">
              {highLowRatios.length}개 선택
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {HIGH_LOW_OPTIONS.map((ratio) => {
              const isAvailable = constraints.highLowRatios.includes(ratio);
              const isSelected = highLowRatios.includes(ratio);
              return (
                <Button
                  key={ratio}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={disabled || !isAvailable}
                  onClick={() =>
                    toggleOption(highLowRatios, ratio, onHighLowRatiosChange)
                  }
                  className={cn(
                    "min-w-[52px] relative",
                    isSelected && "bg-primary hover:bg-primary/90",
                    !isAvailable &&
                      "opacity-30 cursor-not-allowed bg-muted text-muted-foreground line-through border-dashed",
                  )}
                >
                  {ratio}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            1~22: 저번호, 23~45: 고번호
          </p>
        </div>

        {/* AC값 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">AC값 (분산도)</Label>
              <button
                type="button"
                onClick={() => setShowACExplanation(!showACExplanation)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">추천: 7 ~ 10</span>
          </div>
          <Slider
            min={constraints.acRange[0]}
            max={constraints.acRange[1]}
            step={1}
            value={[
              Math.max(acRange[0], constraints.acRange[0]),
              Math.min(acRange[1], constraints.acRange[1]),
            ]}
            onValueChange={(value) =>
              onACRangeChange(value as [number, number])
            }
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 (집중)</span>
            <span className="font-semibold text-primary">
              현재: {acRange[0]} ~ {acRange[1]}
            </span>
            <span>10 (분산)</span>
          </div>

          {/* AC값 설명 패널 */}
          {showACExplanation && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                AC값 (Arithmetic Complexity) 이란?
                <button
                  type="button"
                  onClick={() => setShowACExplanation(false)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AC값은 번호들 사이의 <strong>산술적 복잡성</strong>을 나타내는
                지표입니다. 쉽게 말해, 번호들이 얼마나 골고루 분포되어 있는지를
                측정합니다.
              </p>
              <div className="text-xs space-y-2">
                <p className="font-medium">계산 방법:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>
                    6개 번호에서 가능한 모든 두 수의 차이(절댓값)를 계산 (총
                    15개)
                  </li>
                  <li>중복되지 않는 차이값의 개수를 구함</li>
                  <li>AC = (고유 차이 개수) - 5</li>
                </ol>
              </div>
              <div className="text-xs space-y-2">
                <p className="font-medium">예시:</p>
                <div className="bg-background rounded p-2">
                  <p className="text-muted-foreground">
                    번호:{" "}
                    <span className="font-mono text-foreground">
                      1, 2, 3, 4, 5, 6
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    차이값: 1, 2, 3, 4, 5 → 고유 차이 5개 → AC = 5 - 5 ={" "}
                    <span className="font-mono text-foreground">0</span>
                  </p>
                </div>
                <div className="bg-background rounded p-2">
                  <p className="text-muted-foreground">
                    번호:{" "}
                    <span className="font-mono text-foreground">
                      3, 15, 22, 31, 38, 44
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    고유 차이 15개 → AC = 15 - 5 ={" "}
                    <span className="font-mono text-foreground">10</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-primary font-medium">
                💡 AC값이 7 이상이면 번호가 고르게 분포되어 있다고 볼 수
                있습니다.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
