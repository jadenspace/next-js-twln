import { Metadata } from "next";

export const metadata: Metadata = {
  title: "당첨 시뮬레이션",
  description:
    "선택한 번호로 역대 모든 로또 회차에 대입하여 예상 수익률과 당첨 횟수를 실시간으로 시뮬레이션합니다.",
};

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
