"use client";

import React from "react";
import { FunFactItem } from "../../types/tax.types";
import {
  Coffee,
  Utensils,
  Smartphone,
  Briefcase,
  Car,
  Home,
  Sparkles,
} from "lucide-react";

interface TaxFunFactsProps {
  items: FunFactItem[];
  netPrize: number;
}

export function TaxFunFacts({ items, netPrize }: TaxFunFactsProps) {
  if (items.length === 0 || netPrize <= 0) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "coffee":
        return <Coffee className="w-5 h-5 text-amber-600" />;
      case "utensils":
        return <Utensils className="w-5 h-5 text-orange-600" />;
      case "smartphone":
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case "briefcase":
        return <Briefcase className="w-5 h-5 text-emerald-600" />;
      case "car":
        return <Car className="w-5 h-5 text-indigo-600" />;
      case "home":
        return <Home className="w-5 h-5 text-purple-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-base text-foreground">
          이 실수령액이면 무엇을 할 수 있을까?
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        내 손에 들어오는 돈의 가치를 일상 속 재미있는 지표로 환산해 보았습니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-muted/30 border hover:border-primary/40 transition-colors flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-lg bg-background border shadow-xs shrink-0">
              {getIcon(item.iconName)}
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[11px] text-muted-foreground block truncate">
                {item.description}
              </span>
              <h4 className="font-black text-foreground text-sm truncate">
                {item.name}
              </h4>
              <p className="text-sm font-bold text-primary">
                {item.quantity.toLocaleString()}{" "}
                {item.id === "salary"
                  ? "년치"
                  : item.id === "apartment"
                    ? "채"
                    : "개/대"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
