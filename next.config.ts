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

  // 타입 검사는 빌드에서 수행한다.
  // ignoreBuildErrors 를 켜 두면 커밋 훅(lint-staged)이 스타일만 보기 때문에
  // 파이프라인 어디에서도 타입을 확인하지 않게 된다. 실제로 그 상태에서
  // 서버 라우트를 포함한 오류 7건이 배포되고 있었다.

  // 프로덕션 소스맵 생성 비활성화
  productionBrowserSourceMaps: false,

  // React Compiler 활성화 (자동 메모이제이션) - Next.js 16에서는 최상위 옵션으로 승격됨
  reactCompiler: true,
};

export default nextConfig;
