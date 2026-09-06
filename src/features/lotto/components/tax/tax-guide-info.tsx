"use client";

import React from "react";
import {
  Info,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

export function TaxGuideInfo() {
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-base text-foreground">
          로또 당첨금 수령 가이드 & 꿀팁
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* 등수별 수령 장소 */}
        <div className="p-4 rounded-xl bg-muted/20 border space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            등수별 수령 장소
          </div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <strong className="text-foreground font-semibold">1등:</strong>{" "}
              NH농협은행 본점 복권사업팀 (서울 중구 서대문역 5번 출구 앞)
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                2등 / 3등:
              </strong>{" "}
              전국 농협은행 각 지점 (단, 지역 농·축협 제외)
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                4등 / 5등:
              </strong>{" "}
              일반 로또 판매점 및 전국 농협은행 지점
            </li>
          </ul>
        </div>

        {/* 지급 기한 및 필수 준비물 */}
        <div className="p-4 rounded-xl bg-muted/20 border space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <CreditCard className="w-4 h-4 text-primary" />
            지급 기한 및 필수 지참물
          </div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <strong className="text-foreground font-semibold">
                지급 기한:
              </strong>{" "}
              해당 회차 지급개시일로부터 1년 이내 (기한 만료 시 복권기금 전액
              귀속)
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                1~3등 지참물:
              </strong>{" "}
              당첨 복권 실물, 본인 신분증(주민등록증/운전면허증)
            </li>
            <li>
              <strong className="text-foreground font-semibold">
                4~5등 지참물:
              </strong>{" "}
              당첨 복권 실물 (신분증 불필요)
            </li>
          </ul>
        </div>
      </div>

      {/* 세금 원천징수 팁 */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">
            복권 당첨금은 분리과세(원천징수)로 종결됩니다
          </p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            로또 당첨금은 기타소득으로 분류되지만, 5월 종합소득세 신고 시 다른
            소득(근로소득, 사업소득 등)과 합산되지 않고 은행 수령 시점에
            원천징수(22% 또는 33%)되는 것으로 과세가 완전히 종료됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
