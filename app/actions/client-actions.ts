"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clientSchema, type ClientFormValues } from "@/lib/validation/client";

type ClientActionResult =
  | { success: true; clientId: string }
  | { success: false; message: string };

function normalizeClientPayload(values: ClientFormValues) {
  const parsed = clientSchema.parse(values);

  return {
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    billing_address: parsed.billingAddress || null,
    city: parsed.city || null,
    state: parsed.state || null,
    postal_code: parsed.postalCode || null,
    country: parsed.country || null,
    tax_id: parsed.taxId || null,
    notes: parsed.notes || null
  };
}

export async function createClientAction(values: ClientFormValues): Promise<ClientActionResult> {
  try {
    const supabase = createServerSupabaseClient();
    const payload = normalizeClientPayload(values);
    const { data, error } = await supabase.from("clients").insert(payload).select("id").single();

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/clients");
    revalidatePath("/invoices/new");
    return { success: true, clientId: data.id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to save client." };
  }
}

export async function updateClientAction(
  id: string,
  values: ClientFormValues
): Promise<ClientActionResult> {
  try {
    const supabase = createServerSupabaseClient();
    const payload = normalizeClientPayload(values);
    const { error } = await supabase.from("clients").update(payload).eq("id", id);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}/edit`);
    revalidatePath("/invoices/new");
    return { success: true, clientId: id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update client." };
  }
}

export async function deleteClientAction(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clients");
  revalidatePath("/invoices/new");
}
