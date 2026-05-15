"use server";

import { revalidatePath } from "next/cache";
import { executeStatement, queryRows } from "@/lib/d1/client";
import { getClientById, getCompanyById } from "@/lib/d1/queries";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/utils/invoice";
import { getNextInvoiceNumberForCompany } from "@/lib/utils/invoice-number";
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

async function generateNextInvoiceNumber(
  companyId: string,
  invoiceStartNumber: number
) {
  const data = await queryRows<{ invoice_number: string | null }>(
    "SELECT invoice_number FROM invoices WHERE company_id = ?",
    [companyId]
  );

  return getNextInvoiceNumberForCompany(
    invoiceStartNumber,
    data.map((row) => row.invoice_number)
  );
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("unique");
}

export async function createInvoiceAction(values: InvoiceFormValues): Promise<InvoiceActionResult> {
  try {
    const payload = normalizePayload(values);
    const company = await getCompanyById(payload.invoice.company_id);

    let invoiceId: string | null = null;

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
      const client = await getClientById(payload.invoice.client_id);

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

    for (let attempt = 0; attempt < 3; attempt += 1) {
      payload.invoice.invoice_number = await generateNextInvoiceNumber(
        payload.invoice.company_id,
        company.invoice_start_number
      );

      try {
        const nextInvoiceId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        await executeStatement(
          `INSERT INTO invoices (
            id, company_id, client_id, invoice_number, invoice_date, due_date, status,
            client_name, client_email, client_address, company_name, company_email,
            company_address, notes, subtotal, tax_rate, tax_amount, total, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nextInvoiceId,
            payload.invoice.company_id,
            payload.invoice.client_id,
            payload.invoice.invoice_number,
            payload.invoice.invoice_date,
            payload.invoice.due_date,
            payload.invoice.status,
            payload.invoice.client_name,
            payload.invoice.client_email,
            payload.invoice.client_address,
            payload.invoice.company_name,
            payload.invoice.company_email,
            payload.invoice.company_address,
            payload.invoice.notes,
            payload.invoice.subtotal,
            payload.invoice.tax_rate,
            payload.invoice.tax_amount,
            payload.invoice.total,
            timestamp,
            timestamp
          ]
        );
        invoiceId = nextInvoiceId;
        break;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          continue;
        }

        return { success: false, message: error instanceof Error ? error.message : "Failed to save invoice." };
      }
    }

    if (!invoiceId) {
      return {
        success: false,
        message: "Failed to generate a unique invoice number for this company. Please try again."
      };
    }

    try {
      for (const item of payload.items) {
        await executeStatement(
          `INSERT INTO invoice_items (
            id, invoice_id, description, quantity, unit_price, line_total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            invoiceId,
            item.description,
            item.quantity,
            item.unit_price,
            item.line_total,
            new Date().toISOString()
          ]
        );
      }
    } catch (error) {
      await executeStatement("DELETE FROM invoices WHERE id = ?", [invoiceId]);
      return { success: false, message: error instanceof Error ? error.message : "Failed to save invoice items." };
    }

    revalidatePath("/");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices/new");

    return { success: true, invoiceId };
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
    const payload = normalizePayload(values);
    const company = await getCompanyById(payload.invoice.company_id);

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
      const client = await getClientById(payload.invoice.client_id);

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

    try {
      await executeStatement(
        `UPDATE invoices
         SET company_id = ?, client_id = ?, invoice_number = ?, invoice_date = ?, due_date = ?, status = ?,
             client_name = ?, client_email = ?, client_address = ?, company_name = ?, company_email = ?,
             company_address = ?, notes = ?, subtotal = ?, tax_rate = ?, tax_amount = ?, total = ?, updated_at = ?
         WHERE id = ?`,
        [
          payload.invoice.company_id,
          payload.invoice.client_id,
          payload.invoice.invoice_number,
          payload.invoice.invoice_date,
          payload.invoice.due_date,
          payload.invoice.status,
          payload.invoice.client_name,
          payload.invoice.client_email,
          payload.invoice.client_address,
          payload.invoice.company_name,
          payload.invoice.company_email,
          payload.invoice.company_address,
          payload.invoice.notes,
          payload.invoice.subtotal,
          payload.invoice.tax_rate,
          payload.invoice.tax_amount,
          payload.invoice.total,
          new Date().toISOString(),
          id
        ]
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return { success: false, message: "Invoice number must be unique for each company." };
      }

      return { success: false, message: error instanceof Error ? error.message : "Failed to update invoice." };
    }

    await executeStatement("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);

    try {
      for (const item of payload.items) {
        await executeStatement(
          `INSERT INTO invoice_items (
            id, invoice_id, description, quantity, unit_price, line_total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            id,
            item.description,
            item.quantity,
            item.unit_price,
            item.line_total,
            new Date().toISOString()
          ]
        );
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to update invoice items." };
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
  await executeStatement("DELETE FROM invoices WHERE id = ?", [id]);

  revalidatePath("/");
}
