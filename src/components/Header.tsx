"use client";

import { useState, useEffect, useRef } from "react";
import { useConfig } from "@/lib/use-config";

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
}

export default function Header() {
  const config = useConfig();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length >= 2) {
      window.location.href = `/cautare?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const toggleSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const check = () => {
      const el = navRef.current;
      if (el) setShowOverflow(el.scrollWidth > el.clientWidth + 10);
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [categories]);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a href="/" className="site-header__logo" dangerouslySetInnerHTML={{ __html: config.logoHtml }} />
          <div className={`site-search ${searchOpen ? "site-search--open" : ""}`}>
            <button className="site-search__icon" onClick={toggleSearch} type="button" aria-label="Cauta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <input ref={searchInputRef} type="text" className="site-search__input" placeholder="Cauta produs..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(); if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }} />
          </div>
          <nav className="site-header__links" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="/articole" className="site-header__link">Articole</a>
            <a href="/contact" className="site-header__link">Contact</a>
          </nav>
        </div>

        {categories.length > 0 && (
          <div className="cat-nav-wrap">
            <nav className="cat-nav" ref={navRef}>
              <div className="cat-nav__list">
                {isMobile ? (
                  <button className="cat-nav__item cat-nav__all" onClick={() => setShowModal(true)}>
                    CATEGORII
                  </button>
                ) : (
                  <a href="/categorii" className="cat-nav__item cat-nav__all">
                    CATEGORII
                  </a>
                )}
                {categories.map((cat) => (
                  <a key={cat.id} href={`/produse/${cat.slug}`} className="cat-nav__item">
                    {cat.name}
                  </a>
                ))}
              </div>
            </nav>
            {showOverflow && (
              <button className="cat-nav__fade" onClick={() => isMobile ? setShowModal(true) : window.location.href = "/categorii"} title="Mai multe categorii">
                ›
              </button>
            )}
          </div>
        )}
      </header>

      {showModal && (
        <div className="cat-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal__header">
              <h3>Categorii</h3>
              <button className="cat-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="cat-modal__grid">
              {categories.map((cat) => (
                <a key={cat.id} href={`/produse/${cat.slug}`} className="cat-modal__item">
                  {cat.image_url && <img src={cat.image_url} alt={cat.name} className="cat-modal__img" />}
                  <span className="cat-modal__name">{cat.name}</span>
                  <span className="cat-modal__count">{cat.product_count}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
