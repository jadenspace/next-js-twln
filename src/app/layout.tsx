import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/shared/lib/providers/query-provider";
import { Header } from "@/shared/components/layout/header";
import { Toaster } from "@/shared/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "TWLN | 스마트한 로또 분석 서비스",
    template: "%s | TWLN",
  },
  description:
    "빅데이터와 AI를 활용한 로또 당첨번호 분석, 패턴 분석, 당첨 시뮬레이션 및 추천 번호 서비스를 제공합니다.",
  keywords: [
    "로또",
    "로또분석",
    "로또번호추천",
    "로또통계",
    "로또시뮬레이션",
    "AI로또",
  ],
  openGraph: {
    title: "TWLN | 스마트한 로또 분석 서비스",
    description: "빅데이터와 AI 기반의 프리미엄 로또 분석 솔루션",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <QueryProvider>
          <Header />
          <main>{children}</main>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
