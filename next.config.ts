import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lucide-react barrel import 최적화 (개발 ~2.8s, 프로덕션 콜드스타트 개선)
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  /* config options here */
  // 개발 모드에서 오버레이 비활성화
  devIndicators: {
    // buildActivity: false,
  },
  // 콘솔 오류 오버레이 비활성화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // 빌드 시 타입스크립트 오류 무시
  typescript: {
    ignoreBuildErrors: true,
  },

  // 프로덕션 소스맵 생성 비활성화
  productionBrowserSourceMaps: false,

  // React Compiler 활성화 (자동 메모이제이션) - Next.js 16에서는 최상위 옵션으로 승격됨
  reactCompiler: true,
};

export default nextConfig;
