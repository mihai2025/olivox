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
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2) window.location.href = `/cautare?q=${encodeURIComponent(q)}`;
  };

  return (
    <div className="page-wrapper">
      <Header />

      <section className="nf-hero">
        <div className="eyebrow">404</div>
        <h1>Pagina cautata nu mai exista</h1>
        <p className="nf-hero__lead">
          Poate a fost mutata sau link-ul contine o eroare. Mai jos gasesti cateva scurtaturi utile.
        </p>
        <form className="nf-search" onSubmit={search} role="search" aria-label="Cauta in catalog">
          <label htmlFor="nf-q" className="sr-only">Cauta produs</label>
          <input
            id="nf-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cauta un produs (ex: ganoderma, oleuropeina)..."
            className="nf-search__input"
            autoComplete="off"
          />
          <button type="submit" className="nf-search__btn">Cauta</button>
        </form>
        <div className="nf-links">
          <a href="/categorii" className="nf-links__item">Toate categoriile</a>
          <a href="/articole" className="nf-links__item">Articole</a>
          <a href="/intrebari-frecvente" className="nf-links__item">Intrebari frecvente</a>
          <a href="/contact" className="nf-links__item">Contact</a>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__title">Explorare categorii</h2>
          <div className="cat-page-grid">
            {categories.map((cat) => (
              <a key={cat.id} href={`/produse/${cat.slug}`} className="cat-page-card">
                {cat.image_url && (
                  <img src={cat.image_url} alt={cat.name} className="cat-page-card__img" loading="lazy" />
                )}
                <div className="cat-page-card__info">
                  <h3>{cat.name}</h3>
                  {cat.product_count ? <span>{cat.product_count} produse</span> : null}
                </div>
              </a>
            ))}
          </div>
        </section>
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
