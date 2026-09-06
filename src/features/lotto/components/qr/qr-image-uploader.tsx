"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface QrImageUploaderProps {
  onScanSuccess: (qrCode: string) => void;
  onError?: (error: string) => void;
}

export function QrImageUploader({
  onScanSuccess,
  onError,
}: QrImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      const err = "이미지 파일만 업로드할 수 있습니다.";
      setErrorMessage(err);
      onError?.(err);
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // 1. 이미지 엘리먼트 생성 및 로드
      const img = new Image();
      img.src = objectUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 2. BarcodeDetector 지원 시 디텍팅
      const win = window as any;
      if (typeof win.BarcodeDetector === "function") {
        const detector = new win.BarcodeDetector({ formats: ["qr_code"] });
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
          onScanSuccess(barcodes[0].rawValue);
          setIsProcessing(false);
          return;
        }
      }

      // BarcodeDetector가 없거나 QR 인식에 실패한 경우
      const fallbackMsg =
        "이미지에서 로또 QR 코드를 인식하지 못했습니다. QR 코드가 선명하고 빛 반사가 없는지 확인해주세요.";
      setErrorMessage(fallbackMsg);
      onError?.(fallbackMsg);
    } catch (err: any) {
      const msg = err.message || "이미지 분석 중 오류가 발생했습니다.";
      setErrorMessage(msg);
      onError?.(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 aspect-[4/3] bg-card/50 hover:bg-card/80",
          isDragging
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-border",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">
              QR 코드를 분석하는 중입니다...
            </p>
          </div>
        ) : previewUrl && !errorMessage ? (
          <div className="flex flex-col items-center space-y-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="선택된 이미지"
              className="max-h-32 object-contain rounded-lg border shadow-sm"
            />
            <p className="text-xs text-muted-foreground">
              다른 사진을 선택하려면 클릭하거나 드래그하세요
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="p-4 bg-primary/10 text-primary rounded-full">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                로또 복권 사진 업로드
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                사진을 드래그하거나 클릭하여 파일 선택
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 pointer-events-none mt-2"
            >
              <ImageIcon className="w-4 h-4" /> 갤러리/파일 열기
            </Button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">QR 인식 실패</p>
            <p className="text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
