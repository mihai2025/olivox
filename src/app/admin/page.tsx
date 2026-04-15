"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConfig } from "@/lib/use-config";
import { DEFAULT_CONFIG } from "@/lib/site-config";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ===== TYPES =====
interface CustomFieldValue {
  value: string | boolean;
  label: string;
  type: string;
  option_label?: string;
  price_impact?: number;
  image_url?: string;
}

interface Order {
  id: number;
  brand_name: string;
  model_name: string;
  custom_name: string;
  product_name?: string;
  text_color: string;
  image_url: string;
  original_image_url: string;
  final_image_url: string;
  print_image_url?: string;
  design_image_url?: string;
  address: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  observations: string;
  status: string;
  awb_number: string;
  awb_status: string;
  fan_awb?: string;
  fan_status?: string;
  sd_awb?: string;
  sd_status?: string;
  eb_awb?: string;
  eb_status?: string;
  shipping_method: string;
  order_source: string;
  ramburs?: number;
  fgo_serie?: string;
  fgo_numar?: string;
  fgo_link?: string;
  custom_field_values?: Record<string, CustomFieldValue>;
  cross_sell_items?: Array<{ product_id: number; name: string; price: number; image_url?: string }>;
  product_category_slugs?: string[];
  order_value?: number;
  locker_id?: number | null;
  created_at: string;
}

interface Category {
  id: number;
  woo_id: number;
  name: string;
  slug: string;
  image_url: string;
  product_count: number;
  sort_order: number;
}

interface Product {
  id: number;
  woo_id: number;
  name: string;
  slug: string;
  r2_image_url: string;
  image_url: string;
  print_image_url?: string;
  price: number;
  category_slugs: string[];
  short_description: string;
}

const STATUSES = ["in procesare", "finalizata", "livrat", "anulata", "retur"];
const STATUS_COLORS: Record<string, string> = {
  "in procesare": "#f59e0b", finalizata: "#10b981", livrat: "#059669", anulata: "#6b7280", retur: "#dc2626",
};

type Tab = "dashboard" | "comenzi" | "categorii" | "produse" | "editor" | "homepage" | "recenzii" | "statistici" | "setari";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [authHeader, setAuthHeader] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [directOrderId, setDirectOrderId] = useState<number | null>(null);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order");
    if (orderId) { setDirectOrderId(Number(orderId)); setTab("comenzi"); }
    const saved = sessionStorage.getItem("admin_auth");
    if (saved) {
      setAuthHeader(saved); setLoggedIn(true);
      fetch("/api/admin/orders", { headers: { Authorization: saved } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) { setAllOrders(data); setNewOrdersCount(data.filter((o: Order) => o.status === "in procesare").length); } })
        .catch(() => {});
    }
  }, []);

  const handleLogin = async () => {
    const auth = "Basic " + btoa(`${user}:${pass}`);
    const res = await fetch("/api/admin/orders", { headers: { Authorization: auth } });
    if (res.ok) {
      setAuthHeader(auth); setLoggedIn(true); sessionStorage.setItem("admin_auth", auth);
      const data = await res.json();
      if (Array.isArray(data)) { setAllOrders(data); setNewOrdersCount(data.filter((o: Order) => o.status === "in procesare").length); }
    }
  };

  if (!loggedIn) {
    return (
      <div className="admin-login-wrap">
        <form className="admin-login" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <h1>Admin</h1>
          <p>olivox.ro</p>
          <input type="text" placeholder="Utilizator" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
          <input type="password" placeholder="Parola" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          <button type="submit">Intra</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <a href="/" className="admin-tab-icon" title="Site" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </a>
       {/* buton pagina dash
        <button className={`admin-tab-icon ${tab === "dashboard" ? "admin-tab-icon--active" : ""}`} onClick={() => setTab("dashboard")} title="Dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 6-6"/></svg>
        </button>*/}
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "comenzi" ? "admin-tab--active" : ""}`} onClick={() => { setTab("comenzi"); setOrdersRefreshKey(Date.now()); if (directOrderId) { setDirectOrderId(null); window.history.replaceState({}, "", "/admin"); } }}>
            Comenzi{newOrdersCount > 0 && <span className="admin-tab__badge">{newOrdersCount}</span>}
          </button>
          <button className={`admin-tab ${tab === "statistici" ? "admin-tab--active" : ""}`} onClick={() => setTab("statistici")}>
            <span className="admin-tab__text">Statistici</span>
            <svg className="admin-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </button>
          <button className={`admin-tab ${tab === "categorii" ? "admin-tab--active" : ""}`} onClick={() => setTab("categorii")}>
            <span className="admin-tab__text">Categorii</span>
            <svg className="admin-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button className={`admin-tab ${tab === "produse" ? "admin-tab--active" : ""}`} onClick={() => setTab("produse")}>
            <span className="admin-tab__text">Produse</span>
            <svg className="admin-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
          </button>
<button className={`admin-tab ${tab === "homepage" ? "admin-tab--active" : ""}`} onClick={() => setTab("homepage")}>
            <span className="admin-tab__text">Homepage</span>
            <svg className="admin-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
          <button className={`admin-tab ${tab === "recenzii" ? "admin-tab--active" : ""}`} onClick={() => setTab("recenzii")}>
            <span className="admin-tab__text">Recenzii</span>
            <svg className="admin-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <button className={`admin-tab-icon ${tab === "setari" ? "admin-tab-icon--active" : ""}`} onClick={() => setTab("setari")} title="Setari">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
        </div>
        <button className="admin-logout" onClick={() => { setLoggedIn(false); sessionStorage.removeItem("admin_auth"); }} title="Deconectare">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>

      {tab === "dashboard" && <DashboardPanel orders={allOrders} onNavigate={setTab} />}
      {tab === "comenzi" && <OrdersPanel key={`${directOrderId || "list"}-${ordersRefreshKey}`} auth={authHeader} onCountUpdate={(n) => { setNewOrdersCount(n); }} onOrdersLoaded={setAllOrders} initialOrderId={directOrderId} />}
      {tab === "statistici" && <StatisticsPanel orders={allOrders} />}
      {tab === "categorii" && <CategoriesPanel auth={authHeader} />}
      {tab === "produse" && <ProductsPanel auth={authHeader} />}
      {tab === "editor" && <EditorPanel auth={authHeader} />}
      {tab === "homepage" && <HomepagePanel auth={authHeader} />}
      {tab === "recenzii" && <ReviewsPanel auth={authHeader} />}
      {tab === "setari" && <SettingsPanel auth={authHeader} />}
    </div>
  );
}

// ===== HELPERS =====
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(2);
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

function parseAddress(addr: string) {
  const parts = addr?.split(",").map((s) => s.trim()) || [];
  return { street: parts[0] || addr || "", locality: parts[1] || "", county: parts[2] || "" };
}

// ===== ORDERS PANEL =====
function OrdersPanel({ auth, onCountUpdate, onOrdersLoaded, initialOrderId }: { auth: string; onCountUpdate: (n: number) => void; onOrdersLoaded: (orders: Order[]) => void; initialOrderId?: number | null }) {
  const config = useConfig();
  const isDirectPage = !!initialOrderId;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "id">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(initialOrderId || null);
  const [lightboxImg, setLightboxImg] = useState("");
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxNames, setLightboxNames] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const perPage = 20;

  const onCountRef = useRef(onCountUpdate);
  const onLoadedRef = useRef(onOrdersLoaded);
  onCountRef.current = onCountUpdate;
  onLoadedRef.current = onOrdersLoaded;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/orders", { headers: { Authorization: auth } });
    if (res.ok) { const data = await res.json(); if (Array.isArray(data)) { setOrders(data); onLoadedRef.current(data); onCountRef.current(data.filter((o: Order) => o.status === "in procesare").length); } }
    setLoading(false);
  }, [auth]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/admin/orders", { method: "PATCH", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchOrders();
  };

  const [refreshingCourier, setRefreshingCourier] = useState(false);
  const refreshCourierStatus = async () => {
    setRefreshingCourier(true);
    try {
      await fetch("/api/cron", { headers: { Authorization: auth } });
      await fetchOrders();
    } catch {}
    setRefreshingCourier(false);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const deleteOrder = async (id: number) => {
    await fetch("/api/admin/orders", { method: "DELETE", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setDeleteConfirmId(null);
    fetchOrders();
  };

  const getClientHistory = useCallback((order: Order): Order[] => {
    // Find ALL orders from same client (transitive: phone OR email match chain)
    const clientIds = new Set<number>([order.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const o of orders) {
        if (clientIds.has(o.id)) continue;
        const isMatch = [...clientIds].some((id) => {
          const existing = orders.find((x) => x.id === id);
          if (!existing) return false;
          const p1 = (existing.customer_phone || "").trim();
          const p2 = (o.customer_phone || "").trim();
          const e1 = (existing.customer_email || "").trim();
          const e2 = (o.customer_email || "").trim();
          return (p1 && p2 && p1 === p2) || (e1 && e2 && e1 === e2);
        });
        if (isMatch) { clientIds.add(o.id); changed = true; }
      }
    }
    clientIds.delete(order.id);
    return orders.filter((o) => clientIds.has(o.id)).sort((a, b) => b.id - a.id);
  }, [orders]);

  // Filter + search
  const filtered = orders.filter((o) => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const all = `${o.id} ${o.customer_name} ${o.customer_phone} ${o.customer_email} ${o.brand_name} ${o.model_name} ${o.address} ${o.awb_number} ${o.observations}`.toLowerCase();
    return all.includes(q);
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "id") return (a.id - b.id) * dir;
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  // Paginate
  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (col: "date" | "id") => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  // Direct page mode: show only the order, no table/filters
  if (isDirectPage) {
    if (loading) return <p className="admin-loading">Se incarca...</p>;
    const order = orders.find((o) => o.id === expandedId);
    if (!order) return <p className="admin-loading">Comanda #{expandedId} nu a fost gasita.</p>;
    // Set browser tab title
    document.title = `${order.id} - ${order.customer_name}`;
    const history = getClientHistory(order);
    return (
      <div className="ot-page">
        <div className="ot-page__header">
          <button className="admin-back-btn" onClick={() => window.close()}>← Inchide</button>
          <h2>Comanda #{order.id} — {order.customer_name} — {new Date(order.created_at).toLocaleDateString("ro-RO")} {new Date(order.created_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</h2>
          <div className="ot-page__header-right">
            <div className="admin-status-btns admin-status-btns--header">
              {STATUSES.map((s) => (
                <button key={s} className={`admin-status-btn ${order.status === s ? "admin-status-btn--active" : ""}`} style={order.status === s ? { background: STATUS_COLORS[s], color: "#fff" } : {}} onClick={() => updateStatus(order.id, s)}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="ot-page__body">
          <div className="admin-order__grid">
            <div className="admin-order__details">
              <OrderDetails order={order} auth={auth} onUpdate={fetchOrders} />
              {history.length > 0 && (
                <>
                  <h3>Comenzile clientului</h3>
                  <div className="ot-history-list">
                    {history.map((h) => (
                      <button key={h.id} className="ot-history-item" style={h.status === "finalizata" || h.status === "livrat" ? { color: "#10b981" } : h.status === "retur" ? { color: "#dc2626" } : h.status === "anulata" || h.status === "anulat" ? { textDecoration: "line-through" } : {}} onClick={() => window.open(`/admin?order=${h.id}`, "_blank")}>
                        #{h.id} — {new Date(h.created_at).toLocaleDateString("ro-RO")} — {h.brand_name} {h.model_name} ({h.status})
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="admin-status-btns admin-status-btns--mobile">
                {STATUSES.map((s) => (
                  <button key={s} className={`admin-status-btn ${order.status === s ? "admin-status-btn--active" : ""}`} style={order.status === s ? { background: STATUS_COLORS[s], color: "#fff" } : {}} onClick={() => updateStatus(order.id, s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="admin-order__images">
              <OrderImages order={order} auth={auth} onUpdate={fetchOrders} onLightbox={(imgs, names, idx, url) => { setLightboxImages(imgs); setLightboxNames(names); setLightboxIdx(idx); setLightboxImg(url); }} />
              <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 16, paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ margin: 0 }}>Livrare</h3>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.5px", color: "#fff", background: order.shipping_method === "fancourier" ? "#e94560" : "#0066cc" }}>
                      {order.shipping_method === "easybox" ? "Easybox" : order.shipping_method === "sameday" ? "Sameday" : "FanCourier"}
                    </span>
                  </div>
                  <RambursField order={order} auth={auth} onUpdate={fetchOrders} />
                </div>
                <hr style={{ border: "none", borderTop: "1.5px solid var(--color-border)", margin: "12px 0" }} />
                <AwbSection order={order} auth={auth} onUpdate={fetchOrders} />
              </div>
            </div>
          </div>
        </div>
        {lightboxImg && (
          <div className="admin-lightbox" onClick={() => setLightboxImg("")}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }} onClick={(e) => e.stopPropagation()}>
              {lightboxImages.length > 1 && (
                <button onClick={() => { const ni = (lightboxIdx - 1 + lightboxImages.length) % lightboxImages.length; setLightboxIdx(ni); setLightboxImg(lightboxImages[ni]); }}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 28, width: 40, height: 40, borderRadius: "50%", cursor: "pointer", flexShrink: 0 }}>&#8249;</button>
              )}
              <div style={{ position: "relative" }}>
                <img src={lightboxImg} alt="Preview" style={{ maxHeight: "80vh", maxWidth: "80vw", borderRadius: 8 }} />
                <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                  <button onClick={() => {
                    const sn = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[șȘ]/g, "s").replace(/[țȚ]/g, "t").replace(/[ăĂ]/g, "a").replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
                    const name = `${order.id}_${sn(order.customer_name)}_${order.product_name ? sn(order.product_name) : ""}_${lightboxNames[lightboxIdx] || "imagine"}${order.brand_name ? `_${sn(order.brand_name)}` : ""}${order.model_name ? `_${sn(order.model_name)}` : ""}.jpg`.replace(/_+/g, "_").replace(/_\./g, ".");
                    fetch(`/api/proxy-image?url=${encodeURIComponent(lightboxImg)}`).then(r => r.blob()).then(blob => {
                      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
                    });
                  }} style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, backdropFilter: "blur(4px)" }}>
                    ↓ Descarca
                  </button>
                  <button onClick={() => setLightboxImg("")}
                    style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontSize: 16, backdropFilter: "blur(4px)" }}>✕</button>
                </div>
                {lightboxImages.length > 1 && (
                  <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 10px", borderRadius: 12, fontSize: "0.72rem" }}>
                    {lightboxNames[lightboxIdx] || ""} — {lightboxIdx + 1} / {lightboxImages.length}
                  </div>
                )}
              </div>
              {lightboxImages.length > 1 && (
                <button onClick={() => { const ni = (lightboxIdx + 1) % lightboxImages.length; setLightboxIdx(ni); setLightboxImg(lightboxImages[ni]); }}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 28, width: 40, height: 40, borderRadius: "50%", cursor: "pointer", flexShrink: 0 }}>&#8250;</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="ot-filters">
        <input className="ot-search" placeholder="Cauta in comenzi..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div className="ot-status-filters">
          <button className={`ot-sf ${!filterStatus ? "ot-sf--all" : ""}`} onClick={() => { setFilterStatus(""); setPage(1); }}>Toate ({orders.length})</button>
          {STATUSES.map((s) => {
            const c = orders.filter((o) => o.status === s).length;
            if (c === 0) return null;
            return <button key={s} className={`ot-sf ${filterStatus === s ? "ot-sf--active" : ""}`} style={filterStatus === s ? { background: STATUS_COLORS[s], color: "#fff" } : {}} onClick={() => { setFilterStatus(s); setPage(1); }}>{s} ({c})</button>;
          })}
          <button className="ot-sf" onClick={refreshCourierStatus} disabled={refreshingCourier} title="Refresh status curieri" style={{ marginLeft: 8, fontSize: "0.85rem", opacity: refreshingCourier ? 0.5 : 1 }}>{refreshingCourier ? "..." : "↻"}</button>
        </div>
      </div>

      {loading ? <p className="admin-loading">Se incarca...</p> : (
        <>
          <div className="ot-wrap">
            <table className="ot">
              <thead>
                <tr>
                  <th className="ot-sortable" onClick={() => toggleSort("id")}>Comanda {sortBy === "id" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                  <th className="ot-sortable" onClick={() => toggleSort("date")}>Data {sortBy === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                  <th>Total</th>
                  <th>Adresa livrare</th>
                  <th>Comenzi</th>
                  <th>Factura</th>
                  <th>Curier</th>
                  <th>Origine</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((order) => {
                  const addr = parseAddress(order.address);
                  const history = getClientHistory(order);
                  return (
                    <tr key={order.id} className={expandedId === order.id ? "ot-row--expanded" : ""} onClick={() => {
                      if (window.innerWidth >= 768) {
                        window.open(`/admin?order=${order.id}`, "_blank");
                      } else {
                        setExpandedId(expandedId === order.id ? null : order.id);
                      }
                    }}>
                      <td className="ot-cmd">
                        <strong>#{order.id}</strong>
                        <span>{order.customer_name}</span>
                        <span>{order.customer_phone}</span>
                      </td>
                      <td className="ot-date">
                        <span>{formatShortDate(order.created_at)}</span>
                        <span className="ot-badge" style={{ background: STATUS_COLORS[order.status] || "#6b7280" }}>{order.status}</span>
                      </td>
                      <td className="ot-total"><strong>{order.order_value || config.productPrice} {config.currency}</strong></td>
                      <td className="ot-addr">
                        <span>{addr.county}</span>
                        <span>{addr.locality}</span>
                        <span>{addr.street}</span>
                      </td>
                      <td><ClientHistory history={history} onOpen={setExpandedId} /></td>
                      <td>{order.fgo_numar ? (
                        <a href={order.fgo_link || "#"} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>{order.fgo_serie} {order.fgo_numar}</a>
                      ) : <span className="ot-muted">-</span>}</td>
                      <td className="ot-curier">
                        <span className="ot-shipping-badge" style={{ background: order.shipping_method === "easybox" ? "#0066cc" : order.shipping_method === "sameday" ? "#0066cc" : "#e94560", color: "#fff" }}>
                          {order.shipping_method === "easybox" ? "Easybox" : order.shipping_method === "sameday" ? "Sameday" : "FanCourier"}
                        </span>
                        {(order.fan_awb || order.sd_awb || order.eb_awb) ? (
                          <>
                            {order.fan_awb && <span style={{ fontSize: "0.58rem", color: "#e94560" }}>FC: {order.fan_awb}{order.fan_status ? `-${order.fan_status}` : ""}</span>}
                            {order.sd_awb && <span style={{ fontSize: "0.58rem", color: "#0066cc" }}>SD: {order.sd_awb}{order.sd_status ? `-${order.sd_status}` : ""}</span>}
                            {order.eb_awb && <span style={{ fontSize: "0.58rem", color: "#0066cc" }}>EB: {order.eb_awb}{order.eb_status ? `-${order.eb_status}` : ""}</span>}
                          </>
                        ) : order.awb_number ? (
                          <span style={{ fontSize: "0.58rem" }}>{order.awb_number}{order.awb_status ? `-${order.awb_status}` : ""}</span>
                        ) : null}
                      </td>
                      <td className="ot-origin">{(() => {
                        try { const s = JSON.parse(order.order_source || "{}"); return s.label || "direct"; } catch { return order.order_source || "direct"; }
                      })()}</td>
                      <td>
                        <button className="ot-del" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(order.id); }} title="Sterge">✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Order detail modal (mobile only - desktop opens in new tab) */}
          {expandedId && (() => {
            const order = orders.find((o) => o.id === expandedId);
            if (!order) return null;
            const history = getClientHistory(order);
            return (
              <div className="ot-modal-overlay" onClick={() => setExpandedId(null)}>
                <div className="ot-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="ot-modal__header">
                    <h2>Comanda #{order.id} — {order.customer_name} — {new Date(order.created_at).toLocaleDateString("ro-RO")} {new Date(order.created_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</h2>
                    <div className="ot-modal__header-right">
                      <div className="admin-status-btns admin-status-btns--header">
                        {STATUSES.map((s) => (
                          <button key={s} className={`admin-status-btn ${order.status === s ? "admin-status-btn--active" : ""}`} style={order.status === s ? { background: STATUS_COLORS[s], color: "#fff" } : {}} onClick={() => updateStatus(order.id, s)}>{s}</button>
                        ))}
                      </div>
                      <button className="ot-modal__close" onClick={() => setExpandedId(null)}>✕</button>
                    </div>
                  </div>
                  <div className="ot-modal__body">
                    <div className="admin-order__grid">
                      <div className="admin-order__details">
                        <OrderDetails order={order} auth={auth} onUpdate={fetchOrders} />
                        {history.length > 0 && (
                          <>
                            <h3>Comenzile clientului</h3>
                            <div className="ot-history-list">
                              {history.map((h) => (
                                <button key={h.id} className="ot-history-item" style={h.status === "finalizata" || h.status === "livrat" ? { color: "#10b981" } : h.status === "retur" ? { color: "#dc2626" } : h.status === "anulata" || h.status === "anulat" ? { textDecoration: "line-through" } : {}} onClick={() => setExpandedId(h.id)}>
                                  #{h.id} — {new Date(h.created_at).toLocaleDateString("ro-RO")} — {h.brand_name} {h.model_name} ({h.status})
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                        <div className="admin-status-btns admin-status-btns--mobile">
                          {STATUSES.map((s) => (
                            <button key={s} className={`admin-status-btn ${order.status === s ? "admin-status-btn--active" : ""}`} style={order.status === s ? { background: STATUS_COLORS[s], color: "#fff" } : {}} onClick={() => updateStatus(order.id, s)}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div className="admin-order__images">
                        <OrderImages order={order} auth={auth} onUpdate={fetchOrders} onLightbox={(imgs, names, idx, url) => { setLightboxImages(imgs); setLightboxNames(names); setLightboxIdx(idx); setLightboxImg(url); }} />
                        <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 16, paddingTop: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <h3 style={{ margin: 0 }}>Livrare</h3>
                              <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.5px", color: "#fff", background: order.shipping_method === "fancourier" ? "#e94560" : "#0066cc" }}>
                                {order.shipping_method === "easybox" ? "Easybox" : order.shipping_method === "sameday" ? "Sameday" : "FanCourier"}
                              </span>
                            </div>
                            <RambursField order={order} auth={auth} onUpdate={fetchOrders} />
                          </div>
                          <hr style={{ border: "none", borderTop: "1.5px solid var(--color-border)", margin: "12px 0" }} />
                          <AwbSection order={order} auth={auth} onUpdate={fetchOrders} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 8 }}>
              <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
              <span className="pagination__info">{page}/{totalPages}</span>
              <button className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}

          {sorted.length === 0 && <p className="admin-empty">Nicio comanda gasita.</p>}

          {/* Image lightbox with navigation */}
          {lightboxImg && (
            <div className="admin-lightbox" onClick={() => setLightboxImg("")}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                {lightboxImages.length > 1 && lightboxIdx > 0 && (
                  <button onClick={() => { const ni = lightboxIdx - 1; setLightboxIdx(ni); setLightboxImg(lightboxImages[ni]); }}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, width: 36, height: 36, borderRadius: "50%", cursor: "pointer" }}>&#8249;</button>
                )}
                <div style={{ position: "relative" }}>
                  <img src={lightboxImg} alt="Preview" style={{ maxHeight: "75vh", maxWidth: "85vw", borderRadius: 8 }} />
                  <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                    <button onClick={() => {
                      const lbOrder = orders.find(o => o.id === expandedId);
                      const sn = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[șȘ]/g, "s").replace(/[țȚ]/g, "t").replace(/[ăĂ]/g, "a").replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
                      const name = lbOrder ? `${lbOrder.id}_${sn(lbOrder.customer_name)}_${lbOrder.product_name ? sn(lbOrder.product_name) : ""}_${lightboxNames[lightboxIdx] || "imagine"}${lbOrder.brand_name ? `_${sn(lbOrder.brand_name)}` : ""}${lbOrder.model_name ? `_${sn(lbOrder.model_name)}` : ""}.jpg`.replace(/_+/g, "_").replace(/_\./g, ".") : `${lightboxNames[lightboxIdx] || "imagine"}.jpg`;
                      fetch(`/api/proxy-image?url=${encodeURIComponent(lightboxImg)}`).then(r => r.blob()).then(blob => {
                        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
                      });
                    }} style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, backdropFilter: "blur(4px)" }}>
                      ↓ Descarca
                    </button>
                    <button onClick={() => setLightboxImg("")}
                      style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, backdropFilter: "blur(4px)" }}>✕</button>
                  </div>
                  {lightboxImages.length > 1 && (
                    <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 10px", borderRadius: 12, fontSize: "0.68rem" }}>
                      {lightboxNames[lightboxIdx] || ""} — {lightboxIdx + 1} / {lightboxImages.length}
                    </div>
                  )}
                </div>
                {lightboxImages.length > 1 && lightboxIdx < lightboxImages.length - 1 && (
                  <button onClick={() => { const ni = lightboxIdx + 1; setLightboxIdx(ni); setLightboxImg(lightboxImages[ni]); }}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, width: 36, height: 36, borderRadius: "50%", cursor: "pointer" }}>&#8250;</button>
                )}
              </div>
            </div>
          )}

          {/* Delete confirmation modal */}
          {deleteConfirmId && (
            <div className="ot-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
              <div className="ot-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
                <div style={{ padding: 24, textAlign: "center" }}>
                  <p style={{ color: "#dc2626", fontSize: "1rem", fontWeight: 700, margin: "0 0 8px" }}>Esti sigur ca stergi comanda #{deleteConfirmId}?</p>
                  <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "0 0 20px" }}>Aceasta actiune este ireversibila.</p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button onClick={() => setDeleteConfirmId(null)} style={{ padding: "8px 20px", borderRadius: 6, border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer", fontSize: "0.82rem", fontFamily: "var(--font)" }}>Anuleaza</button>
                    <button onClick={() => deleteOrder(deleteConfirmId)} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font)" }}>Sterge comanda</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ===== IMAGE UPLOAD HELPER =====
function useImageUpload() {
  const [preview, setPreview] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => { setFile(f); setPreview(URL.createObjectURL(f)); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) handleFile(f); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };
  const reset = () => { setFile(null); setPreview(""); };

  const uploadToR2 = async (): Promise<string> => {
    if (!file) return "";
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json();
    return d.url || "";
  };

  const DropZone = () => (
    <div className={`admin-dropzone ${dragOver ? "admin-dropzone--active" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
      {preview ? (
        <div className="admin-dropzone__preview">
          <img src={preview} alt="Preview" />
          <button type="button" onClick={reset} className="admin-dropzone__remove">✕</button>
        </div>
      ) : (
        <label className="admin-dropzone__label">
          <span>Trage o imagine sau click</span>
          <input type="file" accept="image/*" onChange={handleChange} style={{ display: "none" }} />
        </label>
      )}
    </div>
  );

  return { preview, file, uploadToR2, reset, DropZone };
}

