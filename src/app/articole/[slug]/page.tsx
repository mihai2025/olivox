import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  image_url: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

async function getArticle(slug: string): Promise<Article | null> {
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, body, image_url, published_at, meta_title, meta_description")
    .eq("slug", slug)
    .single();
  return (data as Article) || null;
}

function truncate(str: string, max: number): string {
  if (!str || str.length <= max) return str;
  const cut = str.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return { title: "Articol negasit | olivox.ro", robots: { index: false, follow: true } };
  }
  const rawTitle = article.meta_title || `${article.title} | olivox.ro`;
  const title = truncate(rawTitle, 60);
  const description = truncate(article.meta_description || article.excerpt || article.title, 160);
  const url = `https://olivox.ro/articole/${slug}`;
  const image = article.image_url || "";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "olivox.ro", type: "article", locale: "ro_RO",
      publishedTime: article.published_at || undefined,
      images: image ? [{ url: image, alt: article.title, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: image ? [image] : [],
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="products-loading">Articolul nu a fost gasit.</div>
        <Footer />
      </div>
    );
  }

  const url = `https://olivox.ro/articole/${slug}`;
  const plainExcerpt = (article.excerpt || (article.body || "").replace(/<[^>]+>/g, "").slice(0, 200) || article.title).trim();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    description: plainExcerpt,
    image: article.image_url ? [article.image_url] : undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.published_at || undefined,
    author: { "@type": "Organization", name: "Snep", url: "https://www.snep.it" },
    publisher: {
      "@type": "Organization",
      name: "olivox.ro",
      url: "https://olivox.ro",
      logo: { "@type": "ImageObject", url: "https://olivox.ro/favicon.ico" },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasa", item: "https://olivox.ro" },
      { "@type": "ListItem", position: 2, name: "Articole", item: "https://olivox.ro/articole" },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };

  return (
    <div className="page-wrapper">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav className="breadcrumb">
        <a href="/">Acasa</a> / <a href="/articole">Articole</a> / <span>{article.title}</span>
      </nav>
      <article className="article-detail">
        <h1 className="article-detail__title">{article.title}</h1>
        {article.published_at && (
          <p className="article-detail__date" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            {formatDate(article.published_at)}
          </p>
        )}
        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="article-detail__img" style={{ maxWidth: "100%", height: "auto", margin: "16px 0", borderRadius: 8 }} />
        )}
        {article.body && (
          <div className="article-detail__body" dangerouslySetInnerHTML={{ __html: article.body }} />
        )}
      </article>
      <Footer />
    </div>
  );
}
