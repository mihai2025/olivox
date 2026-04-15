"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Product {
  id: number;
  name: string;
  slug: string;
  r2_image_url: string;
  image_url: string;
  price: number;
  currency?: string;
  short_description: string;
  description: string;
  ingredients?: string | null;
  warnings?: string | null;
  datasheet_r2_url?: string | null;
  datasheet_url?: string | null;
  category_slugs: string[];
  sku?: string | null;
  quantity?: string | null;
  points?: number | null;
  stock_status?: string | null;
}

export default function ProductPage() {
  const params = useParams();
  const productSlug = params.product as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState("");
  const [shippingMethod, setShippingMethod] = useState("Sameday curier");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/products?slug=${encodeURIComponent(productSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data?.product || (Array.isArray(data?.products) ? data.products[0] : null) || data;
        if (p && p.id) setProduct(p as Product);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          product_slug: product.slug,
          quantity,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          address,
          observations,
          shipping_method: shippingMethod,
          order_value: Number(product.price) * Number(quantity),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Eroare la plasarea comenzii");
      }
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Eroare");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="products-loading">Se incarca...</div>;
  if (!product) return <div className="products-loading">Produsul nu a fost gasit.</div>;

  const image = product.r2_image_url || product.image_url;
  const currency = product.currency || "RON";
  const total = Number(product.price) * Number(quantity);
  const inStock = product.stock_status !== "out_of_stock";

  return (
    <div className="pd-wrap">
      <section className="pd-hero">
        <div className="pd-hero__media">
          {image && <img src={image} alt={product.name} className="pd-hero__img" />}
        </div>

        <div className="pd-hero__info">
          <div className="pd-hero__meta">
            {product.sku && <span className="pd-hero__sku">Cod: {product.sku}</span>}
            {product.quantity && <span className="pd-hero__qty">{product.quantity}</span>}
            <span className={`pd-hero__stock ${inStock ? "is-in" : "is-out"}`}>
              {inStock ? "In stoc" : "Indisponibil"}
            </span>
          </div>

          <h1 className="pd-hero__name">{product.name}</h1>

          {product.short_description && (
            <p className="pd-hero__short">{product.short_description.replace(/<[^>]+>/g, "")}</p>
          )}

          <div className="pd-hero__price-row">
            <div className="pd-hero__price">
              {Number(product.price).toFixed(2).replace(".", ",")} <span className="pd-hero__currency">{currency}</span>
            </div>
          </div>
        </div>
      </section>

      {success ? (
        <div className="pd-success">
          <h3>Multumim pentru comanda!</h3>
          <p>Te contactam in cel mai scurt timp pentru confirmare.</p>
        </div>
      ) : (
        <form className="pd-form pd-form--stacked" onSubmit={handleSubmit}>
          <div className="eyebrow">Plaseaza comanda</div>
          <div className="pd-form__grid">
            <div className="pd-form__row">
              <label>Nume complet *</label>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="pd-form__row">
              <label>Telefon *</label>
              <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
            <div className="pd-form__row">
              <label>Email</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>
            <div className="pd-form__row">
              <label>Metoda livrare</label>
              <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
                <option value="Sameday curier">Sameday curier</option>
                <option value="Sameday easybox">Sameday easybox</option>
              </select>
            </div>
            <div className="pd-form__row pd-form__row--full">
              <label>Adresa livrare *</label>
              <textarea required rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Judet, localitate, strada, numar" />
            </div>
            <div className="pd-form__row">
              <label>Cantitate</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
            </div>
            <div className="pd-form__row pd-form__row--full">
              <label>Observatii</label>
              <textarea rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} />
            </div>
          </div>

          <div className="pd-form__summary">
            <span>Total</span>
            <strong>{total.toFixed(2).replace(".", ",")} {currency}</strong>
          </div>
          {errorMsg && <p className="pd-form__error">{errorMsg}</p>}
          <button type="submit" className="pd-form__submit" disabled={submitting || !inStock}>
            {submitting ? "Se trimite..." : inStock ? "Comanda acum" : "Indisponibil momentan"}
          </button>
        </form>
      )}

      <div className="pd-cards">
        {product.description && (
          <article className="pd-card">
            <div className="eyebrow">Descriere</div>
            <div className="pd-card__body" dangerouslySetInnerHTML={{ __html: product.description }} />
          </article>
        )}
        {product.ingredients && (
          <article className="pd-card">
            <div className="eyebrow">Ce este inauntru</div>
            <div className="pd-card__body" dangerouslySetInnerHTML={{ __html: product.ingredients }} />
          </article>
        )}
        {product.warnings && (
          <article className="pd-card pd-card--warn">
            <div className="eyebrow">Avertismente</div>
            <div className="pd-card__body" dangerouslySetInnerHTML={{ __html: product.warnings }} />
          </article>
        )}
        {(product.datasheet_r2_url || product.datasheet_url) && (
          <article className="pd-card">
            <div className="eyebrow">Specificatii tehnice</div>
            <a href={product.datasheet_r2_url || product.datasheet_url || "#"} target="_blank" rel="noopener" className="pd-card__pdf">
              Descarca fisa produs (PDF)
            </a>
          </article>
        )}
      </div>
    </div>
  );
}
