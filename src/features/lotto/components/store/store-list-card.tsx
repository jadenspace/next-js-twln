"use client";

import React from "react";
import { LottoStore } from "../../types/store.types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { formatDistance } from "../../lib/geo-distance";
import {
  Trophy,
  MapPin,
  Phone,
  Navigation,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

interface StoreListCardProps {
  store: LottoStore;
  rank?: number;
  isSelected?: boolean;
  onSelect?: (store: LottoStore) => void;
}

export function StoreListCard({
  store,
  rank,
  isSelected,
  onSelect,
}: StoreListCardProps) {
  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(store.roadAddress || store.address);
    toast.success("주소가 클립보드에 복사되었습니다.");
  };

  // 카카오맵 길찾기 URL (웹 및 모바일 앱 호환)
  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.latitude},${store.longitude}`;
  // 네이버 지도 길찾기 URL
  const naverMapUrl = `https://map.naver.com/v5/directions/-/-/${store.longitude},${store.latitude},${encodeURIComponent(store.name)}/-/car`;

  return (
    <div
      onClick={() => onSelect?.(store)}
      className={cn(
        "p-4 rounded-xl border transition-all cursor-pointer bg-card hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
          : "hover:border-border/80",
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* 순위 배지 */}
          {rank !== undefined && (
            <div
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
                rank === 1
                  ? "bg-amber-500 text-white shadow-xs"
                  : rank === 2
                    ? "bg-slate-400 text-white"
                    : rank === 3
                      ? "bg-amber-700 text-white"
                      : "bg-secondary text-secondary-foreground",
              )}
            >
              {rank}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-sm text-foreground truncate">
                {store.name}
              </h4>
              {store.badge && (
                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                  {store.badge}
                </span>
              )}
            </div>

            {/* 주소 */}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0 text-muted-foreground/70" />
              {store.roadAddress || store.address}
            </p>
          </div>
        </div>

        {/* 내 위치로부터 거리 */}
        {store.distanceKm !== undefined && (
          <div className="text-right shrink-0">
            <span className="text-xs font-black text-primary block">
              {formatDistance(store.distanceKm)}
            </span>
          </div>
        )}
      </div>

      {/* 1등 / 2등 배출 실적 뱃지 */}
      <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
        <Badge
          variant="secondary"
          className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold gap-1 text-[11px]"
        >
          <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" />
          1등 {store.firstPrizeCount}회
        </Badge>
        {store.secondPrizeCount > 0 && (
          <Badge
            variant="outline"
            className="text-[11px] font-semibold text-muted-foreground"
          >
            2등 {store.secondPrizeCount}회
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground ml-auto">
          {store.region}
        </span>
      </div>

      {/* 하단 액션 버튼 (길찾기, 복사, 전화) */}
      <div className="mt-3 pt-3 border-t border-dashed flex items-center gap-2 text-xs">
        <a
          href={kakaoMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1"
        >
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7 gap-1 font-medium bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200"
          >
            <Navigation className="w-3 h-3" /> 카카오 길찾기
          </Button>
        </a>

        <a
          href={naverMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1"
        >
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-7 gap-1 font-medium bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200"
          >
            <ExternalLink className="w-3 h-3" /> 네이버 길찾기
          </Button>
        </a>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopyAddress}
          className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
          title="주소 복사"
        >
          <Copy className="w-3 h-3" />
        </Button>

        {store.telephone && (
          <a
            href={`tel:${store.telephone}`}
            onClick={(e) => e.stopPropagation()}
            title="전화 연결"
          >
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <Phone className="w-3 h-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
