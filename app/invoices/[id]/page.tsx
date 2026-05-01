import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/invoices/print-button";
import { StatusBadge } from "@/components/invoices/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getInvoiceById } from "@/lib/supabase/queries";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

function AddressBlock({ title, lines }: { title: string; lines: Array<string | null> }) {
  const filteredLines = lines.filter(Boolean);

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {filteredLines.length ? (
        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {filteredLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No details added.</p>
      )}
    </div>
  );
}

export default async function InvoiceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const invoice = await getInvoiceById(id);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
                Back to invoices
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Invoice {invoice.invoice_number}
              </h1>
            </div>
            <div className="flex gap-3">
              <PrintButton />
              <ButtonLink
                href={`/invoices/${invoice.id}/edit` as Route}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Edit Invoice
              </ButtonLink>
            </div>
          </div>

          <Card className="rounded-3xl p-8 print:rounded-none print:border-0 print:shadow-none">
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Invoice</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {invoice.invoice_number}
                </h2>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <span>Status</span>
                  <StatusBadge status={invoice.status} />
                </div>
                <p>Invoice Date: {formatDate(invoice.invoice_date)}</p>
                <p>Due Date: {formatDate(invoice.due_date)}</p>
              </div>
            </div>

            <div className="grid gap-8 border-b border-slate-200 py-8 sm:grid-cols-2">
              <AddressBlock
                title="Billed To"
                lines={[invoice.client_name, invoice.client_email, invoice.client_address]}
              />
              <AddressBlock
                title="From"
                lines={[invoice.company_name, invoice.company_email, invoice.company_address]}
              />
            </div>

            <div className="overflow-x-auto border-b border-slate-200 py-8">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Quantity</th>
                    <th className="pb-3 font-medium">Unit Price</th>
                    <th className="pb-3 text-right font-medium">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pr-4 text-slate-900">{item.description}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.quantity}</td>
                      <td className="py-4 pr-4 text-slate-600">{formatCurrency(item.unit_price)}</td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-8 py-8 sm:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                  {invoice.notes || "No notes added."}
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tax ({invoice.tax_rate}%)</span>
                  <span className="font-medium text-slate-900">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
                  <span className="font-semibold text-slate-950">Total</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
