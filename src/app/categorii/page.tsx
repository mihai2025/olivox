"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
}

export default function CategoriiPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = "Categorii produse | olivox.ro";
  }, []);

  return (
    <div className="page-wrapper">
      <Header />
      <h1 className="cat-header__title">Categorii produse</h1>
      <p className="cat-header__count" style={{ marginBottom: 20 }}>{categories.length} categorii</p>

      {loading ? (
        <div className="products-loading">Se incarca...</div>
      ) : (
        <div className="cat-page-grid">
          {categories.map((cat) => (
            <a key={cat.id} href={`/produse/${cat.slug}`} className="cat-page-card">
              {cat.image_url && <img src={cat.image_url} alt={cat.name} className="cat-page-card__img" loading="lazy" />}
              <div className="cat-page-card__info">
                <h3>{cat.name}</h3>
                <span>{cat.product_count} produse</span>
              </div>
            </a>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}
