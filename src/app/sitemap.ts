import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://lotto-detective.vercel.app";

  // 기본 공개 페이지
  const routes = [
    "",
    "/lotto/search",
    "/community",
    "/login",
    "/lotto/analysis/stats/numbers",
    "/lotto/analysis/stats/ranges",
    "/lotto/analysis/stats/missing",
    "/lotto/analysis/stats/odd-even",
    "/lotto/analysis/stats/consecutive",
    "/lotto/analysis/stats/regression",
    "/lotto/analysis/stats/markov",
    "/lotto/analysis/stats/japanese",
    "/lotto/analysis/stats/monte-carlo",
    "/lotto/analysis/stats/algorithm",
    "/lotto/analysis/pattern",
    "/lotto/analysis/recommend",
    "/lotto/analysis/simulation",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
