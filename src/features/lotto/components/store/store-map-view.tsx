"use client";

import React, { useEffect, useRef, useState } from "react";
import { LottoStore } from "../../types/store.types";
import { Loader2, Navigation, MapPin } from "lucide-react";

interface StoreMapViewProps {
  stores: LottoStore[];
  selectedStore: LottoStore | null;
  onSelectStore: (store: LottoStore) => void;
  userLocation: { lat: number; lng: number } | null;
}

export function StoreMapView({
  stores,
  selectedStore,
  onSelectStore,
  userLocation,
}: StoreMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // 1. Leaflet CSS 및 JS 동적 로드
  useEffect(() => {
    if (typeof window === "undefined") return;

    // CSS 링크 추가 (중복 방지)
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // JS 스크립트 추가 (중복 방지)
    if ((window as any).L) {
      setIsLeafletReady(true);
      return;
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setIsLeafletReady(true);
      };
      document.body.appendChild(script);
    } else {
      const existingScript = document.getElementById("leaflet-js");
      existingScript?.addEventListener("load", () => setIsLeafletReady(true));
    }
  }, []);

  // 2. 지도 인스턴스 초기화
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // 이미 생성됨

    const L = (window as any).L;
    if (!L) return;

    // 기본 위치: 서울시청 또는 첫 번째 판매점
    const defaultCenter = userLocation
      ? [userLocation.lat, userLocation.lng]
      : stores.length > 0
        ? [stores[0].latitude, stores[0].longitude]
        : [37.5665, 126.978];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: userLocation ? 13 : 11,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // OpenStreetMap 타일 레이어 추가
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLeafletReady]);

  // 3. 내 위치 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletReady) return;
    const L = (window as any).L;
    if (!L) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      // 펄스 애니메이션이 적용된 내 위치 마커
      const userIcon = L.divIcon({
        className: "custom-user-pin",
        html: `
          <div style="position:relative; width:20px; height:20px;">
            <div style="position:absolute; inset:0; background:#3b82f6; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
            <div style="position:absolute; inset:-6px; background:#3b82f6; border-radius:50%; opacity:0.4; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(
        "<div style='font-size:12px; font-weight:bold;'>📍 현재 내 위치</div>",
      );
      userMarkerRef.current = marker;
    }
  }, [userLocation, isLeafletReady]);

  // 4. 판매점 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !isLeafletReady)
      return;
    const L = (window as any).L;
    if (!L) return;

    markersLayerRef.current.clearLayers();

    stores.forEach((store) => {
      const isTopStore = store.firstPrizeCount >= 20;

      // 커스텀 HTML 마커 (금색 트로피 또는 주황색 핀)
      const iconHtml = isTopStore
        ? `
          <div style="background:#f59e0b; color:white; padding:4px 8px; border-radius:12px; font-weight:900; font-size:11px; display:flex; align-items:center; gap:3px; box-shadow:0 3px 8px rgba(0,0,0,0.35); border:2px solid white; white-space:nowrap; cursor:pointer;">
            <span>👑 ${store.firstPrizeCount}회</span>
          </div>
        `
        : `
          <div style="background:#ef4444; color:white; padding:3px 6px; border-radius:10px; font-weight:bold; font-size:10px; box-shadow:0 2px 6px rgba(0,0,0,0.25); border:1.5px solid white; white-space:nowrap; cursor:pointer;">
            <span>1등 ${store.firstPrizeCount}회</span>
          </div>
        `;

      const customIcon = L.divIcon({
        className: "custom-store-pin",
        html: iconHtml,
        iconSize: isTopStore ? [64, 26] : [54, 22],
        iconAnchor: isTopStore ? [32, 13] : [27, 11],
      });

      const marker = L.marker([store.latitude, store.longitude], {
        icon: customIcon,
      });

      // 팝업 내용
      const popupHtml = `
        <div style="min-width:180px; font-family:sans-serif; padding:4px;">
          <h4 style="margin:0; font-size:14px; font-weight:bold; color:#111;">${store.name}</h4>
          <p style="margin:4px 0 8px; font-size:11px; color:#666;">${store.roadAddress || store.address}</p>
          <div style="display:flex; gap:6px; margin-bottom:8px;">
            <span style="background:#fef3c7; color:#92400e; font-size:11px; font-weight:bold; padding:2px 6px; border-radius:4px;">
              👑 1등 ${store.firstPrizeCount}회
            </span>
            ${store.secondPrizeCount ? `<span style="background:#f3f4f6; color:#4b5563; font-size:11px; padding:2px 6px; border-radius:4px;">2등 ${store.secondPrizeCount}회</span>` : ""}
          </div>
          <a href="https://map.kakao.com/link/to/${encodeURIComponent(store.name)},${store.latitude},${store.longitude}" target="_blank" rel="noopener noreferrer" style="display:block; text-align:center; background:#facc15; color:#78350f; font-size:11px; font-weight:bold; padding:6px; border-radius:6px; text-decoration:none;">
            카카오맵으로 길찾기 ➜
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        onSelectStore(store);
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [stores, isLeafletReady, onSelectStore]);

  // 5. 선택된 판매점으로 지도 이동
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStore) return;
    mapInstanceRef.current.flyTo(
      [selectedStore.latitude, selectedStore.longitude],
      15,
      { duration: 1.2 },
    );
  }, [selectedStore]);

  return (
    <div className="relative w-full h-full min-h-[420px] md:min-h-[580px] bg-muted/40 rounded-2xl overflow-hidden border shadow-sm">
      {!isLeafletReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-background/80 z-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground">
            전국 로또 명당 지도를 불러오는 중입니다...
          </p>
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* 지도 좌측 하단 정보 범례 */}
      <div className="absolute bottom-3 left-3 z-20 bg-background/90 backdrop-blur-md px-3 py-2 rounded-xl border shadow-md text-[11px] flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span className="font-semibold text-foreground">1등 20회+ 명당</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span className="font-semibold text-foreground">일반 명당</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="font-semibold text-foreground">내 위치</span>
          </div>
        )}
      </div>
    </div>
  );
}
