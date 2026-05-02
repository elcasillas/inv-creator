import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getNextInvoiceNumberForCompany } from "@/lib/utils/invoice-number";
import { CompanyRow } from "@/types/company";
import { ClientRow } from "@/types/client";
import { InvoiceItemRow, InvoiceWithItems, type InvoiceRow } from "@/types/invoice";

function normalizeCompany(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    invoice_start_number: Number(row.invoice_start_number ?? 1000),
    address: (row.address as string | null | undefined) ?? null,
    city: (row.city as string | null | undefined) ?? null,
    state: (row.state as string | null | undefined) ?? null,
    postal_code: (row.postal_code as string | null | undefined) ?? null,
    country: (row.country as string | null | undefined) ?? null,
    email: (row.email as string | null | undefined) ?? null,
    phone: (row.phone as string | null | undefined) ?? null,
    website: (row.website as string | null | undefined) ?? null,
    tax_id: (row.tax_id as string | null | undefined) ?? null,
    logo_url: (row.logo_url as string | null | undefined) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? "")
  } satisfies CompanyRow;
}

function normalizeClient(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    user_id: String(row.user_id ?? ""),
    name: String(row.name ?? ""),
    email: (row.email as string | null | undefined) ?? null,
    phone: (row.phone as string | null | undefined) ?? null,
    billing_address: (row.billing_address as string | null | undefined) ?? null,
    city: (row.city as string | null | undefined) ?? null,
    state: (row.state as string | null | undefined) ?? null,
    postal_code: (row.postal_code as string | null | undefined) ?? null,
    country: (row.country as string | null | undefined) ?? null,
    tax_id: (row.tax_id as string | null | undefined) ?? null,
    notes: (row.notes as string | null | undefined) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? "")
  } satisfies ClientRow;
}

function normalizeInvoice(row: Record<string, unknown>) {
  return {
    ...row,
    subtotal: Number(row.subtotal ?? 0),
    tax_rate: Number(row.tax_rate ?? 0),
    tax_amount: Number(row.tax_amount ?? 0),
    total: Number(row.total ?? 0)
  } as InvoiceRow;
}

function normalizeInvoiceItem(row: Record<string, unknown>) {
  return {
    ...row,
    quantity: Number(row.quantity ?? 0),
    unit_price: Number(row.unit_price ?? 0),
    line_total: Number(row.line_total ?? 0)
  } as InvoiceItemRow;
}

export async function getInvoices() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, company:companies(*), client:clients(*)")
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeInvoice(row as Record<string, unknown>));
}

export async function getInvoiceById(id: string) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*), company:companies(*), client:clients(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...normalizeInvoice(data as Record<string, unknown>),
    company: data.company ? normalizeCompany(data.company as Record<string, unknown>) : null,
    client: data.client ? normalizeClient(data.client as Record<string, unknown>) : null,
    invoice_items: ((data.invoice_items as Record<string, unknown>[] | null) ?? []).map((item) =>
      normalizeInvoiceItem(item)
    )
  } as InvoiceWithItems;
}

export async function getCompanies() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("companies").select("*").order("name");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => normalizeCompany(row));
}

export async function getCompanyById(id: string) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeCompany(data as Record<string, unknown>);
}

export async function getNextInvoiceNumbersByCompany(companies: CompanyRow[]) {
  if (!hasSupabaseEnv() || companies.length === 0) {
    return {} as Record<string, string>;
  }

  const supabase = await createServerSupabaseClient();
  const companyIds = companies.map((company) => company.id);
  const { data, error } = await supabase
    .from("invoices")
    .select("company_id, invoice_number")
    .in("company_id", companyIds);

  if (error) {
    throw new Error(error.message);
  }

  const invoiceNumbersByCompany = new Map<string, string[]>();

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const companyId = String(row.company_id ?? "");

    if (!companyId) {
      continue;
    }

    const existing = invoiceNumbersByCompany.get(companyId) ?? [];
    existing.push(String(row.invoice_number ?? ""));
    invoiceNumbersByCompany.set(companyId, existing);
  }

  return Object.fromEntries(
    companies.map((company) => [
      company.id,
      getNextInvoiceNumberForCompany(
        company.invoice_start_number,
        invoiceNumbersByCompany.get(company.id) ?? []
      )
    ])
  );
}

export async function getClients() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase.from("clients").select("*").order("name");

  if (error) {
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => normalizeClient(row));
}

export async function getClientById(id: string) {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Client profiles require sign-in.");
  }

  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeClient(data as Record<string, unknown>);
}

export async function canManageClients() {
  if (!hasSupabaseEnv()) {
    return false;
  }

  const { user } = await getAuthenticatedUser();
  return Boolean(user);
}
