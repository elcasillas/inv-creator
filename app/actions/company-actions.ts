"use server";

import { revalidatePath } from "next/cache";
import { executeStatement } from "@/lib/d1/client";
import { companySchema, type CompanyFormValues } from "@/lib/validation/company";

type CompanyActionResult =
  | { success: true; companyId: string }
  | { success: false; message: string };

function normalizeCompanyPayload(values: CompanyFormValues) {
  const parsed = companySchema.parse(values);

  return {
    name: parsed.name,
    invoice_start_number: parsed.invoiceStartNumber,
    address: parsed.address || null,
    city: parsed.city || null,
    state: parsed.state || null,
    postal_code: parsed.postalCode || null,
    country: parsed.country || null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    website: parsed.website || null,
    tax_id: parsed.taxId || null,
    logo_url: parsed.logoUrl || null
  };
}

export async function createCompanyAction(values: CompanyFormValues): Promise<CompanyActionResult> {
  try {
    const payload = normalizeCompanyPayload(values);
    const companyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    await executeStatement(
      `INSERT INTO companies (
        id, name, invoice_start_number, address, city, state, postal_code, country,
        email, phone, website, tax_id, logo_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        payload.name,
        payload.invoice_start_number,
        payload.address,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country,
        payload.email,
        payload.phone,
        payload.website,
        payload.tax_id,
        payload.logo_url,
        timestamp,
        timestamp
      ]
    );

    revalidatePath("/companies");
    revalidatePath("/invoices/new");
    return { success: true, companyId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to save company." };
  }
}

export async function updateCompanyAction(
  id: string,
  values: CompanyFormValues
): Promise<CompanyActionResult> {
  try {
    const payload = normalizeCompanyPayload(values);
    await executeStatement(
      `UPDATE companies
       SET name = ?, invoice_start_number = ?, address = ?, city = ?, state = ?, postal_code = ?,
           country = ?, email = ?, phone = ?, website = ?, tax_id = ?, logo_url = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.name,
        payload.invoice_start_number,
        payload.address,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country,
        payload.email,
        payload.phone,
        payload.website,
        payload.tax_id,
        payload.logo_url,
        new Date().toISOString(),
        id
      ]
    );

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}/edit`);
    revalidatePath("/invoices/new");
    return { success: true, companyId: id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update company." };
  }
}

export async function deleteCompanyAction(id: string) {
  await executeStatement("DELETE FROM companies WHERE id = ?", [id]);

  revalidatePath("/companies");
  revalidatePath("/invoices/new");
}
