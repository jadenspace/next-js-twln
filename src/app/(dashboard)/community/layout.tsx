import { Metadata } from "next";

export const metadata: Metadata = {
  title: "자유 게시판",
  description:
    "TWLN 로또 분석 서비스의 커뮤니티 공간입니다. 당첨 후기와 나만의 분석 노하우를 공유해보세요.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
