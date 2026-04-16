import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

async function getCategory(slug: string) {
  const { data } = await supabase
    .from("product_categories")
    .select("id, name, slug, description, image_url, meta_title, meta_description")
    .eq("slug", slug)
    .single();
  return data;
}

async function getCategoryProducts(slug: string) {
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, price, currency, r2_image_url, image_url, stock_status, short_description")
    .contains("category_slugs", [slug])
    .order("id", { ascending: false })
    .limit(20);
  return data || [];
}

function truncate(str: string, max: number): string {
  if (!str || str.length <= max) return str;
  const cut = str.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Categorie negasita | olivox.ro",
      description: "Categoria cautata nu a fost gasita.",
      robots: { index: false, follow: true },
    };
  }

  const rawTitle = category.meta_title || `${category.name} | olivox.ro`;
  const title = truncate(rawTitle, 60);
  const plainDesc = (category.description || "").replace(/<[^>]+>/g, "").trim().slice(0, 160);
  const description = truncate(
    category.meta_description || plainDesc || `${category.name} — produse premium disponibile pe olivox.ro.`,
    160
  );
  const image = category.image_url || "";
  const url = `https://olivox.ro/produse/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "olivox.ro", type: "website", locale: "ro_RO",
      images: image ? [{ url: image, alt: category.name, width: 1200, height: 1200 }] : [],
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: image ? [image] : [],
    },
  };
}

export default async function CategoryLayout({ params, children }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return (
      <div className="page-wrapper">
        <Header />
        {children}
        <Footer />
      </div>
    );
  }

  const url = `https://olivox.ro/produse/${slug}`;
  const products = await getCategoryProducts(slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasa", item: "https://olivox.ro" },
      { "@type": "ListItem", position: 2, name: "Produse", item: "https://olivox.ro/categorii" },
      { "@type": "ListItem", position: 3, name: category.name, item: url },
    ],
  };

  const plainCatDesc = (category.description || "").replace(/<[^>]+>/g, "").trim();

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    url,
    description: category.meta_description || plainCatDesc || `${category.name} — produse premium disponibile pe olivox.ro.`,
    isPartOf: { "@type": "WebSite", name: "olivox.ro", url: "https://olivox.ro" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://olivox.ro/produse/${slug}/${p.slug}`,
        item: {
          "@type": "Product",
          name: p.name,
          url: `https://olivox.ro/produse/${slug}/${p.slug}`,
          image: p.r2_image_url || p.image_url || undefined,
          offers: p.price != null ? {
            "@type": "Offer",
            price: Number(p.price).toFixed(2),
            priceCurrency: p.currency || "RON",
            availability: p.stock_status !== "out_of_stock"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `https://olivox.ro/produse/${slug}/${p.slug}`,
          } : undefined,
        },
      })),
    },
    hasPart: products.map((p) => ({
      "@type": "Product",
      name: p.name,
      url: `https://olivox.ro/produse/${slug}/${p.slug}`,
      image: p.r2_image_url || p.image_url || undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <div className="page-wrapper">
        <Header />
        {children}
        <Footer />
      </div>
    </>
  );
}
