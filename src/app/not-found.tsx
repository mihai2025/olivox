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

export default function NotFound() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setCategories(data); }).catch(() => {});
  }, []);

  return (
    <div className="page-wrapper">
      <Header />
      <div style={{ textAlign: "center", padding: "40px 0 24px" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-accent)", marginBottom: 8 }}>404</h1>
        <p style={{ fontSize: "1rem", color: "var(--color-text-muted)", marginBottom: 32 }}>Pagina nu a fost gasita. Poate gasesti ce cauti aici:</p>
      </div>

      {categories.length > 0 && (
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

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <a href="/" className="btn-order" style={{ display: "inline-flex", maxWidth: 300, textDecoration: "none" }}>
          Inapoi la pagina principala
        </a>
      </div>

      <Footer />
    </div>
  );
}
