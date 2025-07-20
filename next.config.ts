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
};

export default nextConfig;
