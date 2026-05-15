"use server";

import { revalidatePath } from "next/cache";
import { executeStatement } from "@/lib/d1/client";
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
    const payload = normalizeClientPayload(values);
    const clientId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    await executeStatement(
      `INSERT INTO clients (
        id, user_id, name, email, phone, billing_address, city, state, postal_code,
        country, tax_id, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        "local",
        payload.name,
        payload.email,
        payload.phone,
        payload.billing_address,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country,
        payload.tax_id,
        payload.notes,
        timestamp,
        timestamp
      ]
    );

    revalidatePath("/clients");
    revalidatePath("/invoices/new");
    return { success: true, clientId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to save client." };
  }
}

export async function updateClientAction(
  id: string,
  values: ClientFormValues
): Promise<ClientActionResult> {
  try {
    const payload = normalizeClientPayload(values);
    await executeStatement(
      `UPDATE clients
       SET name = ?, email = ?, phone = ?, billing_address = ?, city = ?, state = ?, postal_code = ?,
           country = ?, tax_id = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.name,
        payload.email,
        payload.phone,
        payload.billing_address,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country,
        payload.tax_id,
        payload.notes,
        new Date().toISOString(),
        id
      ]
    );

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}/edit`);
    revalidatePath("/invoices/new");
    return { success: true, clientId: id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Failed to update client." };
  }
}

export async function deleteClientAction(id: string) {
  await executeStatement("DELETE FROM clients WHERE id = ?", [id]);

  revalidatePath("/clients");
  revalidatePath("/invoices/new");
}
