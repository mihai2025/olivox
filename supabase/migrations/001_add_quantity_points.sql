-- Apply on existing olivox Supabase DB to add quantity + points columns
alter table public.products add column if not exists quantity text;
alter table public.products add column if not exists points numeric(6,2);
