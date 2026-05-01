import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { InvoiceDocumentData } from "@/types/invoice-document";

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>;
}

function AddressBlock({ title, lines }: { title: string; lines: Array<string | null> }) {
  const filteredLines = lines.filter(Boolean);

  return (
    <div>
      <DetailLabel>{title}</DetailLabel>
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

export function InvoiceDocument({
  invoice,
  id,
  className,
  hideStatus = false
}: {
  invoice: InvoiceDocumentData;
  id?: string;
  className?: string;
  hideStatus?: boolean;
}) {
  return (
    <Card
      id={id}
      className={cn("rounded-3xl bg-white p-8 print:rounded-none print:border-0 print:shadow-none", className)}
    >
      <div className="border-b border-slate-200 pb-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight text-slate-950">
              {invoice.companyName || "Your Company"}
            </p>
            <div className="space-y-1 text-sm text-slate-700">
              {invoice.companyAddress ? (
                <p className="whitespace-pre-line">{invoice.companyAddress}</p>
              ) : (
                <p>No company address added.</p>
              )}
              {invoice.companyEmail ? <p>{invoice.companyEmail}</p> : null}
              {invoice.company?.phone ? <p>{invoice.company.phone}</p> : null}
              {invoice.company?.website ? <p>{invoice.company.website}</p> : null}
            </div>
          </div>

          <div className="flex items-start justify-start lg:justify-end">
            <div className="flex h-28 w-full max-w-[280px] items-center justify-center p-4">
              {invoice.company?.logo_url ? (
                <img
                  src={invoice.company.logo_url}
                  alt={`${invoice.company.name} logo`}
                  className="max-h-20 w-auto object-contain"
                />
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <AddressBlock
            title="Bill To"
            lines={[invoice.clientName, invoice.clientEmail, invoice.clientAddress]}
          />

          <div className="space-y-6 lg:text-right">
            <div>
              <p className="text-5xl font-semibold uppercase tracking-[0.18em] text-slate-950 lg:justify-self-end">
                Invoice
              </p>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 lg:grid-cols-[120px_120px] lg:justify-end">
                <p className="font-semibold text-slate-500">Invoice #</p>
                <p className="text-slate-950 lg:text-right">{invoice.invoiceNumber}</p>
              </div>
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 lg:grid-cols-[120px_120px] lg:justify-end">
                <p className="font-semibold text-slate-500">Invoice date</p>
                <p className="text-slate-950 lg:text-right">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 lg:grid-cols-[120px_120px] lg:justify-end">
                <p className="font-semibold text-slate-500">Due date</p>
                <p className="text-slate-950 lg:text-right">{formatDate(invoice.dueDate)}</p>
              </div>
              {!hideStatus ? (
                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 lg:grid-cols-[120px_120px] lg:justify-end">
                  <p className="font-semibold text-slate-500">Status</p>
                  <p className="text-slate-950 lg:text-right">{invoice.status}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
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
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="py-4 pr-4 text-slate-900">{item.description}</td>
                <td className="py-4 pr-4 text-slate-600">{item.quantity}</td>
                <td className="py-4 pr-4 text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="py-4 text-right font-medium text-slate-900">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-8 py-8 sm:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
          {invoice.notes ? (
            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{invoice.notes}</p>
          ) : (
            <div className="mt-3 min-h-6" />
          )}
          {invoice.company?.tax_id ? (
            <p className="mt-4 text-sm text-slate-700">Tax ID / VAT: {invoice.company.tax_id}</p>
          ) : null}
          {invoice.company?.website ? (
            <p className="mt-2 text-sm text-slate-700">Website: {invoice.company.website}</p>
          ) : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tax ({invoice.taxRate}%)</span>
            <span className="font-medium text-slate-900">{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
            <span className="font-semibold text-slate-950">Total</span>
            <span className="font-semibold text-slate-950">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
