"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface CategoryData {
  id: number;
  woo_id: number;
  name: string;
  slug: string;
  image_url: string;
  description: string;
  product_count: number;
  sort_order: number;
  meta_title?: string;
  meta_description?: string;
  seo_text?: string;
}

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cat, setCat] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgPreview, setImgPreview] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Cross-sell
  const [crossSells, setCrossSells] = useState<Array<{id: number; target_product_id: number; product: {id: number; name: string; price: number; r2_image_url?: string; image_url?: string} | null}>>([]);
  const [csSearch, setCsSearch] = useState("");
  const [csResults, setCsResults] = useState<Array<{id: number; name: string; price: number; r2_image_url?: string; image_url?: string}>>([]);
  const [csSearching, setCsSearching] = useState(false);

  const auth = typeof window !== "undefined" ? sessionStorage.getItem("admin_auth") || "" : "";

  useEffect(() => {
    fetch(`/api/admin/categories/${id}`, { headers: { Authorization: auth } })
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setCat(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, auth]);

  // Load cross-sells for this category
  useEffect(() => {
    if (!auth || !id) return;
    fetch(`/api/admin/cross-sells?source_type=category&source_id=${id}`, { headers: { Authorization: auth } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCrossSells(data); })
      .catch(console.error);
  }, [auth, id]);

  const searchCsProducts = (query: string) => {
    setCsSearch(query);
    if (!query.trim()) { setCsResults([]); return; }
    setCsSearching(true);
    fetch(`/api/products?search=${encodeURIComponent(query)}&per_page=8`)
      .then((r) => r.json())
      .then((data) => {
        const existing = new Set(crossSells.map((cs) => cs.target_product_id));
        setCsResults((data.products || []).filter((p: {id: number}) => !existing.has(p.id)));
      })
      .catch(console.error)
      .finally(() => setCsSearching(false));
  };

  const addCs = async (targetId: number) => {
    await fetch("/api/admin/cross-sells", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ source_type: "category", source_id: Number(id), target_product_id: targetId }),
    });
    setCsSearch(""); setCsResults([]);
    const r = await fetch(`/api/admin/cross-sells?source_type=category&source_id=${id}`, { headers: { Authorization: auth } });
    const data = await r.json();
    if (Array.isArray(data)) setCrossSells(data);
  };

  const removeCs = async (csId: number) => {
    await fetch(`/api/admin/cross-sells?id=${csId}`, { method: "DELETE", headers: { Authorization: auth } });
    setCrossSells((prev) => prev.filter((cs) => cs.id !== csId));
  };

  const handleImageFile = (f: File) => { setImgFile(f); setImgPreview(URL.createObjectURL(f)); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleImageFile(f); };

  const handleSave = async () => {
    if (!cat) return;
    setSaving(true); setSaved(false);

    let imageUrl = cat.image_url;
    if (imgFile) {
      const fd = new FormData(); fd.append("file", imgFile);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.url) imageUrl = d.url;
    }

    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image_url: imageUrl,
        description: cat.description,
        sort_order: cat.sort_order,
        meta_title: cat.meta_title,
        meta_description: cat.meta_description,
        seo_text: cat.seo_text || "",
      }),
    });

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="admin-wrap"><p className="admin-loading">Se incarca...</p></div>;
  if (!cat) return <div className="admin-wrap"><p>Categoria nu a fost gasita.</p></div>;

  return (
    <div className="admin-wrap">
      <div className="admin-edit-header">
        <button className="admin-back-btn" onClick={() => router.back()}>← Inapoi</button>
        <h1>Editeaza: {cat.name}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ color: "var(--color-success)", fontSize: "0.82rem", fontWeight: 600 }}>Salvat!</span>}
          <button className="admin-add-btn" onClick={handleSave} disabled={saving}>{saving ? "Se salveaza..." : "Salveaza"}</button>
        </div>
      </div>

      <div className="admin-edit-grid">
        {/* Left: image */}
        <div className="admin-edit-card">
          <h3>Imagine categorie</h3>
          <div
            className={`admin-edit-dropzone ${dragOver ? "admin-edit-dropzone--active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {(imgPreview || cat.image_url) ? (
              <img src={imgPreview || cat.image_url} alt="Preview" className="admin-edit-dropzone__img" />
            ) : (
              <span>Trage o imagine sau click</span>
            )}
            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} className="admin-edit-dropzone__input" />
          </div>
        </div>

        {/* Right: fields */}
        <div className="admin-edit-card">
          <h3>Detalii categorie</h3>
          <div className="admin-edit-field">
            <label>Nume</label>
            <input type="text" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} />
          </div>
          <div className="admin-edit-field">
            <label>Slug (URL)</label>
            <input type="text" value={cat.slug} onChange={(e) => setCat({ ...cat, slug: e.target.value })} />
          </div>
          <div className="admin-edit-field">
            <label>Descriere</label>
            <textarea rows={4} value={cat.description || ""} onChange={(e) => setCat({ ...cat, description: e.target.value })} />
          </div>
          <div className="admin-edit-field">
            <label>Ordine sortare (mai mare = prima)</label>
            <input type="number" value={cat.sort_order} onChange={(e) => setCat({ ...cat, sort_order: Number(e.target.value) })} />
          </div>

          <h3 style={{ marginTop: 20 }}>SEO</h3>
          <div className="admin-edit-field">
            <label>Meta Title</label>
            <input type="text" value={cat.meta_title || ""} onChange={(e) => setCat({ ...cat, meta_title: e.target.value })} placeholder={`${cat.name} | Huse Personalizate`} />
          </div>
          <div className="admin-edit-field">
            <label>Meta Description</label>
            <textarea rows={3} value={cat.meta_description || ""} onChange={(e) => setCat({ ...cat, meta_description: e.target.value })} placeholder="Descriere SEO pentru Google..." />
          </div>
          <div className="admin-edit-field">
            <label>Text SEO extins (afisat in pagina, sub produse)</label>
            <textarea
              rows={10}
              value={cat.seo_text || ""}
              onChange={(e) => setCat({ ...cat, seo_text: e.target.value })}
              placeholder={`Scrie 300-500 cuvinte despre ${cat.name.toLowerCase()}: materiale, tehnologia de print, modele compatibile, beneficii, idei de personalizare, livrare. Acest text ajuta la pozitionarea pe Google pentru cuvintele cheie vizate.\n\nSuporta HTML: <p>, <h3>, <ul>, <li>, <strong>, <a>.`}
              style={{ fontFamily: "var(--font)", lineHeight: 1.6 }}
            />
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 4 }}>
              Suporta HTML. Apare in pagina categoriei sub grid-ul de produse.
            </p>
          </div>
        </div>
      </div>

      {/* Cross-sell for category */}
      <div className="admin-edit-card" style={{ marginTop: 16 }}>
        <h3>Cumpara impreuna cu (Cross-sell)</h3>
        <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
          Produsele asignate apar pe toate produsele din aceasta categorie.
        </p>
        <input
          type="text"
          placeholder="Cauta produs..."
          value={csSearch}
          onChange={(e) => searchCsProducts(e.target.value)}
          style={{ width: "100%", padding: "6px 10px", fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: 6, marginBottom: 8, background: "transparent" }}
        />
        {csSearching && <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Se cauta...</p>}
        {csResults.length > 0 && (
          <div style={{ border: "1px solid var(--color-border)", borderRadius: 6, marginBottom: 10, maxHeight: 200, overflowY: "auto" }}>
            {csResults.map((p) => (
              <button key={p.id} onClick={() => addCs(p.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", border: "none", borderBottom: "1px solid var(--color-border)", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: "0.78rem" }}>
                {(p.r2_image_url || p.image_url) && <img src={p.r2_image_url || p.image_url} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4 }} />}
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-accent)", fontWeight: 700 }}>{p.price} RON</span>
              </button>
            ))}
          </div>
        )}
        {crossSells.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>Niciun produs asignat.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {crossSells.map((cs) => cs.product && (
              <div key={cs.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: "0.78rem" }}>
                {(cs.product.r2_image_url || cs.product.image_url) && <img src={cs.product.r2_image_url || cs.product.image_url} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />}
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cs.product.name}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-accent)", fontWeight: 700 }}>{cs.product.price} RON</span>
                <button onClick={() => removeCs(cs.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "0.85rem" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
