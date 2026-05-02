"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    const supabase = await createServerSupabaseClient();
    const payload = normalizeCompanyPayload(values);
    const { data, error } = await supabase.from("companies").insert(payload).select("id").single();

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/companies");
    revalidatePath("/invoices/new");
    return { success: true, companyId: data.id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to save company." };
  }
}

export async function updateCompanyAction(
  id: string,
  values: CompanyFormValues
): Promise<CompanyActionResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const payload = normalizeCompanyPayload(values);
    const { error } = await supabase.from("companies").update(payload).eq("id", id);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/companies");
    revalidatePath(`/companies/${id}/edit`);
    revalidatePath("/invoices/new");
    return { success: true, companyId: id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update company." };
  }
}

export async function deleteCompanyAction(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/companies");
  revalidatePath("/invoices/new");
}