// ===== CATEGORIES PANEL =====
function CategoriesPanel({ auth }: { auth: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const imgUpload = useImageUpload();

  const fetchCats = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    if (res.ok) { const data = await res.json(); if (Array.isArray(data)) setCategories(data); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const startEdit = (cat: Category) => { setEditingId(cat.id); setEditName(cat.name); };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch("/api/admin/categories", {
      method: "PATCH", headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, name: editName }),
    });
    setEditingId(null); fetchCats();
  };

  const deleteCat = async (id: number) => {
    if (!confirm("Stergi categoria?")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE", headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCats();
  };

  const addCategory = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const imageUrl = await imgUpload.uploadToR2();
    const slug = newSlug.trim() || newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const res = await fetch("/api/admin/categories", {
      method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), slug, image_url: imageUrl }),
    });
    const result = await res.json();
    if (!res.ok || result.error) { alert("Eroare salvare categorie: " + (result.error || "necunoscuta")); setSaving(false); return; }
    setNewName(""); setNewSlug(""); imgUpload.reset(); setShowAdd(false); setSaving(false); fetchCats();
  };

  const filtered = categories.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cauta categorie..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="admin-count">{filtered.length} categorii</span>
        <button className="admin-add-btn" onClick={() => setShowAdd(!showAdd)}><span className="admin-add-btn__plus">+</span><span className="admin-add-btn__text"> Adauga</span></button>
      </div>

      {showAdd && (
        <div className="admin-add-form">
          <imgUpload.DropZone />
          <div className="admin-add-form__fields">
            <input className="admin-inline-input" placeholder="Nume categorie" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="admin-inline-input" placeholder="Slug (optional)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="admin-add-btn" onClick={addCategory} disabled={saving}>{saving ? "..." : "Salveaza"}</button>
              <button className="admin-inline-btn" onClick={() => { setShowAdd(false); imgUpload.reset(); }}>Anuleaza</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p className="admin-loading">Se incarca...</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Imagine</th><th>Nume</th><th>Slug</th><th>Prio</th><th>Produse</th><th>Actiuni</th></tr>
            </thead>
            <tbody>
              {filtered.map((cat) => (
                <tr key={cat.id} className="admin-table__clickrow" onClick={() => window.location.href = `/admin/categorii/${cat.id}`}>
                  <td>{cat.image_url && <img src={cat.image_url} alt="" className="admin-table__thumb" />}</td>
                  <td><strong>{cat.name}</strong></td>
                  <td className="admin-table__muted">{cat.slug}</td>
                  <td>
                    <input
                      type="number"
                      className="admin-prio-input"
                      value={cat.sort_order}
                      min={1}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, sort_order: val } : c));
                      }}
                      onBlur={() => {
                        fetch("/api/admin/categories", {
                          method: "PATCH",
                          headers: { Authorization: auth, "Content-Type": "application/json" },
                          body: JSON.stringify({ id: cat.id, sort_order: cat.sort_order }),
                        });
                      }}
                    />
                  </td>
                  <td>{cat.product_count}</td>
                  <td>
                    <div className="admin-actions">
                      <a className="admin-action-btn" href={`/admin/categorii/${cat.id}`} title="Editeaza">✎</a>
                      <button className="admin-action-btn admin-action-btn--danger" onClick={(e) => { e.stopPropagation(); deleteCat(cat.id); }} title="Sterge">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ===== PRODUCTS PANEL =====
function ProductsPanel({ auth }: { auth: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => sessionStorage.getItem("admin_products_search") || "");
  const [page, setPage] = useState(() => Number(sessionStorage.getItem("admin_products_page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const config = useConfig();
  const [newPrice, setNewPrice] = useState(String(config.productPrice || ""));
  const [newCats, setNewCats] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState(() => sessionStorage.getItem("admin_products_filter") || "");
  const [allCats, setAllCats] = useState<{slug: string; name: string}[]>([]);
  const imgUpload = useImageUpload();

  // Clear saved position after restoring
  useEffect(() => {
    sessionStorage.removeItem("admin_products_page");
    sessionStorage.removeItem("admin_products_filter");
    sessionStorage.removeItem("admin_products_search");
  }, []);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data) => { if (Array.isArray(data)) setAllCats(data.map((c: any) => ({ slug: c.slug, name: c.name }))); }).catch(() => {});
  }, []);

  const fetchProds = useCallback(async () => {
    setLoading(true);
    const catParam = filterCat ? `&category=${filterCat}` : "";
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/products?page=${page}&per_page=20${catParam}${searchParam}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [page, filterCat, search]);

  useEffect(() => { fetchProds(); }, [fetchProds]);

  const startEdit = (p: Product) => { setEditingId(p.id); setEditName(p.name); setEditPrice(String(p.price)); };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch("/api/admin/products", {
      method: "PATCH", headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, name: editName, price: Number(editPrice) }),
    });
    setEditingId(null);
    fetchProds();
  };

  const deleteProd = async (id: number) => {
    if (!confirm("Stergi produsul?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE", headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchProds();
  };

  const addProduct = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const imageUrl = await imgUpload.uploadToR2();
    const slug = newSlug.trim() || newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const categorySlugs = newCats.split(",").map((s) => s.trim()).filter(Boolean);
    await fetch("/api/admin/products", {
      method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), slug, price: Number(newPrice) || config.productPrice || 0, image_url: imageUrl, category_slugs: categorySlugs }),
    });
    setNewName(""); setNewSlug(""); setNewPrice(String(config.productPrice || "")); setNewCats(""); imgUpload.reset(); setShowAdd(false); setSaving(false); fetchProds();
  };

  const filtered = products;

  return (
    <>
      <div className="admin-toolbar">
        <select className="admin-cat-filter" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}>
          <option value="">Toate categoriile</option>
          {allCats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <input className="admin-search" placeholder="Cauta produs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <span className="admin-count">{total}</span>
        <a href="/admin/produse/nou" className="admin-add-btn" style={{ textDecoration: "none" }}><span className="admin-add-btn__plus">+</span><span className="admin-add-btn__text"> Adauga</span></a>
      </div>

      {showAdd && (
        <div className="admin-add-form">
          <imgUpload.DropZone />
          <div className="admin-add-form__fields">
            <input className="admin-inline-input" placeholder="Nume produs" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="admin-inline-input" placeholder="Slug (optional)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            <input className="admin-inline-input" placeholder="Pret (RON)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: 80 }} />
            <input className="admin-inline-input" placeholder="Categorii (slug-uri, separate cu virgula)" value={newCats} onChange={(e) => setNewCats(e.target.value)} />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="admin-add-btn" onClick={addProduct} disabled={saving}>{saving ? "..." : "Salveaza"}</button>
              <button className="admin-inline-btn" onClick={() => { setShowAdd(false); imgUpload.reset(); }}>Anuleaza</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <p className="admin-loading">Se incarca...</p> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Img</th><th>Nume</th><th>Pret</th><th>Categorii</th><th>Actiuni</th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="admin-table__clickrow" onClick={() => { sessionStorage.setItem("admin_products_page", String(page)); sessionStorage.setItem("admin_products_filter", filterCat); sessionStorage.setItem("admin_products_search", search); window.location.href = `/admin/produse/${p.id}`; }}>
                    <td>
                      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                        <img src={p.r2_image_url || p.image_url} alt="" className="admin-table__thumb" />
                        {p.print_image_url ? (
                          <img src={p.print_image_url} alt="PRINT" className="admin-table__thumb" style={{ borderRadius: 2, opacity: 0.85, maxHeight: 48, width: "auto" }} title="Imagine PRINT" />
                        ) : (
                          <span style={{ fontSize: "0.55rem", color: "#e55", fontWeight: 600 }} title="Fara imagine PRINT">!</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {editingId === p.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <input className="admin-inline-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                          <div style={{ display: "flex", gap: 4 }}>
                            <input className="admin-inline-input" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: 60 }} />
                            <button className="admin-inline-btn" onClick={saveEdit}>✓</button>
                            <button className="admin-inline-btn" onClick={() => setEditingId(null)}>✕</button>
                          </div>
                        </div>
                      ) : <span className="admin-table__name">{p.name}</span>}
                    </td>
                    <td><strong>{p.price} RON</strong></td>
                    <td className="admin-table__muted">{p.category_slugs?.join(", ")}</td>
                    <td>
                      <div className="admin-actions">
                        <a className="admin-action-btn" href={`/admin/produse/${p.id}`} title="Editeaza">✎</a>
                        <button className="admin-action-btn admin-action-btn--danger" onClick={(e) => { e.stopPropagation(); deleteProd(p.id); }} title="Sterge">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 16 }}>
              <button className="pagination__btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
              <input type="number" min={1} max={totalPages} value={page} onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v); }}
                style={{ width: 48, textAlign: "center", fontSize: "0.82rem", padding: "4px 2px", border: "1px solid var(--color-border)", borderRadius: 4, fontFamily: "var(--font)" }} />
              <span className="pagination__info" style={{ fontSize: "0.78rem" }}>/ {totalPages}</span>
              <button className="pagination__btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ===== SETTINGS PANEL =====
