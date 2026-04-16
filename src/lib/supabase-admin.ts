import { createClient } from "@supabase/supabase-js";

// Server-only client with service role / secret key — bypasses RLS for admin writes.
// NEVER expose this client to the browser or use NEXT_PUBLIC_ env vars here.
const SECRET =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SECRET,
  { auth: { persistSession: false } }
);
