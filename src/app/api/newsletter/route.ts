import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { getSiteConfig } from "@/lib/site-config";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body?.source === "string" ? body.source.slice(0, 64) : "footer";

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalid." }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    // Try insert. If the table doesn't exist the error is logged but the user
    // still gets a welcome email — we never expose infra failures to the UI.
    let tableExists = true;
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email, source, ip, user_agent: userAgent, status: "active" });
      if (error && !/duplicate key|unique constraint/i.test(error.message)) {
        if (/relation .* does not exist|Could not find the table/i.test(error.message)) {
          tableExists = false;
          console.warn("newsletter_subscribers table missing — run supabase/migrations/005_newsletter.sql");
        } else {
          console.error("newsletter insert error:", error.message);
        }
      }
    } catch (e) {
      console.error("newsletter insert exception:", e);
    }

    // Send welcome email (best effort).
    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        const config = await getSiteConfig();
        await resend.emails.send({
          from: config.emailFrom || "Olivox <no-reply@olivox.ro>",
          to: email,
          subject: "Bine ai venit la Olivox",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e2820">
              <h2 style="color:#2f4a36;margin:0 0 12px">Multumim pentru abonare!</h2>
              <p>Te-ai abonat cu succes la newsletter-ul Olivox.</p>
              <p>O data pe luna iti trimitem sfaturi despre suplimente naturiste, promotii si articole noi din blog.</p>
              <p style="margin-top:24px">Poti explora oricand <a href="https://olivox.ro/categorii" style="color:#b8873a">catalogul nostru</a>.</p>
              <hr style="border:none;border-top:1px solid #e2dac3;margin:24px 0" />
              <p style="font-size:12px;color:#6d7669">Daca nu tu te-ai abonat, ignora acest email si nu vei mai primi nimic.</p>
            </div>`,
        });
      } catch (e) {
        console.error("welcome email failed:", e);
      }
    }

    return NextResponse.json({ ok: true, warning: tableExists ? undefined : "storage_pending_migration" });
  } catch (error) {
    console.error("newsletter route failed:", error);
    return NextResponse.json({ error: "Eroare la procesare." }, { status: 500 });
  }
}
