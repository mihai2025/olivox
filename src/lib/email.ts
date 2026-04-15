import { Resend } from "resend";
import { getSiteConfig } from "./site-config";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

interface OrderEmailData {
  brand_name: string;
  model_name: string;
  custom_name: string;
  product_name?: string;
  text_color: string;
  image_url: string;
  original_image_url: string;
  final_image_url: string;
  address: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  observations: string;
  order_id: number;
  custom_field_values?: Record<string, { value: string | boolean; label: string; type: string; option_label?: string; price_impact?: number; image_url?: string }>;
}

export async function sendOrderEmail(data: OrderEmailData) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY nu este configurat in variabilele de mediu (.env)");
  }
  const config = await getSiteConfig();
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f5f7; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .header h1 span { color: #e94560; }
    .badge { display: inline-block; background: #e94560; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    .body { padding: 32px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 12px; font-weight: 600; }
    .row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .label { width: 140px; font-weight: 600; color: #374151; font-size: 14px; }
    .value { color: #1a1a2e; font-size: 14px; }
    .images { margin-top: 16px; }
    .images img { max-width: 200px; border-radius: 8px; border: 1px solid #e5e7eb; margin-right: 12px; margin-bottom: 8px; }
    .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; vertical-align: top; }
    td:first-child { width: 140px; font-weight: 600; color: #374151; }
    td:last-child { color: #1a1a2e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${config.logoHtml}</h1>
      <div class="badge">Comanda #${data.order_id}</div>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">Detalii produs</div>
        <table>
          <tr><td>Brand</td><td>${data.brand_name}</td></tr>
          <tr><td>Model</td><td>${data.model_name}</td></tr>
          ${data.custom_name ? `<tr><td>Text pe husa</td><td style="color:${data.text_color || '#000'};font-weight:700">${data.custom_name}</td></tr>` : ""}
          ${data.text_color ? `<tr><td>Culoare text</td><td><span style="display:inline-block;width:16px;height:16px;background:${data.text_color};border-radius:50%;border:1px solid #ddd;vertical-align:middle"></span> ${data.text_color}</td></tr>` : ""}
        </table>
      </div>

      <div class="section">
        <div class="section-title">Date client</div>
        <table>
          <tr><td>Nume</td><td>${data.customer_name}</td></tr>
          <tr><td>Telefon</td><td>${data.customer_phone}</td></tr>
          ${data.customer_email ? `<tr><td>Email</td><td>${data.customer_email}</td></tr>` : ""}
          <tr><td>Adresa</td><td>${data.address}</td></tr>
          ${data.observations ? `<tr><td>Observatii</td><td>${data.observations}</td></tr>` : ""}
          ${data.custom_field_values ? Object.values(data.custom_field_values).map((cf) =>
            `<tr><td>${cf.label}</td><td>${cf.type === "checkbox" ? (cf.value ? "Da" : "Nu") : cf.type === "image_upload" ? `<a href="${cf.value}" style="color:#e94560">Imagine</a>` : cf.option_label || String(cf.value)}${cf.price_impact ? ` <span style="color:#e94560">(${cf.price_impact > 0 ? "+" : ""}${cf.price_impact} RON)</span>` : ""}</td></tr>`
          ).join("") : ""}
        </table>
      </div>

      ${data.original_image_url || data.image_url ? `
      <div class="section">
        <div class="section-title">Imagini</div>
        <div class="images">
          ${data.original_image_url ? `<div><small style="color:#6b7280">Imaginea originala:</small><br><img src="${data.original_image_url}" alt="Original"></div>` : ""}
          ${data.image_url ? `<div style="margin-top:8px"><small style="color:#6b7280">Imaginea cropata:</small><br><img src="${data.image_url}" alt="Cropata"></div>` : ""}
          ${data.final_image_url ? `<div style="margin-top:8px"><small style="color:#6b7280">Previzualizare finala:</small><br><img src="${data.final_image_url}" alt="Final"></div>` : ""}
        </div>
      </div>
      ` : ""}
    </div>
    <div class="footer">
      ${config.siteName} &mdash; Comanda primita automat
    </div>
  </div>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to: config.emailAdmin,
    subject: `Comanda #${data.order_id} — ${data.product_name || `${data.brand_name} ${data.model_name}`}`,
    html,
  });

  if (error) {
    console.error("Email send error:", error);
    throw error;
  }
}

export async function sendClientEmail(data: OrderEmailData) {
  if (!data.customer_email) return;
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY nu este configurat in variabilele de mediu (.env)");
  }
  const config = await getSiteConfig();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f5f7; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .header h1 span { color: #e94560; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; vertical-align: top; }
    td:first-child { width: 130px; font-weight: 600; color: #374151; }
    td:last-child { color: #1a1a2e; }
    .preview { text-align: center; margin: 20px 0; }
    .preview img { max-width: 280px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    .footer a { color: #e94560; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${config.logoHtml}</h1>
    </div>
    <div class="body">
      <p class="greeting">Salut <strong>${data.customer_name}</strong>,</p>
      <p style="font-size:14px;color:#374151;margin-bottom:20px">Multumim pentru comanda ta! Am primit-o si o vom procesa in cel mai scurt timp.</p>

      <table>
        <tr><td>Comanda</td><td>#${data.order_id}</td></tr>
        <tr><td>Produs</td><td>${data.product_name || `${data.brand_name} ${data.model_name}`}</td></tr>
        ${data.custom_name ? `<tr><td>Text pe husa</td><td>${data.custom_name}</td></tr>` : ""}
        <tr><td>Livrare la</td><td>${data.address}</td></tr>
      </table>

      ${data.final_image_url ? `
      <div class="preview">
        <p style="font-size:13px;color:#6b7280;margin-bottom:8px">Asa va arata husa ta:</p>
        <img src="${data.final_image_url}" alt="Previzualizare husa" style="max-width:240px">
      </div>
      ` : ""}

      <p style="font-size:14px;color:#374151">Comanda va pleca de la noi azi sau cel tarziu maine urmand ca in 1-3 zile sa ajunga la dvs.</p>
      <p style="font-size:14px;color:#374151;margin-top:12px">
        Pentru a confirma comanda si a vedea o previzualizare a produsului personalizat, intra cu noi in conversatie pe
        <a href="https://wa.me/${config.phone.replace(/^0/, "4")}" style="color:#25D366;font-weight:700;text-decoration:none"> WhatsApp</a>
        sau suna la <a href="tel:${config.phone}" style="color:#e94560;font-weight:600;text-decoration:none">${config.phone}</a>.
      </p>
    </div>
    <div class="footer">
      <p>${config.siteName} &mdash; ${config.tagline}</p>
      <p><a href="${config.domain}">${config.siteName}</a></p>
    </div>
  </div>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to: data.customer_email,
    subject: `Comanda #${data.order_id} confirmata — ${config.siteName}`,
    html,
  });

  if (error) {
    console.error("Client email error:", error);
    throw error;
  }
}
