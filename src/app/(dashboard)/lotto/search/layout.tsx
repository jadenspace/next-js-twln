import { Metadata } from "next";

export const metadata: Metadata = {
  title: "로또 당첨번호 검색",
  description:
    "역대 로또 당첨번호를 회차별, 날짜별로 빠르고 정확하게 검색해보세요.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
