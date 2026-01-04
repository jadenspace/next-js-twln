import { Metadata } from "next";

export const metadata: Metadata = {
  title: "기본 통계 분석",
  description:
    "로또 번호별 출현 빈도, 미출현 기간, 홀짝 비율 등 다양한 통계 데이터를 분석합니다.",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
