import { queryFirst, queryRows } from "@/lib/d1/client";
import { hasD1Env } from "@/lib/d1/env";
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
    user_id: String(row.user_id ?? "local"),
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
  if (!hasD1Env()) {
    return [];
  }

  const rows = await queryRows<Record<string, unknown>>(
    "SELECT * FROM invoices ORDER BY invoice_date DESC, created_at DESC"
  );
  return rows.map((row) => normalizeInvoice(row));
}

export async function getInvoiceById(id: string) {
  if (!hasD1Env()) {
    throw new Error("Cloudflare D1 is not configured.");
  }

  const invoice = await queryFirst<Record<string, unknown>>("SELECT * FROM invoices WHERE id = ? LIMIT 1", [id]);

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const [company, client, items] = await Promise.all([
    invoice.company_id
      ? queryFirst<Record<string, unknown>>("SELECT * FROM companies WHERE id = ? LIMIT 1", [invoice.company_id])
      : Promise.resolve(null),
    invoice.client_id
      ? queryFirst<Record<string, unknown>>("SELECT * FROM clients WHERE id = ? LIMIT 1", [invoice.client_id])
      : Promise.resolve(null),
    queryRows<Record<string, unknown>>(
      "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC, id ASC",
      [id]
    )
  ]);

  return {
    ...normalizeInvoice(invoice),
    company: company ? normalizeCompany(company) : null,
    client: client ? normalizeClient(client) : null,
    invoice_items: items.map((item) => normalizeInvoiceItem(item))
  } as InvoiceWithItems;
}

export async function getCompanies() {
  if (!hasD1Env()) {
    return [];
  }

  const rows = await queryRows<Record<string, unknown>>("SELECT * FROM companies ORDER BY name ASC");
  return rows.map((row) => normalizeCompany(row));
}

export async function getCompanyById(id: string) {
  if (!hasD1Env()) {
    throw new Error("Cloudflare D1 is not configured.");
  }

  const row = await queryFirst<Record<string, unknown>>("SELECT * FROM companies WHERE id = ? LIMIT 1", [id]);

  if (!row) {
    throw new Error("Company not found.");
  }

  return normalizeCompany(row);
}

export async function getNextInvoiceNumbersByCompany(companies: CompanyRow[]) {
  if (!hasD1Env() || companies.length === 0) {
    return {} as Record<string, string>;
  }

  const placeholders = companies.map(() => "?").join(", ");
  const rows = await queryRows<Record<string, unknown>>(
    `SELECT company_id, invoice_number FROM invoices WHERE company_id IN (${placeholders})`,
    companies.map((company) => company.id)
  );

  const invoiceNumbersByCompany = new Map<string, string[]>();

  for (const row of rows) {
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
  if (!hasD1Env()) {
    return [];
  }

  const rows = await queryRows<Record<string, unknown>>("SELECT * FROM clients ORDER BY name ASC");
  return rows.map((row) => normalizeClient(row));
}

export async function getClientById(id: string) {
  if (!hasD1Env()) {
    throw new Error("Cloudflare D1 is not configured.");
  }

  const row = await queryFirst<Record<string, unknown>>("SELECT * FROM clients WHERE id = ? LIMIT 1", [id]);

  if (!row) {
    throw new Error("Client not found.");
  }

  return normalizeClient(row);
}

export async function canManageClients() {
  return hasD1Env();
}
