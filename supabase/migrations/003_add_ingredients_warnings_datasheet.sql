-- Add ingredients, warnings, datasheet (PDF) columns
alter table public.products add column if not exists ingredients text;
alter table public.products add column if not exists warnings text;
alter table public.products add column if not exists datasheet_url text;
alter table public.products add column if not exists datasheet_r2_url text;
