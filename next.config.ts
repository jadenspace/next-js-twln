import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

  // 빌드 시 타입스크립트 및 ESLint 오류 무시
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 프로덕션 소스맵 생성 비활성화
  productionBrowserSourceMaps: false,
  // React Compiler 활성화 (자동 메모이제이션)
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
