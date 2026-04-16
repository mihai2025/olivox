import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const PER_PAGE = 24;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .contains("category_slugs", [slug]);
  const totalPages = Math.max(1, Math.ceil((count || 0) / PER_PAGE));

  const base = `https://olivox.ro/produse/${slug}`;
  const canonical = page === 1 ? base : `${base}?page=${page}`;
  const prevUrl = page > 1 ? (page - 1 === 1 ? base : `${base}?page=${page - 1}`) : null;
  const nextUrl = page < totalPages ? `${base}?page=${page + 1}` : null;

  const other: Record<string, string> = {};
  if (prevUrl) other["link-rel-prev"] = prevUrl;
  if (nextUrl) other["link-rel-next"] = nextUrl;

  return {
    alternates: { canonical },
    other: Object.keys(other).length ? other : undefined,
    robots: page > 1 ? { index: false, follow: true } : undefined,
  };
}

async function getCategory(slug: string) {
  const { data } = await supabase
    .from("product_categories")
    .select("name, description")
    .eq("slug", slug)
    .single();
  return data;
}

async function getProducts(categorySlug: string, page: number) {
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data, count } = await supabase
    .from("products")
    .select("id, name, slug, r2_image_url, image_url, price", { count: "exact" })
    .contains("category_slugs", [categorySlug])
    .order("id", { ascending: false })
    .range(from, to);

  return {
    products: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / PER_PAGE),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  const [category, { products, totalPages }] = await Promise.all([
    getCategory(slug),
    getProducts(slug, page),
  ]);

  const plainDesc = (category?.description || "").replace(/<[^>]+>/g, "").trim();
  const titleCase = (s: string) => (s || "").toLowerCase().split(" ").map((w: string) => w.length ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
  const displayName = titleCase(category?.name || slug);

  const base = `https://olivox.ro/produse/${slug}`;
  const prevHref = page > 1 ? (page - 1 === 1 ? base : `${base}?page=${page - 1}`) : null;
  const nextHref = page < totalPages ? `${base}?page=${page + 1}` : null;

  return (
    <>
      {prevHref && <link rel="prev" href={prevHref} />}
      {nextHref && <link rel="next" href={nextHref} />}
      <nav className="breadcrumb">
        <a href="/">Acasa</a> / <a href="/categorii">Produse</a> / <span>{displayName}</span>
      </nav>
      <div className="cat-header">
        <h1 className="cat-header__title">{displayName}</h1>
        {plainDesc && <p className="cat-header__desc">{plainDesc}</p>}
      </div>

      {products.length === 0 ? (
        <div className="products-loading">Niciun produs in aceasta categorie.</div>
      ) : (
        <div className="products-grid">
          {products.map((prod) => (
            <a key={prod.id} href={`/produse/${slug}/${prod.slug}`} className="product-card">
              <div className="product-card__img-wrap">
                <img src={prod.r2_image_url || prod.image_url} alt={prod.name} className="product-card__img" loading="lazy" />
              </div>
              <div className="product-card__info">
                <h3 className="product-card__name">{prod.name}</h3>
                <div className="product-card__bottom">
                  <span className="product-card__price">{prod.price} RON</span>
                  <div className="product-card__stars">
                    <span className="product-card__stars-icons">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <span className="product-card__stars-count">({((prod.id * 7 + 13) % 277) + 4})</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 ? (
            <a className="pagination__btn" href={`/produse/${slug}${page - 1 === 1 ? "" : `?page=${page - 1}`}`} rel="prev">&larr; Inapoi</a>
          ) : (
            <span className="pagination__btn pagination__btn--disabled">&larr; Inapoi</span>
          )}
          <span className="pagination__info">Pagina {page} din {totalPages}</span>
          {page < totalPages ? (
            <a className="pagination__btn" href={`/produse/${slug}?page=${page + 1}`} rel="next">Inainte &rarr;</a>
          ) : (
            <span className="pagination__btn pagination__btn--disabled">Inainte &rarr;</span>
          )}
        </div>
      )}
    </>
  );
}
