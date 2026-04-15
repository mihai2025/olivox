"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

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

export default function NewProductPage() {
  const router = useRouter();
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [stockStatus, setStockStatus] = useState("instock");
  const [sourceUrl, setSourceUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  const auth = typeof window !== "undefined" ? sessionStorage.getItem("admin_auth") || "" : "";

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllCategories(data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!slug || slug === name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").slice(0, -1)) {
      setSlug(name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""));
    }
  }, [name, slug]);

  const handleImageFile = (f: File) => { setImgFile(f); setImgPreview(URL.createObjectURL(f)); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleImageFile(f); };

  const toggleCategory = (s: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    let imageUrl = "";
    if (imgFile) {
      const fd = new FormData(); fd.append("file", imgFile);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.url) imageUrl = d.url;
    }

    const finalSlug = slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

    await fetch("/api/admin/products", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        slug: finalSlug,
        price: Number(price) || 0,
        image_url: imageUrl,
        category_slugs: Array.from(selectedSlugs),
        template: "generic",
        sku,
        stock_status: stockStatus,
        source_url: sourceUrl,
        short_description: shortDescription,
        description,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords,
      }),
    });

    setSaving(false);
    router.push("/admin");
  };

  return (
    <div className="admin-wrap">
      <div className="admin-edit-header">
        <button className="admin-back-btn" onClick={() => router.push("/admin")}>← Inapoi</button>
        <h1>Produs nou</h1>
        <button className="admin-add-btn" onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Se salveaza..." : "Salveaza"}</button>
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
              {imgPreview ? (
                <img src={imgPreview} alt="Preview" className="admin-edit-dropzone__img" />
              ) : (
                <span>Trage o imagine sau click</span>
              )}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} className="admin-edit-dropzone__input" />
            </div>
            <div className="admin-edit-field" style={{ marginTop: 12 }}>
              <label>Pret (RON)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="admin-edit-field">
              <label>SKU</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="admin-edit-field">
              <label>Stock status</label>
              <input type="text" value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} />
            </div>
            <div className="admin-edit-field">
              <label>URL original mysnep</label>
              <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            </div>
          </div>

          <div className="admin-edit-card">
            <h3>Categorii</h3>
            <div className="admin-cat-list">
              {allCategories.map((cat) => (
                <label key={cat.id} className="admin-cat-checkbox">
                  <input type="checkbox" checked={selectedSlugs.has(cat.slug)} onChange={() => toggleCategory(cat.slug)} />
                  <span>{cat.name}</span>
                  <span className="admin-cat-checkbox__count">({cat.product_count})</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="admin-edit-card">
            <h3>Detalii produs</h3>
            <div className="admin-edit-field">
              <label>Nume</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele produsului" />
            </div>
            <div className="admin-edit-field">
              <label>Slug (URL)</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="admin-edit-field">
              <label>Descriere scurta</label>
              <ReactQuill theme="snow" value={shortDescription} onChange={setShortDescription} modules={quillModules} />
            </div>
            <div className="admin-edit-field" style={{ marginTop: 12 }}>
              <label>Descriere completa</label>
              <ReactQuill theme="snow" value={description} onChange={setDescription} modules={quillModules} />
            </div>
          </div>

          <div className="admin-edit-card">
            <h3>SEO</h3>
            <div className="admin-edit-field">
              <label>Meta Title</label>
              <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={`${name} | olivox.ro`} />
            </div>
            <div className="admin-edit-field">
              <label>Meta Description</label>
              <textarea rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
            <div className="admin-edit-field">
              <label>Keywords</label>
              <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
