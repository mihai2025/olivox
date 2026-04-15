import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Articole | olivox.ro",
  description: "Articole si noutati despre ulei de masline, suplimente naturale si produse premium.",
  alternates: { canonical: "https://olivox.ro/articole" },
};

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
}

async function getArticles(): Promise<Article[]> {
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, image_url, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(100);
  return (data as Article[]) || [];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="page-wrapper">
      <Header />
      <div className="cat-header">
        <h1 className="cat-header__title">Articole</h1>
        <p className="cat-header__count">{articles.length} articole</p>
      </div>

      {articles.length === 0 ? (
        <div className="products-loading">Niciun articol disponibil.</div>
      ) : (
        <div className="cat-page-grid">
          {articles.map((a) => (
            <a key={a.id} href={`/articole/${a.slug}`} className="cat-page-card">
              {a.image_url && <img src={a.image_url} alt={a.title} className="cat-page-card__img" loading="lazy" />}
              <div className="cat-page-card__info">
                <h3>{a.title}</h3>
                {a.excerpt && <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: 6 }}>{a.excerpt}</p>}
                {a.published_at && <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{formatDate(a.published_at)}</span>}
              </div>
            </a>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
}
