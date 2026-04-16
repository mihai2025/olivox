import Image from "next/image";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteConfig } from "@/lib/site-config";

const OPTIMIZED_IMG_HOSTS = ["media.ghidulfunerar.ro", "huse.gravpoint.ro"];
function canOptimize(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return OPTIMIZED_IMG_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  r2_image_url: string | null;
  image_url: string | null;
  category_slugs: string[] | null;
}

async function getData() {
  const [catsRes, prodsRes] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, slug, image_url, description")
      .order("id", { ascending: true })
      .limit(8),
    supabase
      .from("products")
      .select("id, name, slug, price, r2_image_url, image_url, category_slugs")
      .order("id", { ascending: false })
      .limit(8),
  ]);
  return {
    categories: (catsRes.data as Category[]) || [],
    products: (prodsRes.data as Product[]) || [],
  };
}

export default async function HomePage() {
  const [{ categories, products }] = await Promise.all([getData(), getSiteConfig()]);

  return (
    <div className="page-wrapper">
      <Header />

      <section className="home-section home-intro" style={{ textAlign: "center", padding: "32px 16px 8px" }}>
        <h1 className="home-hero__title" style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0, lineHeight: 1.25 }}>
          Suplimente alimentare si cosmetice naturale Snep
        </h1>
        <p className="home-hero__lead" style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", marginTop: 8, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
          Catalog complet Snep in Romania — suplimente pe baza de plante, programe nutritionale, alimente functionale si cosmetice naturale. Livrare rapida in 3-5 zile lucratoare.
        </p>
      </section>

      {categories.length > 0 && (
        <section className="home-section">
          <div className="cat-page-grid">
            {categories.map((cat, i) => (
              <a key={cat.id} href={`/produse/${cat.slug}`} className="cat-page-card">
                {cat.image_url && (
                  canOptimize(cat.image_url) ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      width={320}
                      height={200}
                      sizes="(max-width: 768px) 50vw, 220px"
                      className="cat-page-card__img"
                      priority={i < 2}
                      loading={i < 2 ? undefined : "lazy"}
                    />
                  ) : (
                    <img src={cat.image_url} alt={cat.name} className="cat-page-card__img" loading={i < 2 ? "eager" : "lazy"} />
                  )
                )}
                <div className="cat-page-card__info">
                  <h3>{cat.name}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__title">Produse recomandate</h2>
          <div className="products-grid">
            {products.map((prod, i) => {
              const catSlug = prod.category_slugs?.[0] || "toate";
              const imgUrl = prod.r2_image_url || prod.image_url || "";
              return (
                <a key={prod.id} href={`/produse/${catSlug}/${prod.slug}`} className="product-card">
                  <div className="product-card__img-wrap">
                    {imgUrl && (canOptimize(imgUrl) ? (
                      <Image
                        src={imgUrl}
                        alt={prod.name}
                        width={320}
                        height={320}
                        sizes="(max-width: 768px) 50vw, 220px"
                        className="product-card__img"
                        loading={i < 4 ? "eager" : "lazy"}
                      />
                    ) : (
                      <img src={imgUrl} alt={prod.name} className="product-card__img" loading={i < 4 ? "eager" : "lazy"} />
                    ))}
                  </div>
                  <div className="product-card__info">
                    <h3 className="product-card__name">{prod.name}</h3>
                    <div className="product-card__bottom">
                      <span className="product-card__price">{prod.price} RON</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
