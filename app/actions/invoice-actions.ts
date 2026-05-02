"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/utils/invoice";
import { invoiceSchema, type InvoiceFormValues } from "@/lib/validation/invoice";

type InvoiceActionResult =
  | { success: true; invoiceId: string }
  | { success: false; message: string };

function normalizePayload(values: InvoiceFormValues) {
  const totals = calculateInvoiceTotals(values);

  const parsed = invoiceSchema.parse({
    ...values,
    dueDate: values.dueDate || "",
    clientEmail: values.clientEmail || "",
    clientAddress: values.clientAddress || "",
    companyName: values.companyName || "",
    companyEmail: values.companyEmail || "",
    companyAddress: values.companyAddress || "",
    notes: values.notes || "",
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    total: totals.total,
    items: values.items.map((item) => ({
      ...item,
      lineTotal: calculateLineTotal(item.quantity, item.unitPrice)
    }))
  });

  return {
    invoice: {
      company_id: parsed.companyId,
      client_id: parsed.clientId || null,
      invoice_number: parsed.invoiceNumber,
      invoice_date: parsed.invoiceDate,
      due_date: parsed.dueDate || null,
      status: parsed.status,
      client_name: parsed.clientName,
      client_email: parsed.clientEmail || null,
      client_address: parsed.clientAddress || null,
      company_name: parsed.companyName || null,
      company_email: parsed.companyEmail || null,
      company_address: parsed.companyAddress || null,
      notes: parsed.notes || null,
      subtotal: parsed.subtotal,
      tax_rate: parsed.taxRate,
      tax_amount: parsed.taxAmount,
      total: parsed.total
    },
    items: parsed.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal
    }))
  };
}

export async function createInvoiceAction(values: InvoiceFormValues): Promise<InvoiceActionResult> {
  try {
    const supabase = createServerSupabaseClient();
    const payload = normalizePayload(values);
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", payload.invoice.company_id)
      .single();

    if (companyError) {
      return { success: false, message: companyError.message };
    }

    payload.invoice.company_name = company.name;
    payload.invoice.company_email = company.email;
    payload.invoice.company_address = [
      company.address,
      [company.city, company.state, company.postal_code].filter(Boolean).join(", "),
      company.country
    ]
      .filter(Boolean)
      .join("\n");

    if (payload.invoice.client_id) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", payload.invoice.client_id)
        .single();

      if (clientError) {
        return { success: false, message: clientError.message };
      }

      payload.invoice.client_name = client.name;
      payload.invoice.client_email = client.email;
      payload.invoice.client_address = [
        client.billing_address,
        [client.city, client.state, client.postal_code].filter(Boolean).join(", "),
        client.country
      ]
        .filter(Boolean)
        .join("\n");
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(payload.invoice)
      .select("id")
      .single();

    if (invoiceError) {
      return { success: false, message: invoiceError.message };
    }

    const { error: itemsError } = await supabase.from("invoice_items").insert(
      payload.items.map((item) => ({
        invoice_id: invoice.id,
        ...item
      }))
    );

    if (itemsError) {
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return { success: false, message: itemsError.message };
    }

    revalidatePath("/");
    revalidatePath(`/invoices/${invoice.id}`);

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save invoice."
    };
  }
}

export async function updateInvoiceAction(
  id: string,
  values: InvoiceFormValues
): Promise<InvoiceActionResult> {
  try {
    const supabase = createServerSupabaseClient();
    const payload = normalizePayload(values);
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", payload.invoice.company_id)
      .single();

    if (companyError) {
      return { success: false, message: companyError.message };
    }

    payload.invoice.company_name = company.name;
    payload.invoice.company_email = company.email;
    payload.invoice.company_address = [
      company.address,
      [company.city, company.state, company.postal_code].filter(Boolean).join(", "),
      company.country
    ]
      .filter(Boolean)
      .join("\n");

    if (payload.invoice.client_id) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", payload.invoice.client_id)
        .single();

      if (clientError) {
        return { success: false, message: clientError.message };
      }

      payload.invoice.client_name = client.name;
      payload.invoice.client_email = client.email;
      payload.invoice.client_address = [
        client.billing_address,
        [client.city, client.state, client.postal_code].filter(Boolean).join(", "),
        client.country
      ]
        .filter(Boolean)
        .join("\n");
    }

    const { error: invoiceError } = await supabase.from("invoices").update(payload.invoice).eq("id", id);

    if (invoiceError) {
      return { success: false, message: invoiceError.message };
    }

    const { error: deleteItemsError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id);

    if (deleteItemsError) {
      return { success: false, message: deleteItemsError.message };
    }

    const { error: itemsError } = await supabase.from("invoice_items").insert(
      payload.items.map((item) => ({
        invoice_id: id,
        ...item
      }))
    );

    if (itemsError) {
      return { success: false, message: itemsError.message };
    }

    revalidatePath("/");
    revalidatePath(`/invoices/${id}`);
    revalidatePath(`/invoices/${id}/edit`);

    return { success: true, invoiceId: id };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update invoice."
    };
  }
}

export async function deleteInvoiceAction(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}
