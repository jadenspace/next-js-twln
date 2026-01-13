import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/mypage/",
          "/points/",
          "/auth/",
          "/reset-password/",
        ],
      },
    ],
    sitemap: "https://lottodetective.vercel.app/sitemap.xml",
  };
}
