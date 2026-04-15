"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface ProductData {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  r2_image_url: string;
  short_description: string;
  description: string;
  price: number;
  category_slugs: string[];
  source_url?: string;
  sku?: string;
  stock_status?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  product_count: number;
}

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [prod, setProd] = useState<ProductData | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgPreview, setImgPreview] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const auth = typeof window !== "undefined" ? sessionStorage.getItem("admin_auth") || "" : "";

  useEffect(() => {
    fetch(`/api/admin/products/${id}`, { headers: { Authorization: auth } })
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setProd(data);
          setSelectedSlugs(new Set(data.category_slugs || []));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, auth]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllCategories(data); })
      .catch(console.error);
  }, []);

  const handleImageFile = (f: File) => { setImgFile(f); setImgPreview(URL.createObjectURL(f)); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleImageFile(f); };

  const toggleCategory = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  };

  const handleSave = async () => {
    if (!prod) return;
    setSaving(true); setSaved(false);

    let imageUrl = prod.r2_image_url || prod.image_url;
    if (imgFile) {
      const fd = new FormData(); fd.append("file", imgFile);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.url) imageUrl = d.url;
    }

    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price: prod.price,
        image_url: imageUrl,
        r2_image_url: imageUrl,
        short_description: prod.short_description,
        description: prod.description,
        category_slugs: Array.from(selectedSlugs),
        source_url: prod.source_url || "",
        sku: prod.sku || "",
        stock_status: prod.stock_status || "",
        meta_title: prod.meta_title,
        meta_description: prod.meta_description,
        keywords: prod.keywords,
      }),
    });

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="admin-wrap"><p className="admin-loading">Se incarca...</p></div>;
  if (!prod) return <div className="admin-wrap"><p>Produsul nu a fost gasit.</p></div>;

  return (
    <div className="admin-wrap">
      <div className="admin-edit-header">
        <button className="admin-back-btn" onClick={() => router.back()}>← Inapoi</button>
        <h1>Editeaza: {prod.name}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ color: "var(--color-success)", fontSize: "0.82rem", fontWeight: 600 }}>Salvat!</span>}
          {prod && selectedSlugs.size > 0 && (
            <a className="admin-back-btn" href={`/produse/${Array.from(selectedSlugs)[0]}/${prod.slug}`} target="_blank" rel="noopener">Vezi produs</a>
          )}
          <button className="admin-add-btn" onClick={handleSave} disabled={saving}>{saving ? "Se salveaza..." : "Salveaza"}</button>
        </div>
      </div>

      <div className="admin-edit-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="admin-edit-card">
            <h3>Imagine produs</h3>
            <div
              className={`admin-edit-dropzone ${dragOver ? "admin-edit-dropzone--active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {(imgPreview || prod.r2_image_url || prod.image_url) ? (
                <img src={imgPreview || prod.r2_image_url || prod.image_url} alt="Preview" className="admin-edit-dropzone__img" />
              ) : (
                <span>Trage o imagine sau click</span>
              )}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} className="admin-edit-dropzone__input" />
            </div>
            <div className="admin-edit-field" style={{ marginTop: 12 }}>
              <label>Pret (RON)</label>
              <input type="number" value={prod.price} onChange={(e) => setProd({ ...prod, price: Number(e.target.value) })} />
            </div>
            <div className="admin-edit-field">
              <label>SKU</label>
              <input type="text" value={prod.sku || ""} onChange={(e) => setProd({ ...prod, sku: e.target.value })} />
            </div>
            <div className="admin-edit-field">
              <label>Stock status</label>
              <input type="text" value={prod.stock_status || ""} onChange={(e) => setProd({ ...prod, stock_status: e.target.value })} placeholder="instock, outofstock" />
            </div>
            <div className="admin-edit-field">
              <label>URL original mysnep</label>
              <input type="url" value={prod.source_url || ""} onChange={(e) => setProd({ ...prod, source_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div className="admin-edit-card">
            <h3>Categorii</h3>
            <div className="admin-cat-list">
              {allCategories.map((cat) => (
                <label key={cat.id} className="admin-cat-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSlugs.has(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  <span>{cat.name}</span>
                  <span className="admin-cat-checkbox__count">({cat.product_count})</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="admin-edit-card">
            <h3>Detalii</h3>
            <div className="admin-edit-field">
              <label>Nume</label>
              <input type="text" value={prod.name} onChange={(e) => setProd({ ...prod, name: e.target.value })} />
            </div>
            <div className="admin-edit-field">
              <label>Slug (URL)</label>
              <input type="text" value={prod.slug} onChange={(e) => setProd({ ...prod, slug: e.target.value })} />
            </div>

            <div className="admin-edit-field">
              <label>Descriere scurta</label>
              <ReactQuill theme="snow" value={prod.short_description || ""} onChange={(val: string) => setProd({ ...prod, short_description: val })} modules={quillModules} />
            </div>

            <div className="admin-edit-field" style={{ marginTop: 12 }}>
              <label>Descriere completa</label>
              <ReactQuill theme="snow" value={prod.description || ""} onChange={(val: string) => setProd({ ...prod, description: val })} modules={quillModules} />
            </div>
          </div>

          <div className="admin-edit-card">
            <h3>SEO</h3>
            <div className="admin-edit-field">
              <label>Meta Title</label>
              <input type="text" value={prod.meta_title || ""} onChange={(e) => setProd({ ...prod, meta_title: e.target.value })} placeholder={`${prod.name} | olivox.ro`} />
            </div>
            <div className="admin-edit-field">
              <label>Meta Description</label>
              <textarea rows={3} value={prod.meta_description || ""} onChange={(e) => setProd({ ...prod, meta_description: e.target.value })} />
            </div>
            <div className="admin-edit-field">
              <label>Keywords</label>
              <input type="text" value={prod.keywords || ""} onChange={(e) => setProd({ ...prod, keywords: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
