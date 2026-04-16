-- Newsletter subscribers table.
-- Stores opt-in email subscribers captured via the footer newsletter form.
-- If you have Supabase CLI: `supabase db push` or run this SQL in the SQL editor.

create table if not exists public.newsletter_subscribers (
  id bigserial primary key,
  email text not null,
  source text,
  status text not null default 'active',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

-- RLS: keep locked by default (writes via service role from API route).
alter table public.newsletter_subscribers enable row level security;
