-- Add product variants (JSONB array of {id, name})
alter table public.products add column if not exists variants jsonb default '[]'::jsonb;
