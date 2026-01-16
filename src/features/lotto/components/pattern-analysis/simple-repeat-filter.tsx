"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SimpleRepeatFilterProps {
  consecutivePattern: "any" | "none";
  sameEndDigit: 0 | 2 | 3;
  sameSection: 0 | 2 | 3;
  onConsecutivePatternChange: (value: "any" | "none") => void;
  onSameEndDigitChange: (value: 0 | 2 | 3) => void;
  onSameSectionChange: (value: 0 | 2 | 3) => void;
  disabled?: boolean;
}

export function SimpleRepeatFilter({
  consecutivePattern,
  sameEndDigit,
  sameSection,
  onConsecutivePatternChange,
  onSameEndDigitChange,
  onSameSectionChange,
  disabled = false,
}: SimpleRepeatFilterProps) {
  return (
    <Card className={cn(disabled && "opacity-60")}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            3
          </span>
          반복/패턴 구조
          {disabled && (
            <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
          )}
          {!disabled && <Unlock className="w-4 h-4 text-primary ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 연속번호 패턴 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">연속번호 패턴</Label>
          <RadioGroup
            value={consecutivePattern}
            onValueChange={(value) =>
              onConsecutivePatternChange(value as "any" | "none")
            }
            disabled={disabled}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="any"
                id="consecutive-any"
                disabled={disabled}
              />
              <Label
                htmlFor="consecutive-any"
                className="text-sm cursor-pointer"
              >
                제한 없음
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="none"
                id="consecutive-none"
                disabled={disabled}
              />
              <Label
                htmlFor="consecutive-none"
                className="text-sm cursor-pointer"
              >
                연속번호 없음{" "}
                <span className="text-muted-foreground">
                  (1, 2와 같은 연속 조합 제외)
                </span>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            연속번호가 없으면 약 22%의 조합이 해당됩니다.
          </p>
        </div>

        {/* 동일 끝수 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">동일 끝수</Label>
          <RadioGroup
            value={sameEndDigit.toString()}
            onValueChange={(value) =>
              onSameEndDigitChange(parseInt(value, 10) as 0 | 2 | 3)
            }
            disabled={disabled}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="same-end-any" disabled={disabled} />
              <Label htmlFor="same-end-any" className="text-sm cursor-pointer">
                제한 없음
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="same-end-2" disabled={disabled} />
              <Label htmlFor="same-end-2" className="text-sm cursor-pointer">
                2개까지 허용{" "}
                <span className="text-muted-foreground">
                  (예: 3, 13은 허용)
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="same-end-3" disabled={disabled} />
              <Label htmlFor="same-end-3" className="text-sm cursor-pointer">
                3개까지 허용{" "}
                <span className="text-muted-foreground">
                  (예: 3, 13, 23은 허용)
                </span>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            같은 끝자리 숫자의 최대 허용 개수입니다. (예: 3, 13, 23 → 끝수 3)
          </p>
        </div>

        {/* 동일 구간 (5단위) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">동일 구간 (5단위)</Label>
          <RadioGroup
            value={sameSection.toString()}
            onValueChange={(value) =>
              onSameSectionChange(parseInt(value, 10) as 0 | 2 | 3)
            }
            disabled={disabled}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="0"
                id="same-section-any"
                disabled={disabled}
              />
              <Label
                htmlFor="same-section-any"
                className="text-sm cursor-pointer"
              >
                제한 없음
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="2"
                id="same-section-2"
                disabled={disabled}
              />
              <Label
                htmlFor="same-section-2"
                className="text-sm cursor-pointer"
              >
                2개까지 허용{" "}
                <span className="text-muted-foreground">
                  (같은 구간 최대 2개)
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="3"
                id="same-section-3"
                disabled={disabled}
              />
              <Label
                htmlFor="same-section-3"
                className="text-sm cursor-pointer"
              >
                3개까지 허용{" "}
                <span className="text-muted-foreground">
                  (같은 구간 최대 3개)
                </span>
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            같은 5단위 구간에서 나올 수 있는 최대 번호 개수입니다. (1-5, 6-10,
            11-15, ...)
          </p>
        </div>

        {/* 안내 메시지 */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ 반복/패턴 조건은 경우의 수 계산이 복잡하여, 필터 생성 후 검증
            방식으로 필터링됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
