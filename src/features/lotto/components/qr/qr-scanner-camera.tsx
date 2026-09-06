"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/shared/ui/button";
import { SwitchCamera, AlertCircle, RefreshCw } from "lucide-react";

interface QrScannerCameraProps {
  onScanSuccess: (qrCode: string) => void;
  onError?: (error: string) => void;
}

export function QrScannerCamera({
  onScanSuccess,
  onError,
}: QrScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState<boolean | null>(
    null,
  );
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // BarcodeDetector 지원 여부 검사
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as any;
      if (typeof win.BarcodeDetector === "function") {
        win.BarcodeDetector.getSupportedFormats()
          .then((formats: string[]) => {
            setHasBarcodeDetector(formats.includes("qr_code"));
          })
          .catch(() => {
            setHasBarcodeDetector(false);
          });
      } else {
        setHasBarcodeDetector(false);
      }
    }
  }, []);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  }, []);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = "이 브라우저에서는 카메라 접근을 지원하지 않습니다.";
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setIsCameraActive(true);
        setIsScanning(true);
      }
    } catch (err: any) {
      let msg = "카메라를 시작할 수 없습니다.";
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        msg =
          "카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        msg = "사용 가능한 카메라를 찾을 수 없습니다.";
      }
      setErrorMessage(msg);
      onError?.(msg);
      setIsCameraActive(false);
    }
  }, [facingMode, onError, stopCamera]);

  // 실시간 QR 스캔 루프 (BarcodeDetector 사용)
  useEffect(() => {
    if (!isScanning || !isCameraActive || hasBarcodeDetector === false) return;

    let detector: any = null;
    try {
      const win = window as any;
      detector = new win.BarcodeDetector({ formats: ["qr_code"] });
    } catch {
      return;
    }

    let isDetecting = false;

    const scanFrame = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        !isDetecting
      ) {
        isDetecting = true;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
              stopCamera();
              onScanSuccess(rawValue);
              return;
            }
          }
        } catch {
          // 일시적 프레임 분석 실패는 무시
        } finally {
          isDetecting = false;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isScanning,
    isCameraActive,
    hasBarcodeDetector,
    onScanSuccess,
    stopCamera,
  ]);

  // 마운트 시 카메라 시작
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // 전후면 카메라 토글
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center border border-border">
      {/* 카메라 비디오 스트림 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />

      {/* 스캔 가이드 오버레이 */}
      {isCameraActive && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
          {/* 어두운 배경 마스크 & 투명 뷰파인더 */}
          <div className="relative w-64 h-64 border-2 border-primary/80 rounded-2xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            {/* 모서리 브래킷 */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

            {/* 움직이는 레이저 스캔 바 */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-[0_0_12px_#3b82f6] animate-scan-y" />
          </div>

          <p className="mt-8 text-xs md:text-sm font-medium text-white/90 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
            복권 상단의 QR코드를 사각형 안에 비춰주세요
          </p>
        </div>
      )}

      {/* 에러 상태 UI */}
      {errorMessage && (
        <div className="absolute inset-0 bg-background/95 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-full">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-base text-foreground">
            카메라 연결 실패
          </h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            {errorMessage}
          </p>
          <Button
            onClick={startCamera}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> 다시 시도
          </Button>
        </div>
      )}

      {/* 하단 컨트롤 바 */}
      {isCameraActive && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-3 px-4 pointer-events-auto">
          <Button
            size="sm"
            variant="secondary"
            className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 rounded-full gap-1.5 text-xs"
            onClick={toggleFacingMode}
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            카메라 전환
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 rounded-full gap-1.5 text-xs"
            onClick={startCamera}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            재연결
          </Button>
        </div>
      )}
    </div>
  );
}
