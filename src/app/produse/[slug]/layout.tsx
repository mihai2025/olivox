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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Categorie negasita | olivox.ro",
      description: "Categoria cautata nu a fost gasita.",
    };
  }

  const title = category.meta_title || `${category.name} | olivox.ro`;
  const plainDesc = (category.description || "").replace(/<[^>]+>/g, "").trim().slice(0, 160);
  const description = category.meta_description || plainDesc || `${category.name} — produse premium disponibile pe olivox.ro.`;
  const image = category.image_url || "";
  const url = `https://olivox.ro/produse/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "olivox.ro", type: "website", locale: "ro_RO",
      images: image ? [{ url: image, alt: category.name }] : [],
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasa", item: "https://olivox.ro" },
      { "@type": "ListItem", position: 2, name: "Produse", item: "https://olivox.ro/categorii" },
      { "@type": "ListItem", position: 3, name: category.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="page-wrapper">
        <Header />
        {children}
        <Footer />
      </div>
    </>
  );
}

