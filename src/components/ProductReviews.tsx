"use client";

import { useEffect, useState } from "react";

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Aggregate {
  count: number;
  average: number;
}

export default function ProductReviews({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/reviews?product_id=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setAggregate(data.aggregate || null);
      })
      .catch(() => {});
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!formName.trim()) { setErrorMsg("Te rugam introdu numele."); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          customer_name: formName.trim(),
          rating: formRating,
          comment: formComment.trim(),
          email: formEmail.trim(),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErrorMsg(data.error || "Eroare la trimiterea recenziei.");
      } else {
        setSuccessMsg(data.message || "Multumim! Recenzia va fi publicata dupa moderare.");
        setFormName(""); setFormRating(5); setFormComment(""); setFormEmail("");
        setShowForm(false);
      }
    } catch {
      setErrorMsg("Eroare de retea. Incearca din nou.");
    } finally {
      setSubmitting(false);
    }
  };

  const stars = (n: number) => "\u2605".repeat(Math.round(n)) + "\u2606".repeat(5 - Math.round(n));

  return (
    <section className="content-section reviews-section" style={{ marginTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Recenzii</h2>
        <button className="btn-review-toggle" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Anuleaza" : "Scrie o recenzie"}
        </button>
      </div>

      {aggregate && aggregate.count > 0 && (
        <div className="review-aggregate">
          <span className="review-aggregate__stars">{stars(aggregate.average)}</span>
          <strong>{aggregate.average}</strong> din 5 &mdash; {aggregate.count} {aggregate.count === 1 ? "recenzie" : "recenzii"}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="review-form">
          <div className="review-form__row">
            <label>Nume *</label>
            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} maxLength={100} required />
          </div>
          <div className="review-form__row">
            <label>Rating</label>
            <div className="review-form__stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className={`review-form__star ${formRating >= n ? "review-form__star--on" : ""}`} onClick={() => setFormRating(n)} aria-label={`${n} stele`}>
                  &#9733;
                </button>
              ))}
            </div>
          </div>
          <div className="review-form__row">
            <label>Email (optional, nu se publica)</label>
            <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} maxLength={200} />
          </div>
          <div className="review-form__row">
            <label>Recenzia ta</label>
            <textarea rows={4} value={formComment} onChange={(e) => setFormComment(e.target.value)} maxLength={2000} placeholder="Descrie experienta ta cu acest produs..." />
          </div>
          {errorMsg && <p className="review-form__error">{errorMsg}</p>}
          <button type="submit" className="btn-review-submit" disabled={submitting}>
            {submitting ? "Se trimite..." : "Trimite recenzia"}
          </button>
        </form>
      )}

      {successMsg && <p className="review-success">{successMsg}</p>}

      {reviews.length === 0 && !showForm && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>Nicio recenzie inca. Fii primul care lasa una!</p>
      )}

      {reviews.length > 0 && (
        <ul className="reviews-list">
          {reviews.map((r) => (
            <li key={r.id} className="review-item">
              <div className="review-item__header">
                <strong className="review-item__name">{r.customer_name}</strong>
                <span className="review-item__stars">{stars(r.rating)}</span>
                <span className="review-item__date">{new Date(r.created_at).toLocaleDateString("ro-RO")}</span>
              </div>
              {r.comment && <p className="review-item__comment">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
