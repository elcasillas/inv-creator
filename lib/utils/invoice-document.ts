import { InvoiceFormValues } from "@/lib/validation/invoice";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/utils/invoice";
import { CompanyRow } from "@/types/company";
import { ClientRow } from "@/types/client";
import { InvoiceWithItems } from "@/types/invoice";
import { InvoiceDocumentData } from "@/types/invoice-document";

export function mapInvoiceToDocument(invoice: InvoiceWithItems): InvoiceDocumentData {
  return {
    company: invoice.company,
    client: invoice.client,
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    status: invoice.status,
    clientName: invoice.client?.name ?? invoice.client_name,
    clientEmail: invoice.client?.email ?? invoice.client_email,
    clientPhone: invoice.client?.phone ?? null,
    clientAddress:
      invoice.client
        ? [
            invoice.client.billing_address,
            [invoice.client.city, invoice.client.state, invoice.client.postal_code].filter(Boolean).join(", "),
            invoice.client.country
          ]
            .filter(Boolean)
            .join("\n")
        : invoice.client_address,
    companyName: invoice.company?.name ?? invoice.company_name,
    companyEmail: invoice.company?.email ?? invoice.company_email,
    companyAddress:
      invoice.company
        ? [
            invoice.company.address,
            [invoice.company.city, invoice.company.state, invoice.company.postal_code].filter(Boolean).join(", "),
            invoice.company.country
          ]
            .filter(Boolean)
            .join("\n")
        : invoice.company_address,
    notes: invoice.notes,
    subtotal: invoice.subtotal,
    taxRate: invoice.tax_rate,
    taxAmount: invoice.tax_amount,
    total: invoice.total,
    items: invoice.invoice_items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total
    }))
  };
}

export function mapFormValuesToDocument(
  values: InvoiceFormValues,
  selectedCompany?: CompanyRow | null,
  selectedClient?: ClientRow | null
): InvoiceDocumentData {
  const totals = calculateInvoiceTotals(values);
  const derivedCompanyAddress = selectedCompany
    ? [
        selectedCompany.address,
        [selectedCompany.city, selectedCompany.state, selectedCompany.postal_code].filter(Boolean).join(", "),
        selectedCompany.country
      ]
        .filter(Boolean)
        .join("\n")
    : null;

  return {
    company: selectedCompany ?? null,
    client: selectedClient ?? null,
    invoiceNumber: values.invoiceNumber || "DRAFT",
    invoiceDate: values.invoiceDate,
    dueDate: values.dueDate || null,
    status: values.status,
    clientName: selectedClient?.name ?? values.clientName || "Client name",
    clientEmail: selectedClient?.email ?? values.clientEmail ?? null,
    clientPhone: selectedClient?.phone ?? null,
    clientAddress:
      selectedClient
        ? [
            selectedClient.billing_address,
            [selectedClient.city, selectedClient.state, selectedClient.postal_code].filter(Boolean).join(", "),
            selectedClient.country
          ]
            .filter(Boolean)
            .join("\n")
        : values.clientAddress ?? null,
    companyName: selectedCompany?.name ?? values.companyName ?? null,
    companyEmail: selectedCompany?.email ?? values.companyEmail ?? null,
    companyAddress: derivedCompanyAddress ?? values.companyAddress ?? null,
    notes: values.notes || null,
    subtotal: totals.subtotal,
    taxRate: values.taxRate,
    taxAmount: totals.taxAmount,
    total: totals.total,
    items: values.items.map((item, index) => ({
      id: `${index}`,
      description: item.description || "Line item",
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      lineTotal: calculateLineTotal(Number(item.quantity) || 0, Number(item.unitPrice) || 0)
    }))
  };
}
