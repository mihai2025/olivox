import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/cautare?"],
      },
      // Allow AI crawlers for brand visibility in AI-generated answers.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
    ],
    sitemap: [
      "https://olivox.ro/sitemap.xml",
      "https://olivox.ro/sitemap-images.xml",
    ],
    host: "https://olivox.ro",
  };
}
