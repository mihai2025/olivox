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
  short_description: string;
  description: string;
  category_slugs: string[];
  sku?: string | null;
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
  const total = Number(product.price) * Number(quantity);

  return (
    <div className="product-detail">
      <div className="product-detail__grid">
        <div className="product-detail__media">
          {image && <img src={image} alt={product.name} className="product-detail__img" />}
        </div>

        <div className="product-detail__info">
          <h1 className="product-detail__name">{product.name}</h1>
          <div className="product-detail__price">{product.price} RON</div>
          {product.short_description && (
            <div
              className="product-detail__short"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          )}

          {success ? (
            <div className="order-success">
              <h2>Multumim pentru comanda!</h2>
              <p>Comanda a fost inregistrata. Te vom contacta in cel mai scurt timp pentru confirmare.</p>
            </div>
          ) : (
            <form className="order-form" onSubmit={handleSubmit}>
              <div className="order-form__row">
                <label>Nume complet *</label>
                <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="order-form__row">
                <label>Telefon *</label>
                <input type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div className="order-form__row">
                <label>Email</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </div>
              <div className="order-form__row">
                <label>Adresa livrare *</label>
                <textarea required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Judet, localitate, strada, numar" />
              </div>
              <div className="order-form__row">
                <label>Cantitate</label>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
              </div>
              <div className="order-form__row">
                <label>Metoda livrare</label>
                <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
                  <option value="Sameday curier">Sameday curier</option>
                  <option value="Sameday easybox">Sameday easybox</option>
                </select>
              </div>
              <div className="order-form__row">
                <label>Observatii</label>
                <textarea rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} />
              </div>

              <div className="order-form__total">Total: <strong>{total} RON</strong></div>
              {errorMsg && <p className="order-form__error">{errorMsg}</p>}
              <button type="submit" className="btn-order" disabled={submitting}>
                {submitting ? "Se trimite..." : "Comanda acum"}
              </button>
            </form>
          )}
        </div>
      </div>

      {product.description && (
        <section className="content-section" style={{ marginTop: 32 }}>
          <h2>Descriere</h2>
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        </section>
      )}
    </div>
  );
}
