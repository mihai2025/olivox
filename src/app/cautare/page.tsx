"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Product {
  id: number;
  name: string;
  slug: string;
  r2_image_url: string;
  image_url: string;
  price: number;
  category_slugs: string[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(query)}&page=${page}&per_page=24`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query, page]);

  useEffect(() => {
    document.title = query ? `Cautare: ${query} | olivox.ro` : "Cautare | olivox.ro";
  }, [query]);

  return (
    <div className="page-wrapper">
      <Header />

      <div className="cat-header">
        <h1 className="cat-header__title">
          {query ? `Rezultate pentru "${query}"` : "Cautare"}
        </h1>
        {total > 0 && <p className="cat-header__count">{total} produse gasite</p>}
      </div>

      {loading ? (
        <div className="products-loading">Se cauta...</div>
      ) : products.length === 0 ? (
        <div className="products-loading" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: 8 }}>Niciun produs gasit pentru "{query}"</p>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>Incearca alte cuvinte cheie sau exploreaza categoriile noastre.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((prod) => (
            <a key={prod.id} href={`/produse/${prod.category_slugs?.[0] || "toate"}/${prod.slug}`} className="product-card">
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
          <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>&#8592; Inapoi</button>
          <span className="pagination__info">Pagina {page} din {totalPages}</span>
          <button className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Inainte &#8594;</button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="products-loading">Se incarca...</div>}>
      <SearchContent />
    </Suspense>
  );
}
