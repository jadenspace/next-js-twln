"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import {
  Calculator,
  Repeat,
  Sigma,
  Check,
  Pin,
  TrendingUp,
} from "lucide-react";
import type { PatternCategory } from "../../types/pattern-filter.types";

interface Category {
  id: PatternCategory;
  title: string;
  description: string;
  icon: React.ElementType;
  isPremium?: boolean;
}

const CATEGORIES: Category[] = [
  {
    id: "basic",
    title: "기본 수치 패턴",
    description: "총합, 홀짝, 고저, AC값",
    icon: Calculator,
  },
  {
    id: "repeat",
    title: "반복/패턴 구조",
    description: "연속번호, 동일끝수, 동일구간",
    icon: Repeat,
  },
  {
    id: "math",
    title: "수학적 성질",
    description: "소수, 합성수, 배수, 제곱수",
    icon: Sigma,
  },
  {
    id: "fixed",
    title: "고정수",
    description: "1~45 번호 고정 선택",
    icon: Pin,
  },
  {
    id: "stats",
    title: "통계 기반 패턴",
    description: "핫/콜드 번호, 미출현 번호",
    icon: TrendingUp,
  },
];

interface PatternCategorySelectorProps {
  selectedCategories: PatternCategory[];
  onCategoriesChange: (categories: PatternCategory[]) => void;
}

export function PatternCategorySelector({
  selectedCategories,
  onCategoriesChange,
}: PatternCategorySelectorProps) {
  const handleToggle = (categoryId: PatternCategory) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-base md:text-lg font-bold">
          STEP 1. 패턴 카테고리 선택
        </CardTitle>
        <p className="text-xs md:text-sm text-muted-foreground">
          적용할 패턴 유형을 선택하세요. 여러 개 선택 가능합니다.
        </p>
      </CardHeader>
      <CardContent className="pt-0 md:pt-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            const Icon = category.icon;

            return (
              <button
                key={category.id}
                onClick={() => handleToggle(category.id)}
                className={cn(
                  "relative flex flex-col items-start gap-1 md:gap-2 p-2.5 md:p-4 rounded-lg md:rounded-xl border-2 transition-all text-left",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-background",
                )}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "p-1.5 md:p-2 rounded-md md:rounded-lg",
                    isSelected ? "bg-primary/20" : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 md:w-5 md:h-5",
                      isSelected ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "text-xs md:text-sm font-semibold flex items-center gap-1.5",
                      isSelected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {category.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {category.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
