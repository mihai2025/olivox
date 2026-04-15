import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "huse.gravpoint.ro",
      },
    ],
  },

  async redirects() {
    return [
      // Old WooCommerce brand-model pages
      { source: "/brand-model", destination: "/categorii", permanent: true },
      { source: "/brand-model/:path*", destination: "/categorii", permanent: true },

      // Old WooCommerce category-product pages
      // /categorie-produs/huse-de-telefon/ -> /categorii
      { source: "/categorie-produs", destination: "/categorii", permanent: true },
      { source: "/categorie-produs/huse-de-telefon", destination: "/categorii", permanent: true },
      { source: "/categorie-produs/huse-de-telefon/", destination: "/categorii", permanent: true },
      { source: "/categorie-produs/huse-de-telefon/huse-de-telefon-personalizate", destination: "/categorii", permanent: true },
      { source: "/categorie-produs/huse-de-telefon/huse-de-telefon-personalizate/", destination: "/categorii", permanent: true },
      // Subcategory pattern: /categorie-produs/huse-de-telefon/:slug -> /huse/:slug
      { source: "/categorie-produs/huse-de-telefon/:slug", destination: "/huse/:slug", permanent: true },
      { source: "/categorie-produs/huse-de-telefon/:slug/", destination: "/huse/:slug", permanent: true },
      // Deeper nested /categorie-produs/huse-de-telefon/huse-personalizate/:slug -> /huse/:slug
      { source: "/categorie-produs/huse-de-telefon/huse-personalizate/:slug", destination: "/huse/:slug", permanent: true },
      { source: "/categorie-produs/huse-de-telefon/huse-personalizate/:slug/", destination: "/huse/:slug", permanent: true },
      // Generic catch-all for any remaining /categorie-produs/*
      { source: "/categorie-produs/:path*", destination: "/categorii", permanent: true },

      // Old Shopify-style collections: /collections/:slug -> /huse/:slug
      { source: "/collections/:slug", destination: "/huse/:slug", permanent: true },
      { source: "/collections/:slug/", destination: "/huse/:slug", permanent: true },
      { source: "/collections", destination: "/categorii", permanent: true },

      // Old WooCommerce tag pages: /eticheta-produs/:tag -> /categorii (safe fallback)
      // Specific known tag mappings take priority over the generic fallback
      { source: "/eticheta-produs/husa-desene-stitch", destination: "/huse/huse-stitch", permanent: true },
      { source: "/eticheta-produs/husa-desene-stitch/", destination: "/huse/huse-stitch", permanent: true },
      { source: "/eticheta-produs/:tag", destination: "/categorii", permanent: true },
      { source: "/eticheta-produs/:tag/", destination: "/categorii", permanent: true },

      // Old WooCommerce product pages: /produs/:slug -> middleware handles this
      // (needs DB lookup to find the category) - see middleware.ts

      // Old WordPress/Shopify patterns
      { source: "/shop", destination: "/categorii", permanent: true },
      { source: "/magazin", destination: "/categorii", permanent: true },
    ];
  },
};

export default nextConfig;
