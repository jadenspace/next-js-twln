"use client";

import React, { useState } from "react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent } from "@/shared/ui/card";
import { QrScannerCamera } from "@/features/lotto/components/qr/qr-scanner-camera";
import { QrImageUploader } from "@/features/lotto/components/qr/qr-image-uploader";
import { QrManualInput } from "@/features/lotto/components/qr/qr-manual-input";
import { QrResultReceipt } from "@/features/lotto/components/qr/qr-result-receipt";
import { parseLottoQrUrl } from "@/features/lotto/lib/lotto-qr-parser";
import { checkLottoQrResult } from "@/features/lotto/lib/lotto-qr-checker";
import { lottoApi, transformLottoData } from "@/features/lotto/api/lotto-api";
import { QrCheckResult } from "@/features/lotto/types/qr.types";
import {
  Camera,
  Image as ImageIcon,
  Keyboard,
  QrCode,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

type ScanTab = "camera" | "upload" | "manual";

export default function LottoQrPage() {
  const [activeTab, setActiveTab] = useState<ScanTab>("camera");
  const [checkResult, setCheckResult] = useState<QrCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQrDetected = async (qrString: string) => {
    setIsLoading(true);
    try {
      // 1. QR 문자열 파싱
      const parsed = parseLottoQrUrl(qrString);

      // 2. 해당 회차 당첨 데이터 조회
      const apiData = await lottoApi.fetchLottoDraw(parsed.drawNo);
      const drawData = apiData ? transformLottoData(apiData) : null;

      // 3. 당첨 결과 판정
      const result = checkLottoQrResult(parsed, drawData);
      setCheckResult(result);

      if (result.isDrawPending) {
        toast.info(`제 ${result.drawNo}회 복권입니다. 아직 추첨 전입니다.`);
      } else if (result.totalPrize > 0) {
        toast.success(
          `축하합니다! ${result.winningGamesCount}개 게임 당첨 (${result.highestRank}등)`,
        );
      } else {
        toast("아쉽지만 낙첨되었습니다. 다음 기회에!");
      }
    } catch (err: any) {
      toast.error(err.message || "QR 코드 분석에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCheckResult(null);
  };

  return (
    <div className="py-6 md:py-10 max-w-4xl mx-auto px-4 space-y-8">
      <PageHeader
        title="로또 QR코드 당첨 확인"
        description="실물 로또 복권의 QR코드를 카메라로 비추거나 사진을 업로드하여 1초 만에 당첨 결과를 확인하세요."
      />

      {/* 결과 화면이 있을 때 */}
      {checkResult ? (
        <QrResultReceipt result={checkResult} onReset={handleReset} />
      ) : (
        <div className="space-y-6">
          {/* 입력 모드 탭 셀렉터 */}
          <div className="flex p-1 bg-muted/60 backdrop-blur rounded-xl max-w-md mx-auto border border-border">
            <button
              onClick={() => setActiveTab("camera")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all",
                activeTab === "camera"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Camera className="w-4 h-4" />
              카메라 스캔
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all",
                activeTab === "upload"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ImageIcon className="w-4 h-4" />
              사진 업로드
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all",
                activeTab === "manual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Keyboard className="w-4 h-4" />
              직접 입력
            </button>
          </div>

          {/* 메인 스캔 영역 카드 */}
          <Card className="border-border shadow-sm overflow-hidden">
            <CardContent className="p-6 md:p-8">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div>
                    <h4 className="font-bold text-base text-foreground">
                      당첨 결과 조회 중
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      공식 당첨 데이터와 대조하고 있습니다...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === "camera" && (
                    <QrScannerCamera
                      onScanSuccess={handleQrDetected}
                      onError={(msg) => console.log("Camera error:", msg)}
                    />
                  )}
                  {activeTab === "upload" && (
                    <QrImageUploader
                      onScanSuccess={handleQrDetected}
                      onError={(msg) => console.log("Upload error:", msg)}
                    />
                  )}
                  {activeTab === "manual" && (
                    <QrManualInput onSubmit={handleQrDetected} />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* 사용 안내 팁 */}
          <div className="bg-muted/30 border rounded-xl p-4 text-xs text-muted-foreground space-y-1.5 max-w-xl mx-auto">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-primary" /> 로또 QR 확인 이용
              안내
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li>
                복권 용지 우측 상단의 QR 코드를 프레임 안에 맞추면 자동
                인식됩니다.
              </li>
              <li>
                빛 반사가 심하거나 구겨진 복권은 사진을 찍어 업로드하시거나 직접
                입력 기능을 이용해주세요.
              </li>
              <li>
                토요일 오후 8시 45분 이후 추첨이 완료되면 실시간 당첨 정보가
                반영됩니다.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
