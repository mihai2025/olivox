import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  params: Promise<{ slug: string; product: string }>;
  children: React.ReactNode;
}

async function getProduct(productSlug: string) {
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, short_description, description, price, r2_image_url, image_url, meta_title, meta_description, keywords")
    .eq("slug", productSlug)
    .single();
  return data;
}

async function getCategoryName(slug: string) {
  const { data } = await supabase
    .from("product_categories")
    .select("name")
    .eq("slug", slug)
    .single();
  return data?.name || slug.replace(/-/g, " ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: categorySlug, product: productSlug } = await params;
  const product = await getProduct(productSlug);

  if (!product) {
    return {
      title: "Produs negasit | olivox.ro",
      description: "Produsul cautat nu a fost gasit.",
    };
  }

  const plainShort = (product.short_description || "").replace(/<[^>]+>/g, "").trim();
  const plainDesc = plainShort || (product.description || "").replace(/<[^>]+>/g, "").trim().slice(0, 160);
  const title = product.meta_title || `${product.name} | olivox.ro`;
  const description = product.meta_description || plainDesc || `${product.name} — ${product.price} RON. Comanda acum pe olivox.ro.`;
  const image = product.r2_image_url || product.image_url || "";
  const url = `https://olivox.ro/produse/${categorySlug}/${productSlug}`;

  return {
    title,
    description,
    keywords: product.keywords || undefined,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "olivox.ro", type: "website", locale: "ro_RO",
      images: image ? [{ url: image, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const { slug: categorySlug, product: productSlug } = await params;
  const product = await getProduct(productSlug);
  const categoryName = await getCategoryName(categorySlug);

  if (!product) {
    return (
      <div className="page-wrapper">
        <Header />
        {children}
        <Footer />
      </div>
    );
  }

  const url = `https://olivox.ro/produse/${categorySlug}/${productSlug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasa", item: "https://olivox.ro" },
      { "@type": "ListItem", position: 2, name: categoryName, item: `https://olivox.ro/produse/${categorySlug}` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="page-wrapper">
        <Header />
        <nav className="breadcrumb">
          <a href="/">Acasa</a> / <a href={`/produse/${categorySlug}`}>{categoryName}</a> / <span>{product.name}</span>
        </nav>
        {children}
        <Footer />
      </div>
    </>
  );
}
