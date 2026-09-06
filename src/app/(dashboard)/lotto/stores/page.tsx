"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/shared/ui/page-header";
import { StoreFilterBar } from "@/features/lotto/components/store/store-filter-bar";
import { StoreListCard } from "@/features/lotto/components/store/store-list-card";
import { StoreMapView } from "@/features/lotto/components/store/store-map-view";
import { TOP_LOTTO_STORES } from "@/features/lotto/lib/lotto-top-stores.data";
import { calculateHaversineDistance } from "@/features/lotto/lib/geo-distance";
import {
  LottoStore,
  StoreFilterState,
} from "@/features/lotto/types/store.types";
import { toast } from "sonner";
import { MapPin, Trophy, ListFilter, Map as MapIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export default function LottoStoresPage() {
  const [filter, setFilter] = useState<StoreFilterState>({
    mode: "ranking",
    radiusKm: 10,
    region: "전체",
    searchKeyword: "",
  });

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedStore, setSelectedStore] = useState<LottoStore | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // 내 GPS 위치 가져오기
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
        toast.success("현재 위치가 성공적으로 확인되었습니다.");
      },
      (err) => {
        setIsLocating(false);
        let msg = "위치 정보를 가져올 수 없습니다.";
        if (err.code === err.PERMISSION_DENIED) {
          msg =
            "위치 정보 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.";
        }
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // 마운트 시 위치 권한 자동 요청 시도
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // 초기 실패는 조용히 무시 (사용자가 직접 버튼 누를 때 알림)
        },
        { timeout: 5000 },
      );
    }
  }, []);

  // 각 판매점에 내 위치 기준 거리 주입
  const storesWithDistance: LottoStore[] = useMemo(() => {
    return TOP_LOTTO_STORES.map((store) => {
      let distanceKm: number | undefined = undefined;
      if (userLocation) {
        distanceKm = calculateHaversineDistance(
          userLocation.lat,
          userLocation.lng,
          store.latitude,
          store.longitude,
        );
      }
      return {
        ...store,
        distanceKm,
      };
    });
  }, [userLocation]);

  // 필터링 및 정렬 로직
  const filteredStores = useMemo(() => {
    return storesWithDistance
      .filter((store) => {
        // 1. 검색어 필터
        if (filter.searchKeyword.trim()) {
          const kw = filter.searchKeyword.trim().toLowerCase();
          const matchName = store.name.toLowerCase().includes(kw);
          const matchAddr = store.address.toLowerCase().includes(kw);
          const matchRoad = store.roadAddress?.toLowerCase().includes(kw);
          if (!matchName && !matchAddr && !matchRoad) return false;
        }

        // 2. 지역 필터 (region 모드 또는 지역 선택 시)
        if (filter.region !== "전체" && store.region !== filter.region) {
          return false;
        }

        // 3. 반경 필터 (nearby 모드일 때)
        if (
          filter.mode === "nearby" &&
          userLocation &&
          store.distanceKm !== undefined
        ) {
          if (filter.radiusKm < 9999 && store.distanceKm > filter.radiusKm) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // 정렬: nearby 모드이면 거리순
        if (filter.mode === "nearby" && userLocation) {
          const distA = a.distanceKm ?? 99999;
          const distB = b.distanceKm ?? 99999;
          return distA - distB;
        }
        // 기본은 1등 배출 횟수 내림차순
        return b.firstPrizeCount - a.firstPrizeCount;
      });
  }, [storesWithDistance, filter, userLocation]);

  return (
    <div className="py-6 md:py-10 max-w-7xl mx-auto px-4 space-y-6">
      <PageHeader
        title="로또 판매점 & 전국 1등 명당 지도"
        description="역대 1등을 가장 많이 배출한 전설의 로또 명당과 내 주변 판매점을 인터랙티브 지도로 확인하세요."
      />

      {/* 모바일 지도 / 목록 토글 탭 */}
      <div className="flex lg:hidden bg-muted/60 p-1 rounded-xl border">
        <button
          onClick={() => setMobileView("list")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all",
            mobileView === "list"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <ListFilter className="w-3.5 h-3.5" />
          목록 보기 ({filteredStores.length}개)
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all",
            mobileView === "map"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <MapIcon className="w-3.5 h-3.5" />
          지도 보기
        </button>
      </div>

      {/* 메인 콘텐츠 그리드 (스플릿 뷰) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 좌측 컬럼: 필터 및 판매점 리스트 (5 cols) */}
        <div
          className={cn(
            "lg:col-span-5 space-y-4",
            mobileView === "map" ? "hidden lg:block" : "block",
          )}
        >
          <StoreFilterBar
            filter={filter}
            onFilterChange={setFilter}
            isLocating={isLocating}
            onLocateUser={locateUser}
            hasUserLocation={!!userLocation}
          />

          <div className="flex justify-between items-center px-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              총{" "}
              <strong className="text-primary">{filteredStores.length}</strong>
              곳의 명당
            </span>
            <span>
              {filter.mode === "nearby"
                ? "내 위치 기준 거리순"
                : "1등 배출 실적순"}
            </span>
          </div>

          {/* 판매점 카드 리스트 */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredStores.length === 0 ? (
              <div className="p-8 text-center border rounded-2xl bg-card space-y-2">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                <h4 className="font-bold text-sm text-foreground">
                  조건에 맞는 판매점이 없습니다
                </h4>
                <p className="text-xs text-muted-foreground">
                  반경을 넓히거나 다른 지역을 선택해보세요.
                </p>
              </div>
            ) : (
              filteredStores.map((store, idx) => (
                <StoreListCard
                  key={store.id}
                  store={store}
                  rank={filter.mode === "ranking" ? idx + 1 : undefined}
                  isSelected={selectedStore?.id === store.id}
                  onSelect={(s) => {
                    setSelectedStore(s);
                    // 모바일에서는 카드를 누르면 지도로 자동 전환
                    if (window.innerWidth < 1024) {
                      setMobileView("map");
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* 우측 컬럼: 스티키 인터랙티브 지도 (7 cols) */}
        <div
          className={cn(
            "lg:col-span-7 lg:sticky lg:top-6",
            mobileView === "list" ? "hidden lg:block" : "block",
          )}
        >
          <StoreMapView
            stores={filteredStores}
            selectedStore={selectedStore}
            onSelectStore={setSelectedStore}
            userLocation={userLocation}
          />
        </div>
      </div>
    </div>
  );
}
