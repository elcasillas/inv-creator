import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { InvoiceItemRow, InvoiceWithItems, type InvoiceRow } from "@/types/invoice";

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

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
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

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...normalizeInvoice(data as Record<string, unknown>),
    invoice_items: ((data.invoice_items as Record<string, unknown>[] | null) ?? []).map((item) =>
      normalizeInvoiceItem(item)
    )
  } as InvoiceWithItems;
}
