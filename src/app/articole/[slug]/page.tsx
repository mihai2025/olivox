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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return { title: "Articol negasit | olivox.ro" };
  }
  const title = article.meta_title || `${article.title} | olivox.ro`;
  const description = article.meta_description || article.excerpt || article.title;
  const url = `https://olivox.ro/articole/${slug}`;
  const image = article.image_url || "";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: "olivox.ro", type: "article", locale: "ro_RO",
      images: image ? [{ url: image, alt: article.title }] : [],
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

  return (
    <div className="page-wrapper">
      <Header />
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
