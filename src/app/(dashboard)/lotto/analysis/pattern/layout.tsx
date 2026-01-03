import { Metadata } from "next";

export const metadata: Metadata = {
  title: "심층 패턴 분석",
  description:
    "연속 번호, 끝수 분포, AC 값 분석 등 로또 번호 속에 숨겨진 복합적인 패턴을 찾아냅니다.",
};

export default function PatternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
