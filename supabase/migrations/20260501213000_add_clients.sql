create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  billing_address text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices
add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists invoices_client_id_idx on public.invoices(client_id);

drop trigger if exists clients_set_updated_at on public.clients;

create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();
