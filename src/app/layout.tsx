import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/shared/lib/providers/query-provider";
import { Header } from "@/shared/components/layout/header";
import { Toaster } from "@/shared/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://lottodetective.vercel.app"),
  title: {
    default: "로또탐정 | 스마트한 로또 분석 서비스",
    template: "%s | 로또탐정",
  },
  description:
    "빅데이터와 AI를 활용한 로또 당첨번호 분석, 패턴 분석, 당첨 시뮬레이션 및 추천 번호 서비스를 제공합니다. 역대 당첨 결과를 정밀하게 분석하여 당신의 행운을 찾아보세요.",
  keywords: [
    "로또",
    "로또분석",
    "로또번호추천",
    "로또통계",
    "로또시뮬레이션",
    "AI로또",
    "동행복권",
    "로또탐정",
    "로또패턴",
  ],
  authors: [{ name: "로또탐정팀" }],
  creator: "로또탐정",
  publisher: "로또탐정",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "로또탐정 | 스마트한 로또 분석 서비스",
    description:
      "빅데이터와 AI 기반의 프리미엄 로또 분석 솔루션 - 당신의 당첨 확률을 높여보세요.",
    url: "https://lottodetective.vercel.app",
    siteName: "로또탐정",
    images: [
      {
        url: "/og-image.png", // 실제 이미지가 있다면 해당 경로로 수정
        width: 1200,
        height: 630,
        alt: "로또탐정 분석기",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "로또탐정 | 스마트한 로또 분석 서비스",
    description: "빅데이터와 AI 기반의 프리미엄 로또 분석 솔루션",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
