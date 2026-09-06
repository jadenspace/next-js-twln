"use client";

import React from "react";
import { StoreFilterMode, StoreFilterState } from "../../types/store.types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Trophy,
  Navigation,
  MapPin,
  Search,
  Crosshair,
  Loader2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const REGIONS = [
  "전체",
  "서울",
  "경기",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const RADIUS_OPTIONS = [
  { label: "1km", val: 1 },
  { label: "3km", val: 3 },
  { label: "5km", val: 5 },
  { label: "10km", val: 10 },
  { label: "전국", val: 9999 },
];

interface StoreFilterBarProps {
  filter: StoreFilterState;
  onFilterChange: (newFilter: StoreFilterState) => void;
  isLocating: boolean;
  onLocateUser: () => void;
  hasUserLocation: boolean;
}

export function StoreFilterBar({
  filter,
  onFilterChange,
  isLocating,
  onLocateUser,
  hasUserLocation,
}: StoreFilterBarProps) {
  const setMode = (mode: StoreFilterMode) => {
    onFilterChange({ ...filter, mode });
  };

  const setRegion = (region: string) => {
    onFilterChange({ ...filter, region });
  };

  const setRadius = (radiusKm: number) => {
    onFilterChange({ ...filter, radiusKm });
  };

  const setSearchKeyword = (searchKeyword: string) => {
    onFilterChange({ ...filter, searchKeyword });
  };

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
      {/* 1. 모드 탭 셀렉터 */}
      <div className="flex p-1 bg-muted/60 rounded-xl border">
        <button
          onClick={() => setMode("ranking")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all",
            filter.mode === "ranking"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          전국 1등 순위
        </button>

        <button
          onClick={() => {
            setMode("nearby");
            if (!hasUserLocation) {
              onLocateUser();
            }
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all",
            filter.mode === "nearby"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Navigation className="w-3.5 h-3.5 text-primary" />내 주변 판매점
        </button>

        <button
          onClick={() => setMode("region")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all",
            filter.mode === "region"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
          지역별 검색
        </button>
      </div>

      {/* 2. 검색창 & 내 위치 버튼 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="판매점 이름, 도로명, 동 이름 검색..."
            value={filter.searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onLocateUser}
          disabled={isLocating}
          className="h-10 px-3 gap-1 text-xs shrink-0"
          title="현재 내 위치로 이동"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Crosshair className="w-4 h-4 text-primary" />
          )}
          <span className="hidden sm:inline">내 위치 찾기</span>
        </Button>
      </div>

      {/* 3. 모드별 서브 필터 (반경 or 시도) */}
      {filter.mode === "nearby" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground text-[11px] font-semibold shrink-0 mr-1">
            반경:
          </span>
          {RADIUS_OPTIONS.map((opt) => (
            <Button
              key={opt.val}
              size="sm"
              variant={filter.radiusKm === opt.val ? "default" : "secondary"}
              onClick={() => setRadius(opt.val)}
              className="h-7 text-xs px-2.5 rounded-full"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      {filter.mode === "region" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground text-[11px] font-semibold shrink-0 mr-1">
            시·도:
          </span>
          {REGIONS.map((reg) => (
            <Button
              key={reg}
              size="sm"
              variant={filter.region === reg ? "default" : "outline"}
              onClick={() => setRegion(reg)}
              className="h-7 text-xs px-2.5 rounded-full shrink-0"
            >
              {reg}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
