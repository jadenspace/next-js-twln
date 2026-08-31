import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/shared/lib/providers/query-provider";
import { Header } from "@/shared/components/layout/header";
import { Footer } from "@/shared/components/layout/footer";
import { Toaster } from "@/shared/ui/sonner";
import { GoogleTagManager } from "@next/third-parties/google";
import { ServiceStatusBanner } from "@/shared/components/service-status-banner";

export const metadata: Metadata = {
  metadataBase: new URL("https://lottodetective.vercel.app"),
  title: {
    default: "로또탐정 | 스마트한 로또 분석 서비스",
    template: "%s | 로또탐정",
  },
  description:
    "역대 로또 당첨번호를 바탕으로 출현 빈도, 패턴, 조합 통계를 정리해 보여주고 번호 생성과 당첨 시뮬레이션을 제공합니다. 추첨은 매 회차 독립 시행이므로 분석으로 당첨 확률이 높아지지는 않습니다.",
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
      "역대 당첨번호 통계와 패턴을 한눈에 정리해 주는 로또 분석 서비스",
    url: "https://lottodetective.vercel.app",
    siteName: "로또탐정",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "로또탐정",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "로또탐정 | 스마트한 로또 분석 서비스",
    description: "통계 분석 기반의 프리미엄 로또 분석 솔루션",
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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon",
        url: "/apple-touch-icon.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
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
        <GoogleTagManager
          gtmId={process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID as string}
        />
        <QueryProvider>
          <ServiceStatusBanner />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
