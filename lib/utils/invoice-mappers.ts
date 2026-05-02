import { InvoiceFormValues } from "@/lib/validation/invoice";
import { InvoiceWithItems } from "@/types/invoice";

export function mapInvoiceToFormValues(invoice: InvoiceWithItems): InvoiceFormValues {
  return {
    companyId: invoice.company_id ?? "",
    clientId: invoice.client_id ?? "",
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date ?? "",
    status: invoice.status,
    clientName: invoice.client_name,
    clientEmail: invoice.client_email ?? "",
    clientAddress: invoice.client_address ?? "",
    companyName: invoice.company_name ?? "",
    companyEmail: invoice.company_email ?? "",
    companyAddress: invoice.company_address ?? "",
    notes: invoice.notes ?? "",
    subtotal: invoice.subtotal,
    taxRate: invoice.tax_rate,
    taxAmount: invoice.tax_amount,
    total: invoice.total,
    items: invoice.invoice_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total
    }))
  };
}
