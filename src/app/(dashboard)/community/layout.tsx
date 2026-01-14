import { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의/답변",
  description:
    "서비스 이용 중 궁금한 내용을 문의하고 답변을 확인할 수 있습니다.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
