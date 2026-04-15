import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteConfig } from "@/lib/site-config";

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

      {categories.length > 0 && (
        <section className="home-section">
          <div className="cat-page-grid">
            {categories.map((cat) => (
              <a key={cat.id} href={`/produse/${cat.slug}`} className="cat-page-card">
                {cat.image_url && <img src={cat.image_url} alt={cat.name} className="cat-page-card__img" loading="lazy" />}
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
            {products.map((prod) => {
              const catSlug = prod.category_slugs?.[0] || "toate";
              return (
                <a key={prod.id} href={`/produse/${catSlug}/${prod.slug}`} className="product-card">
                  <div className="product-card__img-wrap">
                    <img src={prod.r2_image_url || prod.image_url || ""} alt={prod.name} className="product-card__img" loading="lazy" />
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
