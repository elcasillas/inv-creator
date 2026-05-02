alter table public.companies
add column if not exists invoice_start_number integer;

update public.companies
set invoice_start_number = 1000
where invoice_start_number is null
   or invoice_start_number < 0;

alter table public.companies
alter column invoice_start_number set default 1000;

alter table public.companies
alter column invoice_start_number set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'companies_invoice_start_number_check'
  ) then
    alter table public.companies
    add constraint companies_invoice_start_number_check
    check (invoice_start_number >= 0);
  end if;
end
$$;

with ranked_company_invoices as (
  select
    invoices.id,
    (companies.invoice_start_number + row_number() over (
      partition by invoices.company_id
      order by invoices.invoice_date nulls last, invoices.created_at, invoices.id
    ))::text as normalized_invoice_number
  from public.invoices
  join public.companies on companies.id = invoices.company_id
),
ranked_unassigned_invoices as (
  select
    invoices.id,
    (1000 + row_number() over (
      order by invoices.invoice_date nulls last, invoices.created_at, invoices.id
    ))::text as normalized_invoice_number
  from public.invoices
  where invoices.company_id is null
)
update public.invoices
set invoice_number = coalesce(
  ranked_company_invoices.normalized_invoice_number,
  ranked_unassigned_invoices.normalized_invoice_number
)
from ranked_company_invoices
full outer join ranked_unassigned_invoices
  on ranked_company_invoices.id = ranked_unassigned_invoices.id
where public.invoices.id = coalesce(ranked_company_invoices.id, ranked_unassigned_invoices.id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'invoices_invoice_number_numeric_check'
  ) then
    alter table public.invoices
    add constraint invoices_invoice_number_numeric_check
    check (invoice_number ~ '^[0-9]+$');
  end if;
end
$$;

create unique index if not exists invoices_company_id_invoice_number_idx
on public.invoices(company_id, invoice_number);