function SettingsPanel({ auth }: { auth: string }) {
  const [fcUser, setFcUser] = useState("");
  const [fcPass, setFcPass] = useState("");
  const [fcClientId, setFcClientId] = useState("");
  const [fcIban, setFcIban] = useState("");
  const [fcBanca, setFcBanca] = useState("");
  // Sameday
  const [sdUser, setSdUser] = useState("");
  const [sdPass, setSdPass] = useState("");
  const [sdPickup, setSdPickup] = useState("");
  const [sdService, setSdService] = useState("");
  const [sdLockerService, setSdLockerService] = useState("");
  const [sdTestMode, setSdTestMode] = useState(false);
  // Pixels
  const [fbPixel, setFbPixel] = useState("");
  const [tiktokPixel, setTiktokPixel] = useState("");
  const [gaId, setGaId] = useState("");
  const [gadsId, setGadsId] = useState("");
  const [gadsLabel, setGadsLabel] = useState("");
  const [snapPixel, setSnapPixel] = useState("");
  const [pinterestTag, setPinterestTag] = useState("");

  // FGO
  const [fgoCui, setFgoCui] = useState("");
  const [fgoApiKey, setFgoApiKey] = useState("");
  const [fgoSerie, setFgoSerie] = useState("");
  const [fgoPlatformUrl, setFgoPlatformUrl] = useState("");
  const [fgoCotaTva, setFgoCotaTva] = useState("0");
  const [fgoTestMode, setFgoTestMode] = useState(false);
  const [fgoTestResult, setFgoTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [fgoTesting, setFgoTesting] = useState(false);

  // WhatsApp templates - default general template (used for cross-sell or fallback)
  const DEFAULT_WA_TEMPLATE = `Bună {{nume_client}},
Sunt de la {{site_name}}.

Mulțumim pentru comanda dvs cu nr #{{id_comanda}} în sumă de {{valoare}} lei.
Hai să verificăm împreună detaliile ei:

Produs: {{produs}}
Text pe husă: {{text_husa}}

Te rog verifică modelul exact din SETĂRI → DESPRE TELEFON → MODEL.
Atenție la diferențe gen 4G / 5G / Plus / Edge etc.

Livrare: {{metoda_livrare}}
Adresa: {{adresa}}

Confirmă textul și adresa de livrare.
După ce ne confirmați grafica și datele de mai sus, vom prelucra comanda.`;
  // Legacy single-template field (used as fallback if no templates array)
  const [waTemplate, setWaTemplate] = useState(DEFAULT_WA_TEMPLATE);
  // New: array of templates with category assignment
  const [waTemplates, setWaTemplates] = useState<Array<{id: string; name: string; category_slugs: string[]; content: string}>>([]);
  const [waGeneralTemplate, setWaGeneralTemplate] = useState(DEFAULT_WA_TEMPLATE);
  const [waEditingId, setWaEditingId] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Array<{id: number; name: string; slug: string}>>([]);

  // Load categories for whatsapp template assignment
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAllCategories(d); }).catch(() => {});
  }, []);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsTab, setSettingsTab] = useState<"site" | "fancourier" | "sameday" | "fgo" | "pixels" | "whatsapp" | "addons">("site");

  // Addon groups
  const [addonGroups, setAddonGroups] = useState<{id:string;name:string;fields:{id:string;type:string;label:string;placeholder?:string;required?:boolean;options?:{label:string;value:string;image_url?:string;price_impact?:number}[]}[]}[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Site config (defaults from DEFAULT_CONFIG)
  const dc = DEFAULT_CONFIG;
  const [siteName, setSiteName] = useState(dc.siteName);
  const [siteDomain, setSiteDomain] = useState(dc.domain);
  const [siteTagline, setSiteTagline] = useState(dc.tagline);
  const [siteLogoHtml, setSiteLogoHtml] = useState(dc.logoHtml);
  const [sitePrice, setSitePrice] = useState(String(dc.productPrice));
  const [siteCost, setSiteCost] = useState(String(dc.productionCost));
  const [companyName, setCompanyName] = useState(dc.companyName);
  const [companyCIF, setCompanyCIF] = useState(dc.companyCIF);
  const [companyAddress, setCompanyAddress] = useState(dc.companyAddress);
  const [companyCounty, setCompanyCounty] = useState(dc.companyCounty);
  const [companyLocality, setCompanyLocality] = useState(dc.companyLocality);
  const [sitePhone, setSitePhone] = useState(dc.phone);
  const [siteEmailOrders, setSiteEmailOrders] = useState(dc.emailOrders);
  const [siteEmailFrom, setSiteEmailFrom] = useState(dc.emailFrom);
  const [siteEmailAdmin, setSiteEmailAdmin] = useState(dc.emailAdmin);
  const [siteGravpoint, setSiteGravpoint] = useState(dc.gravpointApiUrl);
  const [siteIban, setSiteIban] = useState("");
  const [siteBanca, setSiteBanca] = useState("");
  const [siteMetaTitle, setSiteMetaTitle] = useState(dc.metaTitle);
  const [siteMetaDesc, setSiteMetaDesc] = useState(dc.metaDescription);

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: auth } })
      .then((r) => r.json())
      .then((data) => {
        if (data.site_config) {
          const sc = data.site_config;
          if (sc.siteName) setSiteName(sc.siteName);
          if (sc.domain) setSiteDomain(sc.domain);
          if (sc.tagline) setSiteTagline(sc.tagline);
          if (sc.logoHtml) setSiteLogoHtml(sc.logoHtml);
          if (sc.productPrice) setSitePrice(String(sc.productPrice));
          if (sc.productionCost) setSiteCost(String(sc.productionCost));
          if (sc.companyName) setCompanyName(sc.companyName);
          if (sc.companyCIF) setCompanyCIF(sc.companyCIF);
          if (sc.companyAddress) setCompanyAddress(sc.companyAddress);
          if (sc.companyCounty) setCompanyCounty(sc.companyCounty);
          if (sc.companyLocality) setCompanyLocality(sc.companyLocality);
          if (sc.phone) setSitePhone(sc.phone);
          if (sc.emailOrders) setSiteEmailOrders(sc.emailOrders);
          if (sc.emailFrom) setSiteEmailFrom(sc.emailFrom);
          if (sc.emailAdmin) setSiteEmailAdmin(sc.emailAdmin);
          if (sc.gravpointApiUrl) setSiteGravpoint(sc.gravpointApiUrl);
          if (sc.iban) setSiteIban(sc.iban);
          if (sc.banca) setSiteBanca(sc.banca);
          if (sc.metaTitle) setSiteMetaTitle(sc.metaTitle);
          if (sc.metaDescription) setSiteMetaDesc(sc.metaDescription);
        }
        if (data.sameday) {
          setSdUser(data.sameday.username || "");
          setSdPass(data.sameday.password || "");
          setSdPickup(data.sameday.pickup_point_id || "");
          setSdService(data.sameday.service_id || "");
          setSdLockerService(data.sameday.locker_service_id || "");
          setSdTestMode(data.sameday.test_mode === "true");
        }
        if (data.fancourier) {
          setFcUser(data.fancourier.username || "");
          setFcPass(data.fancourier.password || "");
          setFcClientId(data.fancourier.client_id || "");
          setFcIban(data.fancourier.iban || "");
          setFcBanca(data.fancourier.banca || "");
        }
        if (data.whatsapp) {
          if (data.whatsapp.template) setWaTemplate(data.whatsapp.template);
          if (Array.isArray(data.whatsapp.templates)) setWaTemplates(data.whatsapp.templates);
          if (data.whatsapp.general_template) setWaGeneralTemplate(data.whatsapp.general_template);
          else if (data.whatsapp.template) setWaGeneralTemplate(data.whatsapp.template);
        }
        if (data.addon_groups && Array.isArray(data.addon_groups)) {
          setAddonGroups(data.addon_groups);
        }
        if (data.fgo) {
          setFgoCui(data.fgo.cui || "");
          setFgoApiKey(data.fgo.api_key || "");
          setFgoSerie(data.fgo.serie || "");
          setFgoPlatformUrl(data.fgo.platform_url || "");
          setFgoCotaTva(data.fgo.cota_tva ?? "0");
          setFgoTestMode(data.fgo.test_mode === true);
        }
        if (data.pixels) {
          setFbPixel(data.pixels.facebook || "");
          setTiktokPixel(data.pixels.tiktok || "");
          setGaId(data.pixels.google_analytics || "");
          setGadsId(data.pixels.google_ads_id || "");
          setGadsLabel(data.pixels.google_ads_label || "");
          setSnapPixel(data.pixels.snapchat || "");
          setPinterestTag(data.pixels.pinterest || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [auth]);

  const save = async () => {
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        site_config: {
          siteName, domain: siteDomain, tagline: siteTagline, logoHtml: siteLogoHtml,
          productPrice: Number(sitePrice), productionCost: Number(siteCost),
          companyName, companyCIF, companyAddress, companyCounty, companyLocality,
          phone: sitePhone, emailOrders: siteEmailOrders, emailFrom: siteEmailFrom, emailAdmin: siteEmailAdmin,
          gravpointApiUrl: siteGravpoint, iban: siteIban, banca: siteBanca, metaTitle: siteMetaTitle, metaDescription: siteMetaDesc,
        },
        sameday: { username: sdUser, password: sdPass, pickup_point_id: sdPickup, service_id: sdService, locker_service_id: sdLockerService, test_mode: sdTestMode ? "true" : "false" },
        fancourier: { username: fcUser, password: fcPass, client_id: fcClientId },
        pixels: { facebook: fbPixel, tiktok: tiktokPixel, google_analytics: gaId, google_ads_id: gadsId, google_ads_label: gadsLabel, snapchat: snapPixel, pinterest: pinterestTag },
        fgo: { cui: fgoCui, api_key: fgoApiKey, serie: fgoSerie, platform_url: fgoPlatformUrl, cota_tva: Number(fgoCotaTva), test_mode: fgoTestMode },
        whatsapp: { template: waTemplate, templates: waTemplates, general_template: waGeneralTemplate },
        addon_groups: addonGroups,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <p className="admin-loading">Se incarca...</p>;

  return (
    <div className="admin-settings">
      <div className="admin-settings__tabs">
        <button className={`admin-settings__tab ${settingsTab === "site" ? "admin-settings__tab--active" : ""}`} onClick={() => setSettingsTab("site")}>Site</button>
        <button className={`admin-settings__tab ${settingsTab === "fancourier" ? "admin-settings__tab--active" : ""}`} onClick={() => setSettingsTab("fancourier")}>FanCourier</button>
        <button className={`admin-settings__tab ${settingsTab === "sameday" ? "admin-settings__tab--active" : ""}`} onClick={() => setSettingsTab("sameday")}>Sameday</button>
        <button className={`admin-settings__tab ${settingsTab === "fgo" ? "admin-settings__tab--active" : ""}`} onClick={() => setSettingsTab("fgo")}>FGO Facturare</button>
        <button className={`admin-settings__tab ${settingsTab === "pixels" ? "admin-settings__tab--active" : ""}`} onClick={() => setSettingsTab("pixels")}>Pixeli & Tracking</button>
        <button className={`admin-settings__tab ${settingsTab === "whatsapp" ? "admin-settings__tab--active" : ""}`} onClick={() => setSettingsTab("whatsapp")}>WhatsApp</button>
        <button className={`admin-settings__tab ${settingsTab === "addons" ? "admin-settings__tab--active" : ""}`} onClick={() => setSettingsTab("addons")}>Campuri Addons</button>
      </div>

      {settingsTab === "site" && (
        <>
          <div className="admin-settings__section">
            <h3>Branding</h3>
            <div className="admin-settings__grid">
              <div className="admin-settings__field"><label>Nume site</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="olivox.ro" /></div>
              <div className="admin-settings__field"><label>Domeniu (cu https://)</label><input type="text" value={siteDomain} onChange={(e) => setSiteDomain(e.target.value)} placeholder="https://olivox.ro" /></div>
              <div className="admin-settings__field"><label>Tagline</label><input type="text" value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} placeholder="Creaza-ti husa unica..." /></div>
              <div className="admin-settings__field"><label>Logo HTML</label><input type="text" value={siteLogoHtml} onChange={(e) => setSiteLogoHtml(e.target.value)} placeholder='huse<span>personalizate</span>.ro' /></div>
            </div>
          </div>
          <div className="admin-settings__section">
            <h3>Preturi</h3>
            <div className="admin-settings__grid">
              <div className="admin-settings__field"><label>Pret produs (RON)</label><input type="number" value={sitePrice} onChange={(e) => setSitePrice(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Cost productie (RON)</label><input type="number" value={siteCost} onChange={(e) => setSiteCost(e.target.value)} /></div>
            </div>
          </div>
          <div className="admin-settings__section">
            <h3>Date firma</h3>
            <div className="admin-settings__grid">
              <div className="admin-settings__field"><label>Nume firma</label><input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
              <div className="admin-settings__field"><label>CIF</label><input type="text" value={companyCIF} onChange={(e) => setCompanyCIF(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Adresa</label><input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Judet</label><input type="text" value={companyCounty} onChange={(e) => setCompanyCounty(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Localitate</label><input type="text" value={companyLocality} onChange={(e) => setCompanyLocality(e.target.value)} /></div>
              <div className="admin-settings__field"><label>IBAN</label><input type="text" value={siteIban} onChange={(e) => setSiteIban(e.target.value)} placeholder="RO49AAAA1B31007593840000" /></div>
              <div className="admin-settings__field"><label>Banca</label><input type="text" value={siteBanca} onChange={(e) => setSiteBanca(e.target.value)} placeholder="ex: ING Bank" /></div>
            </div>
          </div>
          <div className="admin-settings__section">
            <h3>Contact & Email</h3>
            <div className="admin-settings__grid">
              <div className="admin-settings__field"><label>Telefon</label><input type="text" value={sitePhone} onChange={(e) => setSitePhone(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Email comenzi (afisat pe site)</label><input type="text" value={siteEmailOrders} onChange={(e) => setSiteEmailOrders(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Email admin (primeste notificari)</label><input type="text" value={siteEmailAdmin} onChange={(e) => setSiteEmailAdmin(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Email From (Resend)</label><input type="text" value={siteEmailFrom} onChange={(e) => setSiteEmailFrom(e.target.value)} placeholder="Nume <no-reply@domeniu.ro>" /></div>
            </div>
          </div>
          <div className="admin-settings__section">
            <h3>Tehnic</h3>
            <div className="admin-settings__grid">
              <div className="admin-settings__field"><label>Gravpoint API URL</label><input type="text" value={siteGravpoint} onChange={(e) => setSiteGravpoint(e.target.value)} /></div>
            </div>
          </div>
          <div className="admin-settings__section">
            <h3>SEO</h3>
            <div className="admin-settings__grid">
              <div className="admin-settings__field"><label>Meta Title (homepage)</label><input type="text" value={siteMetaTitle} onChange={(e) => setSiteMetaTitle(e.target.value)} /></div>
              <div className="admin-settings__field"><label>Meta Description (homepage)</label><textarea rows={2} value={siteMetaDesc} onChange={(e) => setSiteMetaDesc(e.target.value)} /></div>
            </div>
          </div>
        </>
      )}

      {settingsTab === "fancourier" && (
        <div className="admin-settings__section">
          <h3>FanCourier</h3>
          <p className="admin-settings__desc">Credentiale pentru generare AWB automat si livrare prin FanCourier.</p>
          <div className="admin-settings__grid">
            <div className="admin-settings__field"><label>Username</label><input type="text" value={fcUser} onChange={(e) => setFcUser(e.target.value)} placeholder="Username FanCourier" /></div>
            <div className="admin-settings__field"><label>Parola</label><input type="password" value={fcPass} onChange={(e) => setFcPass(e.target.value)} placeholder="Parola FanCourier" /></div>
            <div className="admin-settings__field"><label>Client ID</label><input type="text" value={fcClientId} onChange={(e) => setFcClientId(e.target.value)} placeholder="ID numeric din contract" /></div>
          </div>

        </div>
      )}

      {settingsTab === "sameday" && (
        <div className="admin-settings__section">
          <h3>Sameday</h3>
          <p className="admin-settings__desc">Credentiale pentru generare AWB Sameday si livrare la Easybox.</p>
          <div className="admin-settings__grid">
            <div className="admin-settings__field"><label>Username</label><input type="text" value={sdUser} onChange={(e) => setSdUser(e.target.value)} placeholder="Username Sameday" /></div>
            <div className="admin-settings__field"><label>Parola</label><input type="password" value={sdPass} onChange={(e) => setSdPass(e.target.value)} placeholder="Parola Sameday" /></div>
            <div className="admin-settings__field"><label>Pickup Point ID</label><input type="text" value={sdPickup} onChange={(e) => setSdPickup(e.target.value)} placeholder="ID punct ridicare" /></div>
            <div className="admin-settings__field"><label>Service ID (standard)</label><input type="text" value={sdService} onChange={(e) => setSdService(e.target.value)} placeholder="ID serviciu livrare" /></div>
            <div className="admin-settings__field"><label>Service ID (locker/easybox)</label><input type="text" value={sdLockerService} onChange={(e) => setSdLockerService(e.target.value)} placeholder="ID serviciu easybox" /></div>
            <div className="admin-settings__field"><label>Mod test</label><div><input type="checkbox" checked={sdTestMode} onChange={(e) => setSdTestMode(e.target.checked)} /> Demo API</div></div>
          </div>
        </div>
      )}

      {settingsTab === "fgo" && (
        <div className="admin-settings__section">
          <h3>FGO.ro - Facturare</h3>
          <p className="admin-settings__desc">Setari pentru integrarea cu FGO.ro. Creaza un utilizator API in FGO &gt; Setari &gt; Utilizatori si copiaza cheia privata.</p>
          <div className="admin-settings__grid">
            <div className="admin-settings__field"><label>CUI firma</label><input type="text" value={fgoCui} onChange={(e) => setFgoCui(e.target.value)} placeholder="ex: 35859542" /></div>
            <div className="admin-settings__field"><label>Cheie privata API</label><input type="text" value={fgoApiKey} onChange={(e) => setFgoApiKey(e.target.value)} placeholder="Cheia din FGO > Setari > Utilizatori" /></div>
            <div className="admin-settings__field"><label>Serie factura</label><input type="text" value={fgoSerie} onChange={(e) => setFgoSerie(e.target.value)} placeholder="ex: VIT" /></div>
            <div className="admin-settings__field"><label>Cota TVA (%)</label><input type="number" value={fgoCotaTva} onChange={(e) => setFgoCotaTva(e.target.value)} placeholder="0 = neplatitor TVA" /></div>
            <div className="admin-settings__field"><label>URL platforma</label><input type="text" value={fgoPlatformUrl} onChange={(e) => setFgoPlatformUrl(e.target.value)} placeholder="ex: https://olivox.ro" /></div>
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", cursor: "pointer" }}>
              <input type="checkbox" checked={fgoTestMode} onChange={(e) => setFgoTestMode(e.target.checked)} />
              Mod test (foloseste API-ul de test FGO)
            </label>
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <button className="admin-add-btn" disabled={fgoTesting || !fgoCui || !fgoApiKey} onClick={async () => {
              setFgoTesting(true); setFgoTestResult(null);
              try {
                const res = await fetch("/api/admin/fgo", {
                  method: "POST",
                  headers: { Authorization: auth, "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "test" }),
                });
                const data = await res.json();
                if (data.success) setFgoTestResult({ ok: true, msg: data.message || "Conexiune OK!" });
                else setFgoTestResult({ ok: false, msg: data.error || "Eroare necunoscuta" });
              } catch (e) { setFgoTestResult({ ok: false, msg: String(e) }); }
              finally { setFgoTesting(false); }
            }}>{fgoTesting ? "Se testeaza..." : "Testeaza conexiunea"}</button>
            {fgoTestResult && (
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: fgoTestResult.ok ? "var(--color-success)" : "#dc2626" }}>{fgoTestResult.msg}</span>
            )}
          </div>
        </div>
      )}

      {settingsTab === "pixels" && (
        <div className="admin-settings__section">
          <h3>Pixeli & Tracking</h3>
          <p className="admin-settings__desc">ID-urile pixelilor de tracking. Se activeaza automat pe toate paginile daca sunt completati.</p>
          <div className="admin-settings__grid">
            <div className="admin-settings__field"><label>Facebook Pixel ID</label><input type="text" value={fbPixel} onChange={(e) => setFbPixel(e.target.value)} placeholder="ex: 123456789012345" /></div>
            <div className="admin-settings__field"><label>TikTok Pixel ID</label><input type="text" value={tiktokPixel} onChange={(e) => setTiktokPixel(e.target.value)} placeholder="ex: C1234567890" /></div>
            <div className="admin-settings__field"><label>Google Analytics (GA4)</label><input type="text" value={gaId} onChange={(e) => setGaId(e.target.value)} placeholder="ex: G-XXXXXXXXXX" /></div>
            <div className="admin-settings__field"><label>Google Ads Conversion ID</label><input type="text" value={gadsId} onChange={(e) => setGadsId(e.target.value)} placeholder="ex: AW-123456789" /></div>
            <div className="admin-settings__field"><label>Google Ads Conv. Label</label><input type="text" value={gadsLabel} onChange={(e) => setGadsLabel(e.target.value)} placeholder="ex: AbCdEfGhIjK" /></div>
            <div className="admin-settings__field"><label>Snapchat Pixel ID</label><input type="text" value={snapPixel} onChange={(e) => setSnapPixel(e.target.value)} placeholder="ex: abc123-def456" /></div>
            <div className="admin-settings__field"><label>Pinterest Tag ID</label><input type="text" value={pinterestTag} onChange={(e) => setPinterestTag(e.target.value)} placeholder="ex: 1234567890" /></div>
          </div>
        </div>
      )}

      {settingsTab === "whatsapp" && (
        <div className="admin-settings__section">
          <h3>Template-uri WhatsApp confirmare comanda</h3>
          <p className="admin-settings__desc">
            Creeaza template-uri diferite pentru fiecare categorie de produs. La trimiterea confirmarii pe WhatsApp se va folosi template-ul asociat categoriei produsului comandat. Daca exista mai multe produse (cross-sell), se foloseste template-ul general.
          </p>
          <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: 16, lineHeight: 1.8 }}>
            <strong>Variabile disponibile:</strong><br />
            <code>{`{{nume_client}}`}</code> <code>{`{{id_comanda}}`}</code> <code>{`{{valoare}}`}</code> <code>{`{{produs}}`}</code> <code>{`{{brand}}`}</code> <code>{`{{model}}`}</code> <code>{`{{text_husa}}`}</code> <code>{`{{metoda_livrare}}`}</code> <code>{`{{adresa}}`}</code> <code>{`{{telefon}}`}</code> <code>{`{{site_name}}`}</code>
          </div>

          {/* Templates list */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h4 style={{ fontSize: "0.9rem", margin: 0 }}>Template-uri pe categorii</h4>
              <button
                className="admin-add-btn"
                onClick={() => {
                  const id = "tpl_" + Date.now();
                  setWaTemplates([...waTemplates, { id, name: "Template nou", category_slugs: [], content: DEFAULT_WA_TEMPLATE }]);
                  setWaEditingId(id);
                }}
              >+ Adauga template</button>
            </div>

            {waTemplates.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontStyle: "italic", padding: "12px 0" }}>
                Niciun template definit. Va fi folosit template-ul general pentru toate comenzile.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {waTemplates.map((tpl) => (
                  <div key={tpl.id} style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer" }} onClick={() => setWaEditingId(waEditingId === tpl.id ? null : tpl.id)}>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: "0.85rem" }}>{tpl.name || "(fara nume)"}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                        {tpl.category_slugs.length} {tpl.category_slugs.length === 1 ? "categorie" : "categorii"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm("Stergi template-ul?")) setWaTemplates(waTemplates.filter((t) => t.id !== tpl.id)); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "1rem" }}
                      >✕</button>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{waEditingId === tpl.id ? "▲" : "▼"}</span>
                    </div>

                    {waEditingId === tpl.id && (
                      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="admin-settings__field">
                          <label>Nume template</label>
                          <input
                            type="text"
                            value={tpl.name}
                            onChange={(e) => setWaTemplates(waTemplates.map((t) => t.id === tpl.id ? { ...t, name: e.target.value } : t))}
                            placeholder="ex: Huse telefon"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Categorii asociate</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 160, overflowY: "auto", padding: 8, border: "1px solid var(--color-border)", borderRadius: 6 }}>
                            {allCategories.length === 0 ? (
                              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Se incarca categoriile...</span>
                            ) : allCategories.map((cat) => {
                              const checked = tpl.category_slugs.includes(cat.slug);
                              return (
                                <label key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", border: `1px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`, borderRadius: 4, cursor: "pointer", fontSize: "0.74rem", background: checked ? "rgba(233,69,96,0.06)" : "transparent" }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setWaTemplates(waTemplates.map((t) => {
                                        if (t.id !== tpl.id) return t;
                                        const slugs = checked ? t.category_slugs.filter((s) => s !== cat.slug) : [...t.category_slugs, cat.slug];
                                        return { ...t, category_slugs: slugs };
                                      }));
                                    }}
                                    style={{ margin: 0 }}
                                  />
                                  <span>{cat.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 6 }}>Continut mesaj</label>
                          <textarea
                            value={tpl.content}
                            onChange={(e) => setWaTemplates(waTemplates.map((t) => t.id === tpl.id ? { ...t, content: e.target.value } : t))}
                            rows={14}
                            style={{ width: "100%", fontFamily: "var(--font)", fontSize: "0.82rem", padding: 12, border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", resize: "vertical", lineHeight: 1.6 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General fallback template */}
          <div>
            <h4 style={{ fontSize: "0.9rem", margin: "0 0 6px" }}>Template general (fallback)</h4>
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: 8 }}>
              Folosit cand comanda contine cross-sell sau cand categoria nu are template asignat.
            </p>
            <textarea
              value={waGeneralTemplate}
              onChange={(e) => setWaGeneralTemplate(e.target.value)}
              rows={14}
              style={{ width: "100%", fontFamily: "var(--font)", fontSize: "0.82rem", padding: 12, border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
        </div>
      )}

      {settingsTab === "addons" && (
        <div className="admin-settings__section">
          <h3>Grupuri de campuri personalizate (Addons)</h3>
          <p className="admin-settings__desc">Defineste grupuri de campuri reutilizabile. Ataseaza-le produselor din pagina de editare produs.</p>

          {addonGroups.map((group, gi) => (
            <div key={group.id} style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: 12, background: "var(--color-bg)" }}>
              {/* Group header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer", background: expandedGroup === group.id ? "rgba(0,102,204,0.04)" : "transparent" }} onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, flex: 1 }}>{group.name || "Grup nou"} <span style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "0.72rem" }}>({group.fields.length} campuri)</span></span>
                <button type="button" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem", padding: "2px 6px" }} onClick={(e) => { e.stopPropagation(); setAddonGroups(addonGroups.filter((_, i) => i !== gi)); }}>Sterge</button>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{expandedGroup === group.id ? "▲" : "▼"}</span>
              </div>

              {/* Group content (expanded) */}
              {expandedGroup === group.id && (
                <div style={{ padding: "0 12px 12px", borderTop: "1px solid var(--color-border)" }}>
                  <div className="admin-settings__field" style={{ marginTop: 10, marginBottom: 12 }}>
                    <label>Nume grup</label>
                    <input type="text" value={group.name} placeholder="ex: Tablouri, Personalizare text..." onChange={(e) => {
                      const g = [...addonGroups]; g[gi] = { ...group, name: e.target.value }; setAddonGroups(g);
                    }} />
                  </div>

                  {/* Fields list */}
                  {group.fields.map((field, fi) => (
                    <div key={field.id} style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: 12, marginBottom: 10, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)" }}>#{fi + 1} {field.label || "Camp nou"}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {fi > 0 && <button type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => {
                            const g = [...addonGroups]; const fields = [...g[gi].fields];
                            [fields[fi - 1], fields[fi]] = [fields[fi], fields[fi - 1]];
                            g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                          }}>↑</button>}
                          {fi < group.fields.length - 1 && <button type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }} onClick={() => {
                            const g = [...addonGroups]; const fields = [...g[gi].fields];
                            [fields[fi], fields[fi + 1]] = [fields[fi + 1], fields[fi]];
                            g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                          }}>↓</button>}
                          <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "0.8rem" }} onClick={() => {
                            const g = [...addonGroups]; g[gi] = { ...g[gi], fields: g[gi].fields.filter((_, i) => i !== fi) }; setAddonGroups(g);
                          }}>✕</button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div className="admin-settings__field">
                          <label>Tip</label>
                          <select value={field.type} onChange={(e) => {
                            const g = [...addonGroups]; const fields = [...g[gi].fields];
                            fields[fi] = { ...field, type: e.target.value };
                            if (!["select", "image_select"].includes(e.target.value)) fields[fi].options = undefined;
                            else if (!fields[fi].options?.length) fields[fi].options = [{ label: "", value: "", price_impact: 0 }];
                            g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                          }}>
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="image_upload">Upload imagine</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="select">Selectie (dropdown)</option>
                            <option value="image_select">Selectie imagini</option>
                          </select>
                        </div>
                        <div className="admin-settings__field">
                          <label>Label</label>
                          <input type="text" value={field.label} placeholder="ex: Culoare rama" onChange={(e) => {
                            const g = [...addonGroups]; const fields = [...g[gi].fields];
                            fields[fi] = { ...field, label: e.target.value };
                            g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                          }} />
                        </div>
                        <div className="admin-settings__field">
                          <label>Placeholder</label>
                          <input type="text" value={field.placeholder || ""} placeholder="Text ajutator..." onChange={(e) => {
                            const g = [...addonGroups]; const fields = [...g[gi].fields];
                            fields[fi] = { ...field, placeholder: e.target.value };
                            g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                          }} />
                        </div>
                        <div className="admin-settings__field" style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
                          <input type="checkbox" checked={field.required || false} onChange={(e) => {
                            const g = [...addonGroups]; const fields = [...g[gi].fields];
                            fields[fi] = { ...field, required: e.target.checked };
                            g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                          }} />
                          <label style={{ margin: 0, fontSize: "0.8rem" }}>Obligatoriu</label>
                        </div>
                      </div>

                      {/* Options for select / image_select */}
                      {(field.type === "select" || field.type === "image_select") && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--color-border)" }}>
                          <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>Optiuni</label>
                          {(field.options || []).map((opt, oi) => (
                            <div key={oi} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                              <input type="text" value={opt.label} placeholder="Nume optiune" style={{ flex: 2, height: 32, padding: "0 8px", fontSize: "0.78rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)" }} onChange={(e) => {
                                const g = [...addonGroups]; const fields = [...g[gi].fields];
                                const opts = [...(fields[fi].options || [])];
                                opts[oi] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") };
                                fields[fi] = { ...fields[fi], options: opts };
                                g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                              }} />
                              <input type="number" value={opt.price_impact || 0} placeholder="+/- RON" title="Impact pret (RON)" style={{ width: 70, height: 32, padding: "0 8px", fontSize: "0.78rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)" }} onChange={(e) => {
                                const g = [...addonGroups]; const fields = [...g[gi].fields];
                                const opts = [...(fields[fi].options || [])];
                                opts[oi] = { ...opt, price_impact: Number(e.target.value) };
                                fields[fi] = { ...fields[fi], options: opts };
                                g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                              }} />
                              {field.type === "image_select" && (
                                <input type="text" value={opt.image_url || ""} placeholder="URL imagine" style={{ flex: 2, height: 32, padding: "0 8px", fontSize: "0.78rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)" }} onChange={(e) => {
                                  const g = [...addonGroups]; const fields = [...g[gi].fields];
                                  const opts = [...(fields[fi].options || [])];
                                  opts[oi] = { ...opt, image_url: e.target.value };
                                  fields[fi] = { ...fields[fi], options: opts };
                                  g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                                }} />
                              )}
                              <button type="button" style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem", padding: "0 4px" }} onClick={() => {
                                const g = [...addonGroups]; const fields = [...g[gi].fields];
                                fields[fi] = { ...fields[fi], options: (fields[fi].options || []).filter((_, i) => i !== oi) };
                                g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                              }}>✕</button>
                            </div>
                          ))}
                          <button type="button" style={{ fontSize: "0.72rem", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }} onClick={() => {
                            const g = [...addonGroups]; const fields = [...g[gi].fields];
                            fields[fi] = { ...fields[fi], options: [...(fields[fi].options || []), { label: "", value: "", price_impact: 0 }] };
                            g[gi] = { ...g[gi], fields }; setAddonGroups(g);
                          }}>+ Adauga optiune</button>
                        </div>
                      )}
                    </div>
                  ))}

                  <button type="button" style={{ width: "100%", padding: "8px 0", fontSize: "0.78rem", color: "var(--color-primary)", background: "rgba(0,102,204,0.05)", border: "1.5px dashed var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600 }} onClick={() => {
                    const g = [...addonGroups];
                    g[gi] = { ...g[gi], fields: [...g[gi].fields, { id: `cf_${Date.now()}`, type: "text", label: "", placeholder: "", required: false }] };
                    setAddonGroups(g);
                  }}>+ Adauga camp</button>
                </div>
              )}
            </div>
          ))}

          <button type="button" className="admin-add-btn" style={{ width: "100%", fontSize: "0.82rem", marginTop: 4 }} onClick={() => {
            const newId = `ag_${Date.now()}`;
            setAddonGroups([...addonGroups, { id: newId, name: "", fields: [] }]);
            setExpandedGroup(newId);
          }}>+ Adauga grup addon</button>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <button className="admin-add-btn" onClick={save}>Salveaza setarile</button>
        {saved && <span style={{ color: "var(--color-success)", fontSize: "0.82rem", fontWeight: 600 }}>Salvat!</span>}
      </div>
    </div>
  );
}

// ===== HOMEPAGE PANEL =====
interface HomepageItem {
  id: number;
  type: "product" | "category";
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  position: number;
  active: boolean;
  created_at: string;
}

function SortableHomepageCard({ item, onEdit, onDelete, onToggle }: { item: HomepageItem; onEdit: (item: HomepageItem) => void; onDelete: (id: number) => void; onToggle: (id: number, active: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`hp-card ${!item.active ? "hp-card--inactive" : ""}`}>
      <div className="hp-card__drag" {...attributes} {...listeners}>⠿</div>
      {item.image_url && <img src={item.image_url} alt="" className="hp-card__img" />}
      <div className="hp-card__body">
        <div className="hp-card__header">
          <span className={`hp-card__badge hp-card__badge--${item.type}`}>{item.type === "product" ? "Produs" : "Categorie"}</span>
          <span className="hp-card__title">{item.title || "(fara titlu)"}</span>
        </div>
        {item.description && <p className="hp-card__desc">{item.description}</p>}
        {item.link_url && <span className="hp-card__link">{item.link_url}</span>}
      </div>
      <div className="hp-card__actions">
        <label className="hp-card__toggle" title={item.active ? "Activ" : "Inactiv"}>
          <input type="checkbox" checked={item.active} onChange={(e) => onToggle(item.id, e.target.checked)} />
        </label>
        <button className="admin-action-btn" onClick={() => onEdit(item)} title="Editeaza">✎</button>
        <button className="admin-action-btn admin-action-btn--danger" onClick={() => onDelete(item.id)} title="Sterge">✕</button>
      </div>
    </div>
  );
}

function HomepagePanel({ auth }: { auth: string }) {
  const [items, setItems] = useState<HomepageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [homepageActive, setHomepageActive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<HomepageItem | null>(null);
  const [formType, setFormType] = useState<"product" | "category">("product");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formLink, setFormLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkResults, setLinkResults] = useState<Array<{ name: string; slug: string; image?: string }>>([]);
  const [linkSearching, setLinkSearching] = useState(false);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const linkSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkDropdownRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/homepage", { headers: { Authorization: auth } });
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
    setLoading(false);
  }, [auth]);

  // Load items + homepage_active setting
  useEffect(() => {
    fetchItems();
    fetch("/api/admin/settings", { headers: { Authorization: auth } })
      .then(r => r.json())
      .then(data => {
        if (data.homepage_active !== undefined) setHomepageActive(!!data.homepage_active);
      })
      .catch(() => {});
  }, [fetchItems, auth]);

  const toggleHomepage = async (active: boolean) => {
    setHomepageActive(active);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ homepage_active: active }),
    });
  };

  const openAddForm = (type: "product" | "category") => {
    setEditingItem(null);
    setFormType(type);
    setFormTitle("");
    setFormDesc("");
    setFormImage("");
    setFormLink("");
    setShowForm(true);
  };

  const openEditForm = (item: HomepageItem) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormDesc(item.description);
    setFormImage(item.image_url);
    setFormLink(item.link_url);
    setShowForm(true);
  };

  const saveForm = async () => {
    setSaving(true);
    if (editingItem) {
      await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingItem.id, type: formType, title: formTitle, description: formDesc, image_url: formImage, link_url: formLink }),
      });
    } else {
      await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ type: formType, title: formTitle, description: formDesc, image_url: formImage, link_url: formLink }),
      });
    }
    setSaving(false);
    setShowForm(false);
    fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Stergi acest item?")) return;
    await fetch(`/api/admin/homepage?id=${id}`, { method: "DELETE", headers: { Authorization: auth } });
    fetchItems();
  };

  const toggleItem = async (id: number, active: boolean) => {
    await fetch("/api/admin/homepage", {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, active } : i));
  };

  // Image upload via file or drag & drop
  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (data.url) setFormImage(data.url);
    } catch {}
    setUploading(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadImage(file);
  };

  // Link search - search products or categories
  const searchLinks = (query: string) => {
    setLinkSearch(query);
    setShowLinkDropdown(true);
    if (linkSearchTimeout.current) clearTimeout(linkSearchTimeout.current);
    if (!query.trim()) { setLinkResults([]); return; }
    linkSearchTimeout.current = setTimeout(async () => {
      setLinkSearching(true);
      try {
        const results: Array<{ name: string; slug: string; image?: string }> = [];
        if (formType === "category" || formType === "product") {
          // Search categories
          const catRes = await fetch("/api/categories");
          if (catRes.ok) {
            const cats = await catRes.json();
            const filtered = cats.filter((c: { name: string }) => c.name.toLowerCase().includes(query.toLowerCase()));
            for (const c of filtered.slice(0, 5)) {
              results.push({ name: c.name, slug: `/produse/${c.slug}`, image: c.image_url || c.r2_image_url });
            }
          }
          // Search products
          const prodRes = await fetch(`/api/products?search=${encodeURIComponent(query)}&per_page=5`);
          if (prodRes.ok) {
            const data = await prodRes.json();
            for (const p of (data.products || [])) {
              results.push({ name: p.name, slug: `/produse/${(p.category_slugs || [])[0] || "produs"}/${p.slug}`, image: p.r2_image_url || p.image_url });
            }
          }
        }
        setLinkResults(results);
      } catch {}
      setLinkSearching(false);
    }, 300);
  };

  const selectLink = (result: { name: string; slug: string; image?: string }) => {
    setFormLink(result.slug);
    if (!formTitle) setFormTitle(result.name);
    if (!formImage && result.image) setFormImage(result.image);
    setShowLinkDropdown(false);
    setLinkSearch("");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (linkDropdownRef.current && !linkDropdownRef.current.contains(e.target as Node)) setShowLinkDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    // Save new positions
    const reorder = reordered.map((item, idx) => ({ id: item.id, position: idx }));
    await fetch("/api/admin/homepage", {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ reorder }),
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px" }}>
      {/* Toggle */}
      <div className="hp-toggle-row">
        <label className="hp-toggle">
          <input type="checkbox" checked={homepageActive} onChange={(e) => toggleHomepage(e.target.checked)} />
          <span className="hp-toggle__slider" />
        </label>
        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Activeaza Homepage {homepageActive ? <span style={{ color: "var(--color-success)" }}>(activ)</span> : <span style={{ color: "var(--color-text-muted)" }}>(inactiv)</span>}
        </span>
      </div>

      {/* Add buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="admin-add-btn" onClick={() => openAddForm("product")}>
          <span className="admin-add-btn__plus">+</span> Adauga produs
        </button>
        <button className="admin-add-btn" onClick={() => openAddForm("category")}>
          <span className="admin-add-btn__plus">+</span> Adauga categorie
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="hp-form">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "0.9rem", margin: 0, fontWeight: 700 }}>{editingItem ? "Editeaza" : "Adauga"} {formType === "product" ? "produs" : "categorie"}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "var(--color-text-muted)", padding: "0 4px" }}>✕</button>
          </div>

          <div className="hp-form__fields">
            {/* Type selector */}
            <div className="hp-form__type-selector">
              <button className={`hp-form__type-btn ${formType === "product" ? "hp-form__type-btn--active" : ""}`} onClick={() => setFormType("product")}>Produs</button>
              <button className={`hp-form__type-btn ${formType === "category" ? "hp-form__type-btn--active" : ""}`} onClick={() => setFormType("category")}>Categorie</button>
            </div>

            {/* Link search */}
            <div className="hp-form__row" style={{ position: "relative" }} ref={linkDropdownRef}>
              <label>Link</label>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  value={showLinkDropdown ? linkSearch : (formLink || "")}
                  onChange={(e) => searchLinks(e.target.value)}
                  onFocus={() => { setLinkSearch(""); setShowLinkDropdown(true); }}
                  placeholder="Cauta produs sau categorie..."
                  autoComplete="off"
                />
                {formLink && !showLinkDropdown && (
                  <button onClick={() => { setFormLink(""); setFormTitle(""); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>✕</button>
                )}
                {showLinkDropdown && (linkResults.length > 0 || linkSearching) && (
                  <div className="hp-form__dropdown">
                    {linkSearching && <div className="hp-form__dropdown-item hp-form__dropdown-item--loading">Se cauta...</div>}
                    {linkResults.map((r, i) => (
                      <button key={i} className="hp-form__dropdown-item" onClick={() => selectLink(r)}>
                        {r.image && <img src={r.image} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>{r.slug}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {formLink && <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginTop: -4, paddingLeft: 80 }}>{formLink}</div>}

            {/* Title */}
            <div className="hp-form__row">
              <label>Titlu</label>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Titlu afisat pe homepage" />
            </div>

            {/* Description */}
            <div className="hp-form__row">
              <label>Descriere</label>
              <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Descriere scurta (optional)" />
            </div>

            {/* Image upload with drag & drop */}
            <div className="hp-form__row" style={{ alignItems: "flex-start" }}>
              <label style={{ paddingTop: 8 }}>Imagine</label>
              <div style={{ flex: 1 }}>
                <div
                  className={`hp-form__dropzone ${dragging ? "hp-form__dropzone--active" : ""} ${formImage ? "hp-form__dropzone--has-image" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleImageDrop}
                  onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadImage(f); }; inp.click(); }}
                >
                  {uploading ? (
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Se incarca...</span>
                  ) : formImage ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                      <img src={formImage} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{formImage.split("/").pop()}</span>
                      <button onClick={(e) => { e.stopPropagation(); setFormImage(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "0.85rem", flexShrink: 0 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", marginBottom: 4, opacity: 0.4 }}>&#128247;</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Trage o imagine aici sau click pentru upload</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button className="admin-inline-btn" onClick={() => setShowForm(false)}>Anuleaza</button>
              <button className="admin-add-btn" onClick={saveForm} disabled={saving || !formTitle} style={{ minWidth: 100 }}>{saving ? "Se salveaza..." : "Salveaza"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Items list with drag-and-drop */}
      {loading ? <p className="admin-loading">Se incarca...</p> : items.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 40, fontSize: "0.85rem" }}>Niciun item adaugat. Adauga produse sau categorii pentru homepage.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="hp-list">
              {items.map(item => (
                <SortableHomepageCard key={item.id} item={item} onEdit={openEditForm} onDelete={deleteItem} onToggle={toggleItem} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ===== PRINT EDITOR MODAL =====
// ===== EDITOR PANEL (standalone print editor) =====
function EditorPanel({ auth }: { auth: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);

  // Image source
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product selector
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Font options
  const FONTS = [
    { id: "kalam", label: "Kalam", family: "PrintKalam", file: "/font/kalam.ttf" },
    { id: "crack", label: "Crack", family: "PrintCrack", file: "/font/crack.ttf" },
    { id: "minecraft", label: "Minecraft", family: "PrintMinecraft", file: "/font/minecraft.otf" },
    { id: "nougat", label: "Nougat", family: "PrintNougat", file: "/font/nougat.ttf" },
    { id: "roblox", label: "Roblox", family: "PrintRoblox", file: "/font/roblox.otf" },
    { id: "stitch", label: "Stitch", family: "PrintStitch", file: "/font/stitch.ttf" },
    { id: "zoetic", label: "Zoetic", family: "PrintZoetic", file: "/font/zoetic.ttf" },
  ];

  // Text controls
  const [customName, setCustomName] = useState("");
  const [selectedFont, setSelectedFont] = useState("kalam");
  const [fontReady, setFontReady] = useState(false);
  const [textOffset, setTextOffset] = useState(0);
  const [fontSize, setFontSize] = useState(200);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [shadowBlur, setShadowBlur] = useState(20);
  const [shadowColorHex, setShadowColorHex] = useState("#000000");
  const [shadowOpacity, setShadowOpacity] = useState(1);
  const [shadowSpread, setShadowSpread] = useState(0);
  // Image controls
  const [imgOffsetX, setImgOffsetX] = useState(0);
  const [imgOffsetY, setImgOffsetY] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);
  const [bgColor, setBgColor] = useState("#000000");
  const draggingRef = useRef(false);
  const imgDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const loadedFontsRef = useRef<Set<string>>(new Set());

  const W = 1080;
  const H = 1920;
  const BASE_Y = 0.85;
  const EM_PX = fontSize;

  const currentFont = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load all fonts
  useEffect(() => {
    FONTS.forEach(async (f) => {
      if (loadedFontsRef.current.has(f.family)) return;
      try {
        const fontFace = new FontFace(f.family, `url(${f.file})`);
        const loadedFont = await fontFace.load();
        document.fonts.add(loadedFont);
        loadedFontsRef.current.add(f.family);
      } catch (e) { console.warn(`Failed to load font ${f.label}:`, e); }
    });
  }, []);

  // Ensure selected font is loaded
  useEffect(() => {
    if (loadedFontsRef.current.has(currentFont.family)) { setFontReady(true); return; }
    setFontReady(false);
    const check = () => {
      document.fonts.load(`${fontSize}px "${currentFont.family}"`).then(() => {
        loadedFontsRef.current.add(currentFont.family);
        setFontReady(true);
      }).catch(() => setFontReady(true));
    };
    check();
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [selectedFont, fontSize, currentFont.family]);

  // Load products with print images
  useEffect(() => {
    const fetchAll = async () => {
      let page = 1;
      let all: Product[] = [];
      while (true) {
        const res = await fetch(`/api/products?page=${page}&per_page=100`);
        if (!res.ok) break;
        const data = await res.json();
        const prods = (data.products || []) as Product[];
        all = all.concat(prods.filter((p: Product) => p.print_image_url));
        if (page >= (data.total_pages || 1)) break;
        page++;
      }
      setProducts(all);
    };
    fetchAll();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handle uploaded image
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    setSelectedProduct(null); // uploaded image takes priority
    setImgOffsetX(0); setImgOffsetY(0); setImgZoom(1);
    // Load into canvas
    const img = new Image();
    img.onload = () => { sourceImgRef.current = img; setLoaded(true); };
    img.src = url;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  // Handle product selection
  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setShowDropdown(false);
    setProductSearch("");
    // Clear uploaded image
    if (uploadedImageUrl) { URL.revokeObjectURL(uploadedImageUrl); setUploadedImageUrl(null); setUploadedFile(null); }
    setImgOffsetX(0); setImgOffsetY(0); setImgZoom(1);
    // Load product print image
    if (p.print_image_url) {
      setLoaded(false);
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(p.print_image_url)}`;
      fetch(proxyUrl)
        .then(r => r.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => { sourceImgRef.current = img; setLoaded(true); };
          img.onerror = () => setLoaded(false);
          img.src = url;
        })
        .catch(() => setLoaded(false));
    }
  };

  // Filter products for dropdown
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filteredProducts = productSearch.trim()
    ? products.filter(p => normalize(p.name).includes(normalize(productSearch)))
    : products;

  // Redraw canvas
  useEffect(() => {
    if (!loaded || !fontReady || !canvasRef.current || !sourceImgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const img = sourceImgRef.current;

    // Background color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Draw image with zoom + offset
    const scale = imgZoom;
    const baseW = img.width * scale;
    const baseH = img.height * scale;
    // Center image, then apply offset
    const drawX = (W - baseW) / 2 + imgOffsetX;
    const drawY = (H - baseH) / 2 + imgOffsetY;
    ctx.drawImage(img, drawX, drawY, baseW, baseH);

    // Draw text
    if (customName) {
      ctx.font = `${fontSize}px "${currentFont.family}", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const offsetPx = textOffset * EM_PX;
      const textY = Math.max(fontSize / 2, Math.min(H - 4, H * BASE_Y + offsetPx));

      if (shadowEnabled && shadowSpread > 0) {
        const r = parseInt(shadowColorHex.slice(1,3), 16);
        const g = parseInt(shadowColorHex.slice(3,5), 16);
        const b = parseInt(shadowColorHex.slice(5,7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},${shadowOpacity})`;
        ctx.shadowColor = "transparent";
        for (let sx = -shadowSpread; sx <= shadowSpread; sx++) {
          for (let sy = -shadowSpread; sy <= shadowSpread; sy++) {
            if (sx * sx + sy * sy <= shadowSpread * shadowSpread) {
              ctx.fillText(customName, W / 2 + sx, textY + sy, W - 40);
            }
          }
        }
      }

      if (shadowEnabled) {
        const r = parseInt(shadowColorHex.slice(1,3), 16);
        const g = parseInt(shadowColorHex.slice(3,5), 16);
        const b = parseInt(shadowColorHex.slice(5,7), 16);
        ctx.shadowColor = `rgba(${r},${g},${b},${shadowOpacity})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = textColor;
      ctx.fillText(customName, W / 2, textY, W - 40);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }, [loaded, fontReady, customName, textOffset, fontSize, textColor, shadowEnabled, shadowBlur, shadowColorHex, shadowOpacity, shadowSpread, selectedFont, currentFont.family, imgOffsetX, imgOffsetY, imgZoom, bgColor]);

  // Canvas mouse handlers for image dragging + text dragging
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    imgDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (imgDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      const rect = canvasRef.current!.getBoundingClientRect();
      setImgOffsetX(prev => prev + dx * (W / rect.width));
      setImgOffsetY(prev => prev + dy * (H / rect.height));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseUp = () => { imgDraggingRef.current = false; };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setImgZoom(prev => Math.max(0.1, Math.min(5, prev + (e.deltaY < 0 ? 0.05 : -0.05))));
  };

  // Download
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95));
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = "husa personalizata.jpg";
      a.click();
      URL.revokeObjectURL(dlUrl);
    } catch (e) { console.error("Download failed:", e); }
    finally { setSaving(false); }
  };

  const labelStyle = { fontSize: "0.72rem" as const, fontWeight: 600 as const, marginBottom: 3 };
  const rowStyle = { display: "flex" as const, alignItems: "center" as const, gap: 6 };

  const hasSource = loaded && sourceImgRef.current;

  // The editor content (shared between desktop inline and mobile modal)
  const editorContent = (
    <div className="editor-panel-content">
      {/* Source selectors: upload + product dropdown */}
      <div className="editor-source-row">
        {/* Image upload drop zone */}
        <div
          className={`editor-dropzone ${dragActive ? "editor-dropzone--active" : ""} ${uploadedImageUrl ? "editor-dropzone--has-image" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: "none" }} />
          {uploadedImageUrl ? (
            <div className="editor-dropzone__preview">
              <img src={uploadedImageUrl} alt="Uploaded" />
              <span>Schimba imaginea</span>
            </div>
          ) : (
            <div className="editor-dropzone__placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span>Incarca imagine</span>
              <small>Drag & drop sau click</small>
            </div>
          )}
        </div>

        <div className="editor-source-divider">sau</div>

        {/* Product selector */}
        <div className="editor-product-select" ref={dropdownRef}>
          <div className="editor-product-select__trigger" onClick={() => setShowDropdown(!showDropdown)}>
            {selectedProduct ? (
              <div className="editor-product-select__selected">
                {selectedProduct.print_image_url && <img src={selectedProduct.print_image_url} alt="" />}
                <span>{selectedProduct.name}</span>
              </div>
            ) : (
              <span className="editor-product-select__placeholder">Selecteaza produsul</span>
            )}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          {showDropdown && (
            <div className="editor-product-dropdown">
              <input
                className="editor-product-dropdown__search"
                type="text"
                placeholder="Cauta dupa nume..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <div className="editor-product-dropdown__list">
                {filteredProducts.length === 0 ? (
                  <div className="editor-product-dropdown__empty">Niciun produs gasit</div>
                ) : (
                  filteredProducts.map((p) => (
                    <div key={p.id} className="editor-product-dropdown__item" onClick={() => selectProduct(p)}>
                      <img src={p.print_image_url || p.r2_image_url || p.image_url} alt="" />
                      <span>{p.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor layout: canvas + controls */}
      <div className="print-editor-layout" style={{ marginTop: 16 }}>
        {/* Left: Canvas preview with mockup overlay */}
        <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center", alignItems: "flex-start", background: "#e5e7eb", borderRadius: 8, padding: 8, minWidth: 160 }}>
          {!hasSource ? (
            <div style={{ color: "#aaa", padding: 40, textAlign: "center", fontSize: "0.8rem", minHeight: 340, display: "flex", alignItems: "center" }}>
              Incarca o imagine sau selecteaza un produs
            </div>
          ) : null}
          <div className="editor-canvas-wrap" style={{ position: "relative", display: hasSource ? "block" : "none" }}>
            <canvas ref={canvasRef} width={W} height={H}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleCanvasWheel}
              style={{ height: 340, width: "auto", borderRadius: 6, display: "block", cursor: "move" }} />
          </div>
        </div>

        {/* Right: Controls */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {/* Text */}
          <div>
            <div style={labelStyle}>Text</div>
            <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} style={{ width: "100%", fontSize: "0.8rem", padding: "5px 8px", border: "1px solid var(--color-border)", borderRadius: 4, boxSizing: "border-box" }} placeholder="Text pe husa" />
          </div>

          {/* Font */}
          <div>
            <div style={labelStyle}>Font</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {FONTS.map((f) => (
                <label key={f.id} onClick={() => setSelectedFont(f.id)}
                  style={{ padding: "3px 8px", borderRadius: 5, cursor: "pointer", fontSize: "0.78rem",
                    border: selectedFont === f.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                    background: selectedFont === f.id ? "rgba(0,102,204,0.08)" : "transparent" }}>
                  <input type="radio" name="editorFont" value={f.id} checked={selectedFont === f.id} onChange={() => setSelectedFont(f.id)} style={{ display: "none" }} />
                  <span style={{ fontFamily: `"${f.family}", sans-serif` }}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pozitie */}
          <div>
            <div style={labelStyle}>Pozitie</div>
            <div style={rowStyle}>
              <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>Sus</span>
              <input type="range" min={-5} max={5} step={0.1} value={textOffset} onChange={(e) => setTextOffset(+e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>Jos</span>
              <button className="awb-btn" onClick={() => setTextOffset(0)} style={{ fontSize: "0.6rem", padding: "1px 5px" }}>Reset</button>
            </div>
          </div>

          {/* Marime */}
          <div>
            <div style={labelStyle}>Marime</div>
            <div style={rowStyle}>
              <input type="range" min={40} max={400} step={1} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: "0.7rem", minWidth: 32 }}>{fontSize}px</span>
            </div>
          </div>

          {/* Culoare text */}
          <div>
            <div style={labelStyle}>Culoare text</div>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="editor-color-swatch" />
          </div>

          {/* Background */}
          <div>
            <div style={labelStyle}>Background</div>
            <div style={rowStyle}>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="editor-color-swatch" />
              <span style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}>{bgColor}</span>
            </div>
          </div>

          {/* Shadow */}
          <div>
            <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
              Shadow
              <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.68rem", cursor: "pointer", fontWeight: 400 }}>
                <input type="checkbox" checked={shadowEnabled} onChange={(e) => setShadowEnabled(e.target.checked)} />
                Activ
              </label>
            </div>
            {shadowEnabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={rowStyle}>
                  <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Blur</span>
                  <input type="range" min={0} max={300} step={1} value={shadowBlur} onChange={(e) => setShadowBlur(+e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: "0.68rem", minWidth: 20 }}>{shadowBlur}</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Culoare</span>
                  <input type="color" value={shadowColorHex} onChange={(e) => setShadowColorHex(e.target.value)} style={{ width: 36, height: 22, border: "none", padding: 0, cursor: "pointer", borderRadius: 3 }} />
                </div>
                <div style={rowStyle}>
                  <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Opac.</span>
                  <input type="range" min={0} max={1} step={0.05} value={shadowOpacity} onChange={(e) => setShadowOpacity(+e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: "0.68rem", minWidth: 26 }}>{Math.round(shadowOpacity * 100)}%</span>
                </div>
                <div style={rowStyle}>
                  <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Gros.</span>
                  <input type="range" min={0} max={20} step={1} value={shadowSpread} onChange={(e) => setShadowSpread(+e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: "0.68rem", minWidth: 20 }}>{shadowSpread}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download buttons */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="awb-btn" onClick={handleDownload} disabled={saving || !hasSource} style={{ fontSize: "0.78rem", padding: "8px 20px", background: "var(--color-primary)", color: "#fff", borderRadius: 6, fontWeight: 600 }}>
          {saving ? "Se descarca..." : "Descarca"}
        </button>
      </div>
    </div>
  );

  // Mobile: modal, Desktop: inline page
  if (isMobile) {
    return (
      <div style={{ padding: 16 }}>
        <button className="awb-btn" onClick={() => setShowMobileEditor(true)} style={{ fontSize: "0.85rem", padding: "12px 24px", background: "var(--color-primary)", color: "#fff", borderRadius: 8, fontWeight: 600, width: "100%" }}>
          Deschide Editor
        </button>
        {showMobileEditor && (
          <div className="ot-modal-overlay" onClick={() => setShowMobileEditor(false)}>
            <div className="ot-modal editor-modal-mobile" onClick={(e) => e.stopPropagation()}>
              <div className="ot-modal__header">
                <h2>Editor</h2>
                <button className="ot-modal__close" onClick={() => setShowMobileEditor(false)}>✕</button>
              </div>
              <div className="ot-modal__body" style={{ padding: 12 }}>
                {editorContent}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: simple inline page
  return (
    <div className="editor-panel-desktop">
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>Editor Print</h2>
      {editorContent}
    </div>
  );
}

function PrintEditorModal({ order, auth, onUpdate, onClose, initialUseOriginal }: { order: Order; auth: string; onUpdate: () => void; onClose: () => void; initialUseOriginal?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  // Font options - local files from /font directory
  const FONTS = [
    { id: "kalam", label: "Kalam", family: "PrintKalam", file: "/font/kalam.ttf" },
    { id: "crack", label: "Crack", family: "PrintCrack", file: "/font/crack.ttf" },
    { id: "minecraft", label: "Minecraft", family: "PrintMinecraft", file: "/font/minecraft.otf" },
    { id: "nougat", label: "Nougat", family: "PrintNougat", file: "/font/nougat.ttf" },
    { id: "roblox", label: "Roblox", family: "PrintRoblox", file: "/font/roblox.otf" },
    { id: "stitch", label: "Stitch", family: "PrintStitch", file: "/font/stitch.ttf" },
    { id: "zoetic", label: "Zoetic", family: "PrintZoetic", file: "/font/zoetic.ttf" },
  ];

  // Text controls - editable
  const [customName, setCustomName] = useState(order.custom_name || "");
  const [selectedFont, setSelectedFont] = useState("kalam");
  const [fontReady, setFontReady] = useState(false);
  const [textOffset, setTextOffset] = useState(0); // -5 to +5 em offset from base position (0.85)
  const [fontSize, setFontSize] = useState(200);
  const [textColor, setTextColor] = useState(order.text_color || "#FFFFFF");
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [shadowBlur, setShadowBlur] = useState(20);
  const [shadowColorHex, setShadowColorHex] = useState("#000000");
  const [shadowOpacity, setShadowOpacity] = useState(1);
  const [shadowSpread, setShadowSpread] = useState(0);
  const [useOriginal, setUseOriginal] = useState(initialUseOriginal || false);
  const [imgOffsetX, setImgOffsetX] = useState(0);
  const [imgOffsetY, setImgOffsetY] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);
  const draggingRef = useRef(false);
  const imgDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const origImgRef = useRef<HTMLImageElement | null>(null);
  const loadedFontsRef = useRef<Set<string>>(new Set());

  const W = 1080;
  const H = 1920;
  const BASE_Y = 0.85;
  const EM_PX = fontSize;

  const currentFont = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  // Load all local fonts on mount via FontFace API
  useEffect(() => {
    FONTS.forEach(async (f) => {
      if (loadedFontsRef.current.has(f.family)) return;
      try {
        const fontFace = new FontFace(f.family, `url(${f.file})`);
        const loadedFont = await fontFace.load();
        document.fonts.add(loadedFont);
        loadedFontsRef.current.add(f.family);
      } catch (e) { console.warn(`Failed to load font ${f.label}:`, e); }
    });
  }, []);

  // Ensure selected font is loaded before drawing
  useEffect(() => {
    if (loadedFontsRef.current.has(currentFont.family)) { setFontReady(true); return; }
    setFontReady(false);
    const check = () => {
      document.fonts.load(`${fontSize}px "${currentFont.family}"`).then(() => {
        loadedFontsRef.current.add(currentFont.family);
        setFontReady(true);
      }).catch(() => setFontReady(true));
    };
    check();
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [selectedFont, fontSize, currentFont.family]);

  // For design: use design_image_url (1080x1920), for personalized: use image_url (cropped)
  const sourceImageUrl = order.design_image_url || order.image_url;

  // Load source image via server proxy to avoid CORS canvas tainting
  useEffect(() => {
    if (!sourceImageUrl) return;
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(sourceImageUrl)}`;
    fetch(proxyUrl)
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { cropImgRef.current = img; setLoaded(true); setLoadError(false); };
        img.onerror = () => setLoadError(true);
        img.src = url;
      })
      .catch(() => setLoadError(true));
  }, [sourceImageUrl]);

  // Load original image when useOriginal toggled
  useEffect(() => {
    if (!useOriginal || !order.original_image_url) return;
    if (origImgRef.current) return; // already loaded
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(order.original_image_url)}`;
    fetch(proxyUrl)
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { origImgRef.current = img; setImgOffsetX(0); setImgOffsetY(0); setImgZoom(1); };
        img.src = url;
      });
  }, [useOriginal, order.original_image_url]);

  // Redraw canvas on any parameter change
  useEffect(() => {
    if (!loaded || !fontReady || !canvasRef.current || !cropImgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const activeImg = (useOriginal && origImgRef.current) ? origImgRef.current : cropImgRef.current;

    ctx.clearRect(0, 0, W, H);

    if (useOriginal && origImgRef.current) {
      // Draw original with zoom + offset (user positions it)
      const img = origImgRef.current;
      const scale = imgZoom;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = (W - drawW) / 2 + imgOffsetX;
      const drawY = (H - drawH) / 2 + imgOffsetY;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Draw cropped/design to fill canvas
      const img = cropImgRef.current;
      const imgRatio = img.width / img.height;
      const canvasRatio = W / H;
      let drawW = W, drawH = H, drawX = 0, drawY = 0;
      if (imgRatio > canvasRatio) {
        drawW = H * imgRatio;
        drawX = (W - drawW) / 2;
      } else {
        drawH = W / imgRatio;
        drawY = (H - drawH) / 2;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // Draw text
    if (customName) {
      ctx.font = `${fontSize}px "${currentFont.family}", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Position: base Y + offset in px (clamped to canvas, allow to bottom edge)
      const offsetPx = textOffset * EM_PX;
      const textY = Math.max(fontSize / 2, Math.min(H - 4, H * BASE_Y + offsetPx));

      if (shadowEnabled && shadowSpread > 0) {
        // Draw spread (stroke-like shadow) by drawing text multiple times
        const r = parseInt(shadowColorHex.slice(1,3), 16);
        const g = parseInt(shadowColorHex.slice(3,5), 16);
        const b = parseInt(shadowColorHex.slice(5,7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},${shadowOpacity})`;
        ctx.shadowColor = "transparent";
        for (let sx = -shadowSpread; sx <= shadowSpread; sx++) {
          for (let sy = -shadowSpread; sy <= shadowSpread; sy++) {
            if (sx * sx + sy * sy <= shadowSpread * shadowSpread) {
              ctx.fillText(customName, W / 2 + sx, textY + sy, W - 40);
            }
          }
        }
      }

      if (shadowEnabled) {
        const r = parseInt(shadowColorHex.slice(1,3), 16);
        const g = parseInt(shadowColorHex.slice(3,5), 16);
        const b = parseInt(shadowColorHex.slice(5,7), 16);
        ctx.shadowColor = `rgba(${r},${g},${b},${shadowOpacity})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.fillStyle = textColor;
      ctx.fillText(customName, W / 2, textY, W - 40);

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }, [loaded, fontReady, customName, textOffset, fontSize, textColor, shadowEnabled, shadowBlur, shadowColorHex, shadowOpacity, shadowSpread, selectedFont, currentFont.family, useOriginal, imgOffsetX, imgOffsetY, imgZoom]);

  const sanitize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[șȘ]/g, "s").replace(/[țȚ]/g, "t").replace(/[ăĂ]/g, "a").replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const printFileName = `${order.id}_${sanitize(order.customer_name)}_${order.product_name ? sanitize(order.product_name) : ""}${order.brand_name ? `_${sanitize(order.brand_name)}` : ""}${order.model_name ? `_${sanitize(order.model_name)}` : ""}.jpg`.replace(/_+/g, "_").replace(/_\./g, ".");

  // Mouse handlers for canvas
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (useOriginal) {
      imgDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (customName) {
      draggingRef.current = true;
      const { y } = getCanvasCoords(e);
      setTextOffset(Math.max(-5, Math.min(5, (y - H * BASE_Y) / EM_PX)));
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (imgDraggingRef.current && useOriginal) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      const rect = canvasRef.current!.getBoundingClientRect();
      setImgOffsetX(prev => prev + dx * (W / rect.width));
      setImgOffsetY(prev => prev + dy * (H / rect.height));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else if (draggingRef.current) {
      const { y } = getCanvasCoords(e);
      setTextOffset(Math.max(-5, Math.min(5, (y - H * BASE_Y) / EM_PX)));
    }
  };

  const handleCanvasMouseUp = () => { draggingRef.current = false; imgDraggingRef.current = false; };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!useOriginal) return;
    e.preventDefault();
    setImgZoom(prev => Math.max(0.1, Math.min(5, prev + (e.deltaY < 0 ? 0.05 : -0.05))));
  };

  const handleSaveAndDownload = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;

      // Download to computer
      const downloadBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95));
      const dlUrl = URL.createObjectURL(downloadBlob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = printFileName;
      a.click();
      URL.revokeObjectURL(dlUrl);

      // Upload and save to DB
      const uploadBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95));
      const fd = new FormData();
      fd.append("file", uploadBlob, `print-${order.id}-${Date.now()}.jpg`);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();

      // Build update payload - always save print image, also save text changes if modified
      const updatePayload: Record<string, unknown> = { id: order.id };
      if (uploadData.url) updatePayload.print_image_url = uploadData.url;
      if (customName !== order.custom_name) updatePayload.custom_name = customName;
      if (textColor !== (order.text_color || "#FFFFFF")) updatePayload.text_color = textColor;

      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      onUpdate();
      onClose();
    } catch (e) { console.error("Print save failed:", e); }
    finally { setSaving(false); }
  };

  const labelStyle = { fontSize: "0.72rem" as const, fontWeight: 600 as const, marginBottom: 3 };
  const rowStyle = { display: "flex" as const, alignItems: "center" as const, gap: 6 };

  return (
    <div className="ot-modal-overlay" onClick={onClose}>
      <div className="ot-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820, width: "95vw" }}>
        <div className="ot-modal__header">
          <h2>Editor PRINT</h2>
          <button className="ot-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="ot-modal__body" style={{ padding: 16 }}>
          {/* Row 1: two columns desktop, single column mobile */}
          <div className="print-editor-layout">
            {/* Left: Canvas preview */}
            <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center", alignItems: "flex-start", background: "#e5e7eb", borderRadius: 8, padding: 8, minWidth: 160 }}>
              {loadError ? (
                <div style={{ color: "#f66", padding: 20, textAlign: "center", fontSize: "0.8rem" }}>Eroare incarcare imagine.</div>
              ) : !loaded ? (
                <div style={{ color: "#aaa", padding: 20, textAlign: "center", fontSize: "0.8rem" }}>Se incarca...</div>
              ) : null}
              <canvas ref={canvasRef} width={W} height={H}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleCanvasWheel}
                style={{ height: 340, width: "auto", borderRadius: 6, display: loaded ? "block" : "none", cursor: useOriginal ? "move" : customName ? "grab" : "default" }} />
            </div>

            {/* Right: Controls */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              {/* Text */}
              <div>
                <div style={labelStyle}>Text</div>
                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} style={{ width: "100%", fontSize: "0.8rem", padding: "5px 8px", border: "1px solid var(--color-border)", borderRadius: 4, boxSizing: "border-box" }} placeholder="Text pe husa" />
              </div>

              {/* Font */}
              <div>
                <div style={labelStyle}>Font</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {FONTS.map((f) => (
                    <label key={f.id} onClick={() => setSelectedFont(f.id)}
                      style={{ padding: "3px 8px", borderRadius: 5, cursor: "pointer", fontSize: "0.78rem",
                        border: selectedFont === f.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                        background: selectedFont === f.id ? "rgba(0,102,204,0.08)" : "transparent" }}>
                      <input type="radio" name="printFont" value={f.id} checked={selectedFont === f.id} onChange={() => setSelectedFont(f.id)} style={{ display: "none" }} />
                      <span style={{ fontFamily: `"${f.family}", sans-serif` }}>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pozitie */}
              <div>
                <div style={labelStyle}>Pozitie</div>
                <div style={rowStyle}>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>Sus</span>
                  <input type="range" min={-5} max={5} step={0.1} value={textOffset} onChange={(e) => setTextOffset(+e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: "0.65rem", color: "var(--color-muted)" }}>Jos</span>
                  <button className="awb-btn" onClick={() => setTextOffset(0)} style={{ fontSize: "0.6rem", padding: "1px 5px" }}>Reset</button>
                </div>
              </div>

              {/* Marime */}
              <div>
                <div style={labelStyle}>Marime</div>
                <div style={rowStyle}>
                  <input type="range" min={40} max={400} step={1} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontSize: "0.7rem", minWidth: 32 }}>{fontSize}px</span>
                </div>
              </div>

              {/* Culoare text */}
              <div>
                <div style={labelStyle}>Culoare text</div>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: 48, height: 26, border: "none", padding: 0, cursor: "pointer", borderRadius: 4 }} />
              </div>

              {/* Shadow */}
              <div>
                <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 6 }}>
                  Shadow
                  <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.68rem", cursor: "pointer", fontWeight: 400 }}>
                    <input type="checkbox" checked={shadowEnabled} onChange={(e) => setShadowEnabled(e.target.checked)} />
                    Activ
                  </label>
                </div>
                {shadowEnabled && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={rowStyle}>
                      <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Blur</span>
                      <input type="range" min={0} max={300} step={1} value={shadowBlur} onChange={(e) => setShadowBlur(+e.target.value)} style={{ flex: 1 }} />
                      <span style={{ fontSize: "0.68rem", minWidth: 20 }}>{shadowBlur}</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Culoare</span>
                      <input type="color" value={shadowColorHex} onChange={(e) => setShadowColorHex(e.target.value)} style={{ width: 36, height: 22, border: "none", padding: 0, cursor: "pointer", borderRadius: 3 }} />
                    </div>
                    <div style={rowStyle}>
                      <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Opac.</span>
                      <input type="range" min={0} max={1} step={0.05} value={shadowOpacity} onChange={(e) => setShadowOpacity(+e.target.value)} style={{ flex: 1 }} />
                      <span style={{ fontSize: "0.68rem", minWidth: 26 }}>{Math.round(shadowOpacity * 100)}%</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={{ fontSize: "0.65rem", minWidth: 28 }}>Gros.</span>
                      <input type="range" min={0} max={20} step={1} value={shadowSpread} onChange={(e) => setShadowSpread(+e.target.value)} style={{ flex: 1 }} />
                      <span style={{ fontSize: "0.68rem", minWidth: 20 }}>{shadowSpread}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Action button */}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button className="awb-btn" onClick={handleSaveAndDownload} disabled={saving || !loaded} style={{ fontSize: "0.78rem", padding: "8px 20px", background: "var(--color-primary)", color: "#fff", borderRadius: 6, fontWeight: 600 }}>
              {saving ? "Se salveaza..." : "Descarca PRINT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== ORDER IMAGES (with PRINT generation) =====
function OrderImages({ order, auth, onUpdate, onLightbox }: { order: Order; auth: string; onUpdate: () => void; onLightbox: (imgs: string[], names: string[], idx: number, url: string) => void }) {
  const [showPrintEditor, setShowPrintEditor] = useState(false);
  const [printUseOriginal, setPrintUseOriginal] = useState(false);

  const downloadImage = (url: string, name: string) => {
    fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = name;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  const openPrintEditor = async () => {
    // If regenerating, clear old print image first
    if (order.print_image_url) {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, print_image_url: "" }),
      });
      onUpdate();
    }
    setShowPrintEditor(true);
  };

  const sanitize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[șȘ]/g, "s").replace(/[țȚ]/g, "t").replace(/[ăĂ]/g, "a").replace(/[âÂ]/g, "a").replace(/[îÎ]/g, "i").replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const printFileName = `${order.id}_${sanitize(order.customer_name)}_${order.product_name ? sanitize(order.product_name) : ""}${order.brand_name ? `_${sanitize(order.brand_name)}` : ""}${order.model_name ? `_${sanitize(order.model_name)}` : ""}.jpg`.replace(/_+/g, "_").replace(/_\./g, ".");

  const hasDesign = !!order.design_image_url;
  const imgEntries: [string, string | undefined][] = hasDesign
    ? [["Originala", order.original_image_url], ["Design 1080", order.design_image_url], ["Finala", order.final_image_url], ["PRINT", order.print_image_url]]
    : [["Originala", order.original_image_url], ["Cropata", order.image_url], ["Finala", order.final_image_url], ["PRINT", order.print_image_url]];
  const allImgs = imgEntries.map(([, url]) => url);
  const labels = imgEntries.map(([label]) => label);
  const imgs = allImgs.filter(Boolean) as string[];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Imagini</h3>
        <div style={{ display: "flex", gap: 4 }}>
          {order.print_image_url && (
            <button className="awb-btn" onClick={() => downloadImage(order.print_image_url!, printFileName)} title="Descarca PRINT" style={{ fontSize: "0.68rem", color: "var(--color-primary)" }}>Descarca PRINT</button>
          )}
          {order.original_image_url && (
            <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.68rem", cursor: "pointer" }}>
              <input type="checkbox" checked={printUseOriginal} onChange={(e) => setPrintUseOriginal(e.target.checked)} />
              Originala
            </label>
          )}
          <button className="awb-btn" onClick={() => { openPrintEditor(); }} disabled={!order.image_url} title="Genereaza imagine PRINT (cropata + text)" style={{ fontSize: "0.68rem", background: order.print_image_url ? "transparent" : "rgba(0,102,204,0.1)" }}>
            {order.print_image_url ? "Regenereaza PRINT" : "Genereaza PRINT"}
          </button>
        </div>
      </div>
      <div className="admin-images-grid">
        {allImgs.map((url, i) => url ? (
          <div key={i} className="admin-image-card">
            <span>{labels[i]}</span>
            <img src={url} alt={labels[i]} onClick={() => {
              const imgLabels = imgEntries.filter(([, u]) => u).map(([l]) => l);
              onLightbox(imgs, imgLabels, imgs.indexOf(url), url);
            }} style={{ cursor: "pointer" }} />
          </div>
        ) : null)}
      </div>
      {showPrintEditor && (
        <PrintEditorModal order={order} auth={auth} onUpdate={onUpdate} onClose={() => setShowPrintEditor(false)} initialUseOriginal={printUseOriginal} />
      )}
    </>
  );
}

// ===== AWB SECTION =====
// ===== RAMBURS FIELD =====
function RambursField({ order, auth, onUpdate }: { order: Order; auth: string; onUpdate: () => void }) {
  const dbValue = order.ramburs != null ? order.ramburs : (order.order_value ?? 0);
  const [value, setValue] = useState(String(dbValue));
  const [saving, setSaving] = useState(false);

  // Sync with order data when it changes (after refresh)
  useEffect(() => {
    setValue(String(order.ramburs != null ? order.ramburs : (order.order_value ?? 0)));
  }, [order.ramburs, order.order_value]);

  const save = async (newVal: string) => {
    const num = parseFloat(newVal) || 0;
    setSaving(true);
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, ramburs: num }),
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Ramburs:</span>
      <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(value); }}
        style={{ width: 70, fontSize: "0.8rem", padding: "3px 6px", border: "1.5px solid var(--color-border)", borderRadius: 4, textAlign: "right", fontWeight: 700 }} />
      <span style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>RON{saving ? " ..." : ""}</span>
    </div>
  );
}

// ===== INVOICE SECTION =====
function InvoiceSection({ order, auth, onUpdate }: { order: Order; auth: string; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emitere = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/fgo", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "emitere", order_id: order.id }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else onUpdate();
    } catch (e) { setError("Eroare: " + String(e)); }
    finally { setLoading(false); }
  };

  const stornare = async () => {
    if (!confirm("Sigur vrei sa stornezi factura " + order.fgo_serie + " " + order.fgo_numar + "?")) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/fgo", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stornare", order_id: order.id }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else onUpdate();
    } catch (e) { setError("Eroare: " + String(e)); }
    finally { setLoading(false); }
  };

  const hasInvoice = !!order.fgo_numar;

  return (
    <div>
      <h3 style={{ marginBottom: 8 }}>Factura</h3>
      {hasInvoice ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{order.fgo_serie} {order.fgo_numar}</span>
            {order.fgo_link && (
              <a href={order.fgo_link} target="_blank" rel="noopener" className="awb-btn" style={{ fontSize: "0.68rem", color: "var(--color-primary)" }}>Vezi PDF</a>
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="awb-btn" onClick={emitere} disabled={true} style={{ fontSize: "0.68rem", opacity: 0.4 }}>Genereaza factura</button>
            <button className="awb-btn" onClick={stornare} disabled={loading} style={{ fontSize: "0.68rem", color: "#dc2626" }}>{loading ? "..." : "Storneaza factura"}</button>
          </div>
        </div>
      ) : (
        <button className="awb-btn" onClick={emitere} disabled={loading} style={{ fontSize: "0.72rem", padding: "6px 16px", background: "rgba(0,102,204,0.1)" }}>
          {loading ? "Se genereaza..." : "Genereaza factura"}
        </button>
      )}
      {error && <p style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: 6 }}>{error}</p>}
    </div>
  );
}

function AwbSection({ order, auth, onUpdate }: { order: Order; auth: string; onUpdate: () => void }) {
  const [generating, setGenerating] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLockers, setShowLockers] = useState(false);
  const [lockers, setLockers] = useState<{lockerId: number; name: string; address: string; city: string}[]>([]);
  const [lockerSearch, setLockerSearch] = useState("");
  const [waTemplate, setWaTemplate] = useState("");
  const [waTemplates, setWaTemplates] = useState<Array<{id: string; name: string; category_slugs: string[]; content: string}>>([]);
  const [waGeneralTemplate, setWaGeneralTemplate] = useState("");
  const config = useConfig();

  // Load whatsapp templates
  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: auth } })
      .then((r) => r.json())
      .then((data) => {
        if (data.whatsapp?.template) setWaTemplate(data.whatsapp.template);
        if (Array.isArray(data.whatsapp?.templates)) setWaTemplates(data.whatsapp.templates);
        if (data.whatsapp?.general_template) setWaGeneralTemplate(data.whatsapp.general_template);
        else if (data.whatsapp?.template) setWaGeneralTemplate(data.whatsapp.template);
      })
      .catch(() => {});
  }, [auth]);

  // Pick the right template based on order's product category
  const pickWaTemplate = () => {
    const hasCrossSell = (order.cross_sell_items || []).length > 0;
    const orderCats = order.product_category_slugs || [];

    // If has cross-sell or no category info, use general
    if (hasCrossSell || orderCats.length === 0) {
      return waGeneralTemplate || waTemplate || "";
    }

    // Find a template matching any of the order's categories
    for (const tpl of waTemplates) {
      if (tpl.category_slugs.some((s) => orderCats.includes(s))) {
        return tpl.content;
      }
    }

    // Fallback to general
    return waGeneralTemplate || waTemplate || "";
  };

  const buildWhatsAppMsg = () => {
    const shippingLabel = order.shipping_method === "easybox" ? "Easybox (Locker Sameday)" : order.shipping_method === "sameday" ? "Sameday (la adresa)" : "FanCourier (la adresa)";
    const prodName = order.product_name || `${order.brand_name} ${order.model_name}`;
    const tpl = pickWaTemplate() || `Bună {{nume_client}}, mulțumim pentru comanda #{{id_comanda}} în sumă de {{valoare}} lei. Produs: {{produs}}. Livrare: {{metoda_livrare}}, Adresa: {{adresa}}. Confirmă detaliile.`;
    return tpl
      .replace(/\{\{nume_client\}\}/g, order.customer_name || "")
      .replace(/\{\{id_comanda\}\}/g, String(order.id))
      .replace(/\{\{valoare\}\}/g, String(order.order_value || config.productPrice || 0))
      .replace(/\{\{produs\}\}/g, prodName)
      .replace(/\{\{brand\}\}/g, order.brand_name || "-")
      .replace(/\{\{model\}\}/g, order.model_name || "-")
      .replace(/\{\{text_husa\}\}/g, order.custom_name || "-")
      .replace(/\{\{metoda_livrare\}\}/g, shippingLabel)
      .replace(/\{\{adresa\}\}/g, order.address || "-")
      .replace(/\{\{telefon\}\}/g, order.customer_phone || "")
      .replace(/\{\{site_name\}\}/g, config.siteName || "");
  };

  const normalizePhone = (raw: string) => {
    let p = raw.replace(/[\s\-\(\)\.+]/g, "");
    if (p.startsWith("40") && p.length === 11) return p;
    if (p.startsWith("0") && p.length === 10) return "40" + p.slice(1);
    if (p.startsWith("4") && p.length === 11) return p;
    return "40" + p;
  };

  const openWhatsApp = () => {
    const phone = normalizePhone(order.customer_phone || "");
    const msg = encodeURIComponent(buildWhatsAppMsg());
    window.location.href = `whatsapp://send?phone=${phone}&text=${msg}`;
  };

  const authParam = encodeURIComponent(atob(auth.slice(6)).split(":")[1] || "");

  // Use separate columns, fallback to legacy awb_number based on shipping_method
  const hasNewCols = order.fan_awb !== undefined;
  const legacyAwb = order.awb_number || "";
  const legacyStatus = order.awb_status || "";
  const legacyMethod = order.shipping_method || "";

  const fanAwb = hasNewCols ? (order.fan_awb || "") : (legacyAwb && legacyMethod === "fancourier" ? legacyAwb : "");
  const fanStatus = hasNewCols ? (order.fan_status || "") : (fanAwb ? legacyStatus : "");
  const sdAwb = hasNewCols ? (order.sd_awb || "") : (legacyAwb && legacyMethod === "sameday" ? legacyAwb : "");
  const sdStatus = hasNewCols ? (order.sd_status || "") : (sdAwb ? legacyStatus : "");
  const ebAwb = hasNewCols ? (order.eb_awb || "") : (legacyAwb && legacyMethod === "easybox" ? legacyAwb : "");
  const ebStatus = hasNewCols ? (order.eb_status || "") : (ebAwb ? legacyStatus : "");

  const printPdf = (awb: string, isSd: boolean) => {
    const url = isSd
      ? `/api/admin/sameday?action=pdf&awb=${awb}&auth=${authParam}`
      : `/api/admin/awb?awb=${awb}&auth=${authParam}`;
    const w = window.open(url, "_blank");
    if (w) {
      w.onload = () => { setTimeout(() => { try { w.print(); } catch {} }, 500); };
      // Fallback if onload doesn't fire for PDF
      setTimeout(() => { try { w.print(); } catch {} }, 2000);
    }
  };

  const generateFan = async () => {
    if (fanAwb && !confirm("Exista deja un AWB FanCourier. Il inlocuiesti?")) return;
    setGenerating("fan"); setError("");
    try {
      const res = await fetch("/api/admin/awb", { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Eroare FanCourier"); return; }
      onUpdate();
      if (data.awb) printPdf(data.awb, false);
    } catch (e) { setError(String(e)); }
    finally { setGenerating(""); }
  };

  const generateSameday = async () => {
    if (sdAwb && !confirm("Exista deja un AWB Sameday. Il inlocuiesti?")) return;
    setGenerating("sd"); setError("");
    try {
      const res = await fetch("/api/admin/sameday", { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Eroare Sameday"); return; }
      onUpdate();
      if (data.awb) printPdf(data.awb, true);
    } catch (e) { setError(String(e)); }
    finally { setGenerating(""); }
  };

  const generateEasyboxAwb = async (lockerId: number) => {
    if (ebAwb && !confirm("Exista deja un AWB Easybox. Il inlocuiesti?")) return;
    setGenerating("eb"); setError("");
    try {
      const res = await fetch("/api/admin/sameday", { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id, locker_id: lockerId }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Eroare Easybox"); return; }
      setShowLockers(false);
      onUpdate();
      if (data.awb) printPdf(data.awb, true);
    } catch (e) { setError(String(e)); }
    finally { setGenerating(""); }
  };

  const hasLockerId = !!order.locker_id;

  const handleEasybox = async () => {
    if (hasLockerId) { generateEasyboxAwb(order.locker_id!); return; }
    setShowLockers(true);
    try {
      const res = await fetch("/api/lockers");
      const allLockers = await res.json();
      if (!Array.isArray(allLockers)) return;
      setLockers(allLockers.map((l: {id:number;name:string;address:string;city:string}) => ({
        lockerId: l.id, name: l.name, address: l.address, city: l.city,
      })));
    } catch {}
  };

  const deleteAwb = async (courier: "fan" | "sd" | "eb") => {
    const label = courier === "fan" ? "FanCourier" : courier === "sd" ? "Sameday" : "Easybox";
    if (!confirm(`Stergi AWB-ul ${label}?`)) return;
    try {
      const patch: Record<string, string> = courier === "fan"
        ? { fan_awb: "", fan_status: "" }
        : courier === "sd"
        ? { sd_awb: "", sd_status: "" }
        : { eb_awb: "", eb_status: "" };
      const legacyAwb = courier === "fan" ? fanAwb : courier === "sd" ? sdAwb : ebAwb;
      if (order.awb_number === legacyAwb) { patch.awb_number = ""; patch.awb_status = ""; }
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, ...patch }),
      });
      onUpdate();
    } catch (e) { setError(String(e)); }
  };

  const [copiedFan, setCopiedFan] = useState(false);
  const [copiedSd, setCopiedSd] = useState(false);
  const [copiedEb, setCopiedEb] = useState(false);

  const clientChose = order.shipping_method || "fancourier";

  const AwbActions = ({ awb, isSd, copiedState, setCopiedState, onDelete }: {
    awb: string; isSd: boolean; copiedState: boolean; setCopiedState: (v: boolean) => void; onDelete: () => void;
  }) => {
    const trackUrl = isSd ? `https://sameday.ro/status-colet/?awb=${awb}` : `https://www.fancourier.ro/awb-tracking/?tracking=${awb}`;
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button className="awb-btn" onClick={() => printPdf(awb, isSd)} title="PDF + Print">PDF</button>
        <a href={trackUrl} className="awb-btn" target="_blank" rel="noopener" title="Track">Track</a>
        <button className="awb-btn" onClick={() => { navigator.clipboard.writeText(trackUrl); setCopiedState(true); setTimeout(() => setCopiedState(false), 2000); }} title="Copy">{copiedState ? "✓" : "Copy"}</button>
        <button className="awb-btn" onClick={() => { window.location.href = `whatsapp://send?phone=${normalizePhone(order.customer_phone || "")}&text=${encodeURIComponent(`Salut! Urmareste coletul tau aici: ${trackUrl}`)}`; }} title="WhatsApp" style={{ color: "#25D366" }}>WA</button>
        <button className="awb-btn" onClick={onDelete} title="Sterge AWB" style={{ color: "#dc2626" }}>✕</button>
      </div>
    );
  };

  const statusClass = (s: string) => s.toLowerCase().includes("livrat") || s.toLowerCase().includes("delivered") ? "ot-green" : s.toLowerCase().includes("retur") || s.toLowerCase().includes("refuz") ? "ot-red" : "ot-muted";

  return (
    <div className="awb-section">
      <div className="admin-shipping-cards">
        {/* FanCourier card */}
        <div className="admin-shipping-card admin-shipping-card--active admin-shipping-card--fan">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div className="admin-shipping-card__name">FanCourier{clientChose === "fancourier" ? " ★" : ""}</div>
            <button className="admin-add-btn" onClick={generateFan} disabled={!!generating} style={{ background: "#e94560", fontSize: "0.68rem", padding: "3px 10px" }}>{generating === "fan" ? "..." : fanAwb ? "Regenereaza" : "Genereaza AWB"}</button>
          </div>
          {fanAwb ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{fanAwb}</span>
                {fanStatus && <span className={statusClass(fanStatus)} style={{ fontSize: "0.65rem" }}>{fanStatus}</span>}
              </div>
              <AwbActions awb={fanAwb} isSd={false} copiedState={copiedFan} setCopiedState={setCopiedFan} onDelete={() => deleteAwb("fan")} />
            </>
          ) : (
            <div className="admin-shipping-card__desc">Livrare la adresa</div>
          )}
        </div>

        {/* Sameday card */}
        <div className="admin-shipping-card admin-shipping-card--active admin-shipping-card--sd">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div className="admin-shipping-card__name">Sameday{clientChose === "sameday" ? " ★" : ""}</div>
            <button className="admin-add-btn" onClick={generateSameday} disabled={!!generating} style={{ background: "#0066cc", fontSize: "0.68rem", padding: "3px 10px" }}>{generating === "sd" ? "..." : sdAwb ? "Regenereaza" : "Genereaza AWB"}</button>
          </div>
          {sdAwb ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{sdAwb}</span>
                {sdStatus && <span className={statusClass(sdStatus)} style={{ fontSize: "0.65rem" }}>{sdStatus}</span>}
              </div>
              <AwbActions awb={sdAwb} isSd={true} copiedState={copiedSd} setCopiedState={setCopiedSd} onDelete={() => deleteAwb("sd")} />
            </>
          ) : (
            <div className="admin-shipping-card__desc">Livrare la adresa</div>
          )}
        </div>

        {/* Easybox card */}
        <div className="admin-shipping-card admin-shipping-card--active admin-shipping-card--sd">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div className="admin-shipping-card__name">Easybox{clientChose === "easybox" ? " ★" : ""}</div>
            <button className="admin-add-btn" onClick={handleEasybox} disabled={!!generating} style={{ background: "#0066cc", fontSize: "0.68rem", padding: "3px 10px" }}>{generating === "eb" ? "..." : ebAwb ? "Regenereaza" : hasLockerId ? "Genereaza AWB" : "Alege locker"}</button>
          </div>
          {ebAwb ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{ebAwb}</span>
                {ebStatus && <span className={statusClass(ebStatus)} style={{ fontSize: "0.65rem" }}>{ebStatus}</span>}
              </div>
              <AwbActions awb={ebAwb} isSd={true} copiedState={copiedEb} setCopiedState={setCopiedEb} onDelete={() => deleteAwb("eb")} />
            </>
          ) : (
            <div className="admin-shipping-card__desc">Locker Sameday</div>
          )}
          {showLockers && (
            <div style={{ marginTop: 8 }}>
              <input className="admin-search" placeholder="Cauta locker..." value={lockerSearch} onChange={(e) => setLockerSearch(e.target.value)} style={{ marginBottom: 6, height: 30, fontSize: "0.75rem" }} />
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: 6 }}>
                {lockers.filter((l) => !lockerSearch || `${l.name} ${l.address} ${l.city}`.toLowerCase().includes(lockerSearch.toLowerCase())).map((l) => (
                  <button key={l.lockerId} onClick={() => generateEasyboxAwb(l.lockerId)} disabled={!!generating} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px", border: "none", borderBottom: "1px solid #f3f4f6", background: "transparent", cursor: "pointer", fontSize: "0.72rem", fontFamily: "var(--font)" }}>
                    <strong>{l.name}</strong> — {l.address}, {l.city}
                  </button>
                ))}
                {lockers.length === 0 && <p style={{ padding: 8, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Se incarca...</p>}
              </div>
            </div>
          )}
        </div>

        {/* Factura card - a 4-a casuta */}
        <div className="admin-shipping-card admin-shipping-card--active" style={{ borderColor: "#10b981" }}>
          <InvoiceSection order={order} auth={auth} onUpdate={onUpdate} />
        </div>
      </div>

      {/* WA Confirmare - comun */}
      <div style={{ marginTop: 8 }}>
        <button className="awb-btn" onClick={openWhatsApp} style={{ color: "#25D366", fontWeight: 700 }} title="Trimite confirmare WhatsApp">WA Confirmare comanda</button>
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: 8 }}>{error}</p>}
    </div>
  );
}

// ===== DASHBOARD PANEL =====
function DashboardPanel({ orders, onNavigate }: { orders: Order[]; onNavigate: (tab: Tab) => void }) {
  const config = useConfig();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthOrders = orders.filter((o) => new Date(o.created_at) >= monthStart);
  const activeOrders = monthOrders.filter((o) => o.status !== "anulata");
  const netSales = activeOrders.length * (config.productPrice ?? 0) - activeOrders.length * (config.productionCost ?? 0);
  const processing = monthOrders.filter((o) => o.status === "in procesare").length;
  const finalized = monthOrders.filter((o) => o.status === "finalizata").length;
  const cancelled = monthOrders.filter((o) => o.status === "anulata").length;

  // Top 3 products this month
  const productCounts: Record<string, number> = {};
  activeOrders.forEach((o) => {
    const key = `${o.brand_name} ${o.model_name}`;
    productCounts[key] = (productCounts[key] || 0) + 1;
  });
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const monthName = now.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  return (
    <div className="dash">
      <div className="dash-hero" onClick={() => onNavigate("statistici")} style={{ cursor: "pointer" }}>
        <div className="dash-hero__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
            <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 6-6" />
          </svg>
        </div>
        <div className="dash-hero__value">{netSales.toLocaleString("ro-RO")} RON</div>
        <div className="dash-hero__label">Vanzari nete — {monthName}</div>
        <div className="dash-hero__sub">{activeOrders.length} comenzi active · click pentru statistici</div>
      </div>

      <div className="dash-stats">
        <div className="dash-stat" onClick={() => onNavigate("comenzi")}>
          <div className="dash-stat__dot" style={{ background: "#f59e0b" }}></div>
          <div className="dash-stat__num">{processing}</div>
          <div className="dash-stat__label">In procesare</div>
        </div>
        <div className="dash-stat" onClick={() => onNavigate("comenzi")}>
          <div className="dash-stat__dot" style={{ background: "#10b981" }}></div>
          <div className="dash-stat__num">{finalized}</div>
          <div className="dash-stat__label">Finalizate</div>
        </div>
        <div className="dash-stat" onClick={() => onNavigate("comenzi")}>
          <div className="dash-stat__dot" style={{ background: "#6b7280" }}></div>
          <div className="dash-stat__num">{cancelled}</div>
          <div className="dash-stat__label">Anulate</div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <>
          <div className="dash-sep"></div>
          <div className="dash-top">
            <h3>Top produse luna aceasta</h3>
            {topProducts.map(([name, count], i) => (
              <div key={name} className="dash-top__item">
                <span className="dash-top__rank">{i + 1}</span>
                <span className="dash-top__name">{name}</span>
                <span className="dash-top__count">{count} buc</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===== STATISTICS PANEL =====
function StatisticsPanel({ orders }: { orders: Order[] }) {
  const config = useConfig();
  const now = new Date();
  const toISO = (d: Date) => d.toISOString().split("T")[0];
  const today = toISO(now);
  const yearStart = toISO(new Date(now.getFullYear(), 0, 1));
  const monthStart = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastMonthStart = toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = toISO(new Date(now.getFullYear(), now.getMonth(), 0));
  const weekAgo = toISO(new Date(now.getTime() - 7 * 86400000));

  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);

  const setPreset = (from: string, to: string) => { setDateFrom(from); setDateTo(to); };

  const filtered = orders.filter((o) => {
    const d = o.created_at.split("T")[0];
    return d >= dateFrom && d <= dateTo;
  });

  const active = filtered.filter((o) => o.status !== "anulata");
  const totalBrut = active.length * (config.productPrice ?? 0);
  const totalCost = active.length * (config.productionCost ?? 0);
  const totalNet = totalBrut - totalCost;
  const byStatus: Record<string, number> = {};
  filtered.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

  // By source
  const bySource: Record<string, number> = {};
  filtered.forEach((o) => {
    let label = "direct";
    try { const s = JSON.parse(o.order_source || "{}"); label = s.label || "direct"; } catch {}
    bySource[label] = (bySource[label] || 0) + 1;
  });

  // Top products
  const productCounts: Record<string, number> = {};
  active.forEach((o) => {
    const key = o.product_name || `${o.brand_name} ${o.model_name}`;
    productCounts[key] = (productCounts[key] || 0) + 1;
  });
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="stats">
      <div className="stats-presets">
        <button className={`stats-preset ${dateFrom === yearStart && dateTo === today ? "stats-preset--active" : ""}`} onClick={() => setPreset(yearStart, today)}>An curent</button>
        <button className={`stats-preset ${dateFrom === lastMonthStart && dateTo === lastMonthEnd ? "stats-preset--active" : ""}`} onClick={() => setPreset(lastMonthStart, lastMonthEnd)}>Luna trecuta</button>
        <button className={`stats-preset ${dateFrom === monthStart && dateTo === today ? "stats-preset--active" : ""}`} onClick={() => setPreset(monthStart, today)}>Luna curenta</button>
        <button className={`stats-preset ${dateFrom === weekAgo && dateTo === today ? "stats-preset--active" : ""}`} onClick={() => setPreset(weekAgo, today)}>Sapt. trecuta</button>
      </div>
      <div className="stats-period">
        <label className="stats-date-label">De la</label>
        <input type="date" className="stats-date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <label className="stats-date-label">pana la</label>
        <input type="date" className="stats-date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-card__label">Vanzari brute</div>
          <div className="stats-card__value">{totalBrut.toLocaleString("ro-RO")} RON</div>
        </div>
        <div className="stats-card">
          <div className="stats-card__label">Cost Livrare</div>
          <div className="stats-card__value">{totalCost.toLocaleString("ro-RO")} RON</div>
        </div>
        <div className="stats-card stats-card--accent">
          <div className="stats-card__label">Vanzari nete</div>
          <div className="stats-card__value">{totalNet.toLocaleString("ro-RO")} RON</div>
        </div>
        <div className="stats-card">
          <div className="stats-card__label">Nr comenzi</div>
          <div className="stats-card__value">{filtered.length}</div>
        </div>
      </div>

      <div className="stats-section">
        <h3>Per status</h3>
        <div className="stats-bars">
          {Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
            <div key={status} className="stats-bar">
              <span className="stats-bar__label">{status}</span>
              <div className="stats-bar__track"><div className="stats-bar__fill" style={{ width: `${(count / filtered.length) * 100}%`, background: STATUS_COLORS[status] || "#6b7280" }}></div></div>
              <span className="stats-bar__count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <h3>Per sursa</h3>
        <div className="stats-bars">
          {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
            <div key={source} className="stats-bar">
              <span className="stats-bar__label">{source}</span>
              <div className="stats-bar__track"><div className="stats-bar__fill" style={{ width: `${(count / filtered.length) * 100}%`, background: "#3b82f6" }}></div></div>
              <span className="stats-bar__count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="stats-section">
          <h3>Top 10 produse</h3>
          {topProducts.map(([name, count], i) => (
            <div key={name} className="dash-top__item">
              <span className="dash-top__rank">{i + 1}</span>
              <span className="dash-top__name">{name}</span>
              <span className="dash-top__count">{count} buc</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== ORDER DETAILS (editable) =====
function OrderDetails({ order, auth, onUpdate }: { order: Order; auth: string; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email || "",
    brand_name: order.brand_name,
    model_name: order.model_name,
    custom_name: order.custom_name || "",
    text_color: order.text_color || "",
    observations: order.observations || "",
    custom_field_values: order.custom_field_values || {},
    order_value: order.order_value || 0,
    locker_id: order.locker_id || null,
  });
  const [judetName, setJudetName] = useState("");
  const [localitateVal, setLocalitateVal] = useState("");
  const [stradaVal, setStradaVal] = useState("");
  const [judete, setJudete] = useState<{id:number;name:string}[]>([]);
  const [localitati, setLocalitati] = useState<string[]>([]);
  const [judetId, setJudetId] = useState("");
  // Easybox locker editing
  const [lockers, setLockers] = useState<{id:number;name:string;address:string;city:string;county:string}[]>([]);
  const [loadingLockers, setLoadingLockers] = useState(false);
  const [lockerSearch, setLockerSearch] = useState("");
  const [selectedLockerName, setSelectedLockerName] = useState("");
  const isEasybox = order.shipping_method === "easybox";

  // Parse address
  useEffect(() => {
    if (isEasybox && order.address?.startsWith("Easybox:")) {
      const lockerPart = order.address.replace("Easybox:", "").trim();
      setSelectedLockerName(lockerPart);
      // For easybox, strada shows the full easybox address; judet/localitate empty so admin can fill if switching to home delivery
      setStradaVal(order.address);
    } else {
      const parts = order.address?.split(",").map((s: string) => s.trim()) || [];
      setStradaVal(parts[0] || "");
      setLocalitateVal(parts[1] || "");
      setJudetName(parts[2] || "");
    }
  }, [order.address, isEasybox]);

  // Load lockers when editing any order
  useEffect(() => {
    if (!editing || lockers.length > 0) return;
    setLoadingLockers(true);
    fetch("/api/lockers").then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLockers(data); })
      .catch(() => {})
      .finally(() => setLoadingLockers(false));
  }, [editing, lockers.length]);

  useEffect(() => {
    if (!editing) return;
    fetch("/api/judete").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) {
        setJudete(data);
        const found = data.find((j: {name:string}) => j.name === judetName);
        if (found) setJudetId(String(found.id));
      }
    }).catch(() => {});
  }, [editing, judetName]);

  // Load localitati when judet changes
  useEffect(() => {
    if (!judetId || !editing) return;
    fetch(`/api/localitati?judetId=${judetId}`).then((r) => r.json()).then(setLocalitati).catch(() => {});
  }, [judetId, editing]);

  const handleJudetChange = (val: string) => {
    setJudetId(val);
    const j = judete.find((x) => x.id === Number(val));
    setJudetName(j?.name || "");
    setLocalitateVal("");
  };

  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[ăâ]/g, "a").replace(/[șş]/g, "s").replace(/[țţ]/g, "t").replace(/[îi]/g, "i");

  // Auto-detect judet from current locker for easybox orders (pre-populate address judet)
  useEffect(() => {
    if (!isEasybox || !selectedLockerName || lockers.length === 0 || judete.length === 0 || judetId) return;
    const currentName = selectedLockerName.split(",")[0]?.trim().toLowerCase();
    const match = lockers.find((l) => l.name.toLowerCase() === currentName);
    if (match?.county) {
      const nCounty = normalize(match.county);
      const found = judete.find((j) => normalize(j.name) === nCounty);
      if (found) {
        setJudetId(String(found.id));
        setJudetName(found.name);
      }
    }
  }, [isEasybox, selectedLockerName, lockers, judete, judetId]);

  const filteredLockers = lockers.filter((l) => {
    // Filter by address judet
    if (judetName) {
      const nj = normalize(judetName);
      const nc = normalize(l.county || "");
      const nCity = normalize(l.city || "");
      if (!nc.includes(nj) && !nj.includes(nc) && !nCity.includes(nj) && !nj.includes(nCity)) return false;
    }
    const q = normalize(lockerSearch);
    return !q || normalize(l.name).includes(q) || normalize(l.address).includes(q) || normalize(l.city).includes(q);
  });

  const saveDetails = async () => {
    setSaving(true);
    // If admin filled judet+localitate, build normal address (overrides easybox)
    const address = (localitateVal && judetName) ? [stradaVal, localitateVal, judetName].filter(Boolean).join(", ") : stradaVal;
    const { custom_field_values, order_value, locker_id, ...rest } = f;
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, ...rest, address, custom_field_values, order_value: Number(order_value) || 0, locker_id: locker_id || null }),
    });
    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  // Extract product name from observations or brand+model
  const productName = order.product_name || `${order.brand_name || ""} ${order.model_name || ""}`.trim();

  if (!editing) {
    return (
      <>
        {/* Product name above details */}
        {productName && (
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: 8 }}>
            {productName}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Detalii</h3>
          <button className="admin-action-btn" onClick={() => setEditing(true)} title="Editeaza">✎</button>
        </div>
        <table><tbody>
          {order.custom_name &&<tr><td>Text</td><td style={{ fontWeight: 700 }}><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: order.text_color || "#000", border: "1px solid #ddd", verticalAlign: "middle", marginRight: 6 }}></span><span style={{ color: order.text_color || "#000", background: (order.text_color || "").toUpperCase() === "#FFFFFF" || (order.text_color || "").toUpperCase() === "#FFF" ? "#555" : "transparent", padding: (order.text_color || "").toUpperCase() === "#FFFFFF" || (order.text_color || "").toUpperCase() === "#FFF" ? "2px 8px" : 0, borderRadius: 4 }}>{order.custom_name}</span></td></tr>}
          <tr><td>Nume</td><td>{order.customer_name}</td></tr>
          <tr><td>Telefon</td><td><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a></td></tr>
          {order.customer_email && <tr><td>Email</td><td>{order.customer_email}</td></tr>}
          <tr><td>Adresa</td><td>{order.address}</td></tr>
          <tr><td>Valoare</td><td><strong style={{ color: "var(--color-accent)" }}>{order.order_value || 0} RON</strong></td></tr>
          {order.observations && <tr><td>Obs</td><td>{order.observations}</td></tr>}
          {order.custom_field_values && Object.entries(order.custom_field_values).map(([key, cf]) => (
            <tr key={key}><td>{cf.label}</td><td>
              {cf.type === "checkbox" ? (cf.value ? "Da" : "Nu") :
               cf.type === "image_upload" ? <a href={String(cf.value)} target="_blank" rel="noopener" style={{ color: "var(--color-primary)" }}>Vezi imagine</a> :
               cf.option_label || String(cf.value)}
              {cf.price_impact ? <span style={{ color: "var(--color-accent)", marginLeft: 4, fontSize: "0.75rem" }}>({cf.price_impact > 0 ? "+" : ""}{cf.price_impact} RON)</span> : null}
            </td></tr>
          ))}
          {order.cross_sell_items && order.cross_sell_items.length > 0 && (
            <tr><td style={{ verticalAlign: "top" }}>Cross-sell</td><td>
              {order.cross_sell_items.map((cs, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {cs.image_url && <img src={cs.image_url} alt="" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 3 }} />}
                  <span>{cs.name}</span>
                  <span style={{ color: "var(--color-accent)", fontWeight: 700, fontSize: "0.75rem" }}>+{cs.price} RON</span>
                </div>
              ))}
            </td></tr>
          )}
        </tbody></table>
      </>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        <h3>Editeaza detalii</h3>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button className="admin-add-btn" onClick={saveDetails} disabled={saving}>{saving ? "..." : "Salveaza"}</button>
          <button className="admin-action-btn" onClick={() => setEditing(false)} title="Anuleaza">✕</button>
        </div>
      </div>
      <div className="order-edit-fields">
        <div className="order-edit-row">
          <label>Nume</label>
          <input value={f.customer_name} onChange={(e) => setF({ ...f, customer_name: e.target.value })} />
        </div>
        <div className="order-edit-row">
          <label>Telefon</label>
          <input value={f.customer_phone} onChange={(e) => setF({ ...f, customer_phone: e.target.value })} />
        </div>
        <div className="order-edit-row">
          <label>Email</label>
          <input value={f.customer_email} onChange={(e) => setF({ ...f, customer_email: e.target.value })} />
        </div>
        {/* Judet/Localitate/Strada - shown first so locker filtering uses selected judet */}
        <div className="order-edit-row">
          <label>Judet</label>
          <select value={judetId} onChange={(e) => handleJudetChange(e.target.value)}>
            <option value="">Selecteaza</option>
            {judete.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <div className="order-edit-row">
          <label>Localitate</label>
          <select value={localitateVal} onChange={(e) => setLocalitateVal(e.target.value)}>
            <option value="">{localitati.length ? "Selecteaza" : localitateVal || "..."}</option>
            {localitati.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="order-edit-row">
          <label>Strada</label>
          <input value={stradaVal} onChange={(e) => setStradaVal(e.target.value)} />
        </div>
        {/* Easybox locker picker - filters by address judet */}
        <div style={{ border: "1.5px solid #0066cc", borderRadius: "var(--radius-sm)", padding: 10, marginBottom: 4, background: "rgba(0,102,204,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: selectedLockerName ? 0 : 6 }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0066cc", margin: 0 }}>Easybox locker</label>
            {selectedLockerName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{selectedLockerName}</span>
                <button type="button" onClick={() => { setSelectedLockerName(""); setF((prev) => ({ ...prev, locker_id: null })); }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>✕</button>
              </div>
            ) : (
              <span style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}>niciun locker</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input type="text" placeholder="Cauta locker..." value={lockerSearch} onChange={(e) => setLockerSearch(e.target.value)} style={{ flex: 1, height: 30, fontSize: "0.75rem", padding: "0 8px", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)" }} />
          </div>
          {judetName && <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", marginTop: 3 }}>Filtrate dupa judetul: {judetName}</div>}
          {lockerSearch && (
            <div style={{ maxHeight: 160, overflowY: "auto", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginTop: 6 }}>
              {loadingLockers ? (
                <div style={{ padding: 10, fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "center" }}>Se incarca...</div>
              ) : filteredLockers.length === 0 ? (
                <div style={{ padding: 10, fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "center" }}>Niciun locker gasit</div>
              ) : (
                filteredLockers.slice(0, 30).map((l) => (
                  <div key={l.id} onClick={() => {
                    setStradaVal(`Easybox: ${l.name}, ${l.address}, ${l.city}`);
                    setSelectedLockerName(`${l.name}, ${l.address}, ${l.city}`);
                    setF((prev) => ({ ...prev, locker_id: l.id }));
                    setLockerSearch("");
                  }} style={{ padding: "6px 8px", cursor: "pointer", borderBottom: "1px solid var(--color-border)", fontSize: "0.72rem" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,102,204,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontWeight: 700 }}>{l.name}</div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.65rem" }}>{l.address}, {l.city}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="order-edit-row">
          <label>Valoare (RON)</label>
          <input type="number" value={f.order_value || 0} onChange={(e) => setF({ ...f, order_value: Number(e.target.value) })} style={{ width: 100 }} />
        </div>
        <div className="order-edit-row">
          <label>Text pe husa</label>
          <input value={f.custom_name} onChange={(e) => setF({ ...f, custom_name: e.target.value })} />
        </div>
        <div className="order-edit-row">
          <label>Culoare text</label>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[{ n: "Alb", v: "#FFFFFF" }, { n: "Negru", v: "#000000" }, { n: "Rosu", v: "#E94560" }, { n: "Auriu", v: "#D4A843" }, { n: "Albastru", v: "#3B82F6" }].map((c) => (
              <button key={c.v} type="button" onClick={() => setF({ ...f, text_color: c.v })} title={c.n} style={{ width: 24, height: 24, borderRadius: "50%", background: c.v, border: f.text_color === c.v ? "2px solid var(--color-primary)" : "1px solid #ddd", cursor: "pointer", padding: 0, boxShadow: f.text_color === c.v ? "0 0 0 2px var(--color-primary)" : "none" }} />
            ))}
          </div>
        </div>
        <div className="order-edit-row">
          <label>Observatii</label>
          <input value={f.observations} onChange={(e) => setF({ ...f, observations: e.target.value })} />
        </div>
        {f.custom_field_values && Object.entries(f.custom_field_values).length > 0 && (
          <>
            <div style={{ borderTop: "1px solid var(--color-border)", margin: "8px 0", paddingTop: 8 }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-text-muted)" }}>Campuri custom</label>
            </div>
            {Object.entries(f.custom_field_values).map(([key, cf]) => (
              <div className="order-edit-row" key={key}>
                <label>{cf.label}</label>
                {cf.type === "checkbox" ? (
                  <input type="checkbox" checked={!!cf.value} onChange={(e) => {
                    setF((prev) => ({ ...prev, custom_field_values: { ...prev.custom_field_values, [key]: { ...cf, value: e.target.checked } } }));
                  }} />
                ) : cf.type === "image_upload" ? (
                  <a href={String(cf.value)} target="_blank" rel="noopener" style={{ color: "var(--color-primary)", fontSize: "0.8rem" }}>Vezi imagine</a>
                ) : (
                  <input value={cf.option_label || String(cf.value || "")} onChange={(e) => {
                    setF((prev) => ({ ...prev, custom_field_values: { ...prev.custom_field_values, [key]: { ...cf, value: e.target.value, option_label: undefined } } }));
                  }} />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

// ===== CLIENT HISTORY =====
function ClientHistory({ history, onOpen }: { history: Order[]; onOpen?: (id: number) => void }) {
  if (history.length === 0) return null;

  const getStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case "finalizata": case "livrat": return { color: "#10b981", fontWeight: 600 };
      case "retur": return { color: "#dc2626", fontWeight: 600 };
      case "anulata": case "anulat": return { color: "#1a1a2e", textDecoration: "line-through" };
      default: return { color: "#1a1a2e", fontWeight: 500 };
    }
  };

  return (
    <div className="client-history">
      {history.map((o) => (
        <span key={o.id} style={{ ...getStyle(o.status), cursor: onOpen ? "pointer" : "default" }} title={`#${o.id} - ${o.status}`} onClick={(e) => { if (onOpen) { e.stopPropagation(); onOpen(o.id); } }}>
          #{o.id}
        </span>
      ))}
    </div>
  );
}

// ===== REVIEWS PANEL =====
interface AdminReview {
  id: number;
  product_id: number;
  product_name: string;
  customer_name: string;
  rating: number;
  comment: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

function ReviewsPanel({ auth }: { auth: string }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/reviews?status=${statusFilter}`, { headers: { Authorization: auth } });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) setReviews(data);
    }
    setLoading(false);
  }, [auth, statusFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const moderate = async (id: number, status: "approved" | "rejected" | "pending") => {
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchReviews();
  };

  const deleteReview = async (id: number) => {
    if (!confirm("Stergi recenzia permanent?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE", headers: { Authorization: auth } });
    fetchReviews();
  };

  const stars = (n: number) => "\u2605".repeat(n) + "\u2606".repeat(5 - n);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`ot-sf ${statusFilter === "pending" ? "ot-sf--active" : ""}`} style={statusFilter === "pending" ? { background: "#f59e0b", color: "#fff" } : {}} onClick={() => setStatusFilter("pending")}>In asteptare</button>
        <button className={`ot-sf ${statusFilter === "approved" ? "ot-sf--active" : ""}`} style={statusFilter === "approved" ? { background: "#10b981", color: "#fff" } : {}} onClick={() => setStatusFilter("approved")}>Aprobate</button>
        <button className={`ot-sf ${statusFilter === "rejected" ? "ot-sf--active" : ""}`} style={statusFilter === "rejected" ? { background: "#dc2626", color: "#fff" } : {}} onClick={() => setStatusFilter("rejected")}>Respinse</button>
      </div>

      {loading ? <p>Se incarca...</p> : reviews.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", padding: 20, textAlign: "center" }}>Nicio recenzie in aceasta categorie.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: 12, background: "var(--color-surface)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <strong style={{ fontSize: "0.9rem" }}>{r.customer_name}</strong>
                <span style={{ color: "#f59e0b", letterSpacing: 1 }}>{stars(r.rating)}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{new Date(r.created_at).toLocaleString("ro-RO")}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{r.product_name}</span>
              </div>
              {r.comment && <p style={{ fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 8px", color: "var(--color-text)" }}>{r.comment}</p>}
              {r.email && <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", margin: "0 0 8px" }}>Email (privat): {r.email}</p>}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {r.status !== "approved" && <button className="admin-add-btn" onClick={() => moderate(r.id, "approved")} style={{ background: "#10b981", padding: "4px 10px", fontSize: "0.75rem" }}>Aproba</button>}
                {r.status !== "rejected" && <button className="admin-add-btn" onClick={() => moderate(r.id, "rejected")} style={{ background: "#dc2626", padding: "4px 10px", fontSize: "0.75rem" }}>Respinge</button>}
                {r.status !== "pending" && <button className="admin-inline-btn" onClick={() => moderate(r.id, "pending")} style={{ fontSize: "0.75rem" }}>Reseteaza</button>}
                <button className="admin-inline-btn" onClick={() => deleteReview(r.id)} style={{ color: "#dc2626", fontSize: "0.75rem" }}>Sterge</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
