import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 행운의 번호 추천",
  description:
    "최신 인공지능 알고리즘과 통계 데이터를 결합하여 이번 주 가장 유력한 로또 번호 조합을 제안합니다.",
};

export default function RecommendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
