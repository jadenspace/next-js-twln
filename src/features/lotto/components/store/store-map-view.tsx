"use client";

import React, { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { LottoStore } from "../../types/store.types";
import { Loader2 } from "lucide-react";

interface StoreMapViewProps {
  stores: LottoStore[];
  selectedStore: LottoStore | null;
  onSelectStore: (store: LottoStore) => void;
  userLocation: { lat: number; lng: number } | null;
}

/** 서울시청 (판매점도 내 위치도 없을 때의 기본 중심) */
const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];

export function StoreMapView({
  stores,
  selectedStore,
  onSelectStore,
  userLocation,
}: StoreMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletNS.Map | null>(null);
  const markersLayerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const userMarkerRef = useRef<LeafletNS.Marker | null>(null);
  const didAutoCenterRef = useRef(false);
  // 콜백은 ref 로 들고 있어야 마커를 매번 다시 그리지 않는다.
  const onSelectStoreRef = useRef(onSelectStore);
  onSelectStoreRef.current = onSelectStore;

  // Leaflet 은 window 를 참조하므로 클라이언트에서 동적으로만 불러온다.
  const [L, setL] = useState<typeof LeafletNS | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet")
      .then((mod) => {
        if (!cancelled)
          setL(mod.default ?? (mod as unknown as typeof LeafletNS));
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 지도 인스턴스 초기화 (한 번만)
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // 모바일 탭 전환·레이아웃 변경으로 컨테이너 크기가 바뀌면 타일이 깨지므로
    // 크기 변화를 감지해 다시 계산한다.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, [L]);

  // 내 위치 마커
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (!userLocation) return;

    const userIcon = L.divIcon({
      className: "custom-user-pin",
      html: `
        <div style="position:relative; width:20px; height:20px;">
          <div style="position:absolute; inset:-6px; background:#3b82f6; border-radius:50%; opacity:0.35;"></div>
          <div style="position:absolute; inset:0; background:#3b82f6; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    })
      .bindPopup(
        "<div style='font-size:12px; font-weight:bold;'>📍 현재 내 위치</div>",
      )
      .addTo(map);
  }, [L, userLocation]);

  // 판매점 마커
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!L || !layer) return;

    layer.clearLayers();

    stores.forEach((store) => {
      const isTopStore = store.firstPrizeCount >= 20;

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

      const marker = L.marker([store.latitude, store.longitude], {
        icon: L.divIcon({
          className: "custom-store-pin",
          html: iconHtml,
          iconSize: isTopStore ? [64, 26] : [54, 22],
          iconAnchor: isTopStore ? [32, 13] : [27, 11],
        }),
      });

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
      marker.on("click", () => onSelectStoreRef.current(store));
      layer.addLayer(marker);
    });
  }, [L, stores]);

  // 최초 1회 자동 중심 이동: 내 위치가 있으면 내 위치, 없으면 판매점 전체가 보이게
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!L || !map || didAutoCenterRef.current) return;

    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
      didAutoCenterRef.current = true;
      return;
    }
    if (stores.length > 0) {
      map.fitBounds(
        L.latLngBounds(stores.map((s) => [s.latitude, s.longitude])),
        { padding: [40, 40], maxZoom: 13 },
      );
      didAutoCenterRef.current = true;
    }
  }, [L, userLocation, stores]);

  // 선택된 판매점으로 이동
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStore) return;
    didAutoCenterRef.current = true;
    map.flyTo([selectedStore.latitude, selectedStore.longitude], 15, {
      duration: 1.2,
    });
  }, [selectedStore]);

  return (
    <div className="relative w-full h-[420px] md:h-[580px] bg-muted/40 rounded-2xl overflow-hidden border shadow-sm">
      {/* 지도 컨테이너: 부모 높이를 그대로 채운다 */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {(!L || loadFailed) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-background/80 z-20 px-6 text-center">
          {loadFailed ? (
            <p className="text-xs font-semibold text-destructive">
              지도를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
            </p>
          ) : (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-semibold text-muted-foreground">
                전국 로또 명당 지도를 불러오는 중입니다...
              </p>
            </>
          )}
        </div>
      )}

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
