import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://lottodetective.vercel.app";

  // 기본 공개 페이지 및 주요 서비스 페이지
  const routes = [
    "",
    "/lotto/search",
    "/lotto/generate/random",
    "/lotto/generate/manual-pattern",
    "/community",
    "/lotto/analysis/simulation",
    "/lotto/analysis/stats",
    "/lotto/analysis/stats/numbers",
    "/lotto/analysis/stats/ranges",
    "/lotto/analysis/stats/missing",
    "/lotto/analysis/stats/odd-even",
    "/lotto/analysis/stats/consecutive",
    "/lotto/analysis/stats/ending-digit",
    "/lotto/analysis/stats/interval",
    "/lotto/analysis/stats/nine-ranges",
    "/lotto/analysis/stats/math",
    "/lotto/analysis/stats/compatibility",
    "/lotto/analysis/stats/regression",
    "/lotto/analysis/stats/markov",
    "/lotto/analysis/stats/japanese",
    "/lotto/analysis/stats/monte-carlo",
    "/lotto/analysis/stats/algorithm",
    "/login",
    "/privacy",
    "/terms",
    "/refund-policy",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
