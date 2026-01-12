"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { BarChart2, PieChart, Timer, Binary, Hash } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const STAT_MENUS = [
  {
    title: "번호별 통계",
    description: "각 번호의 출현 빈도와 확률 분석",
    href: "/lotto/analysis/stats/numbers",
    icon: Hash,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "구간별 출현횟수",
    description: "10단위 번호대별 분포 확인",
    href: "/lotto/analysis/stats/ranges",
    icon: BarChart2,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "미출현 번호",
    description: "최근 나오지 않은 장기 미출현수",
    href: "/lotto/analysis/stats/missing",
    icon: Timer,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "홀짝 통계",
    description: "당첨 번호의 홀수/짝수 비율",
    href: "/lotto/analysis/stats/odd-even",
    icon: PieChart,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "연속번호 출현",
    description: "이웃한 번호들의 동반 출현 패턴",
    href: "/lotto/analysis/stats/consecutive",
    icon: Binary,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

export default function StatsAnalysisDashboard() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black mb-4">기본 통계 분석 센터</h1>
        <p className="text-muted-foreground text-lg">
          역대 로또 당첨 데이터를 기반으로 한 5가지 핵심 기본 통계를 제공합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAT_MENUS.map((menu) => {
          const Icon = menu.icon;
          return (
            <Link key={menu.href} href={menu.href}>
              <Card className="h-full hover:shadow-xl transition-all cursor-pointer group border-primary/5 hover:border-primary/20">
                <CardHeader>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                      menu.bgColor,
                    )}
                  >
                    <Icon className={cn("w-6 h-6", menu.color)} />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {menu.title}
                  </CardTitle>
                  <CardDescription>{menu.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    자세히 보기 &rarr;
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-12 bg-muted/30 border-dashed">
        <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full uppercase">
              VIP Only
            </div>
            <p className="text-sm font-medium">
              심화 통계 분석 기능은 드롭다운 메뉴에서 확인 가능합니다.
            </p>
          </div>
          <Link href="/lotto/analysis/stats/markov">
            <span className="text-sm font-bold text-primary hover:underline">
              심화 통계 바로가기
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
