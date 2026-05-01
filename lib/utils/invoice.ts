import { InvoiceFormValues } from "@/lib/validation/invoice";

export function calculateLineTotal(quantity: number, unitPrice: number) {
  return roundCurrency(quantity * unitPrice);
}

export function calculateInvoiceTotals(values: Pick<InvoiceFormValues, "items" | "taxRate">) {
  const subtotal = roundCurrency(
    values.items.reduce((sum, item) => sum + calculateLineTotal(item.quantity, item.unitPrice), 0)
  );
  const taxAmount = roundCurrency(subtotal * (values.taxRate / 100));
  const total = roundCurrency(subtotal + taxAmount);

  return {
    subtotal,
    taxAmount,
    total
  };
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}
