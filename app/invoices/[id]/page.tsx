import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { DownloadPdfButton } from "@/components/invoices/download-pdf-button";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { StatusBadge } from "@/components/invoices/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { getInvoiceById } from "@/lib/supabase/queries";
import { mapInvoiceToDocument } from "@/lib/utils/invoice-document";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string; updated?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const wasCreated = resolvedSearchParams?.created === "1";
  const wasUpdated = resolvedSearchParams?.updated === "1";

  try {
    const invoice = await getInvoiceById(id);
    const invoiceDocument = mapInvoiceToDocument(invoice);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {wasCreated ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">
              Invoice saved successfully.
            </div>
          ) : null}
          {wasUpdated ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">
              Invoice updated successfully.
            </div>
          ) : null}
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
              <DownloadPdfButton
                targetId="invoice-detail-pdf"
                invoiceNumber={invoice.invoice_number}
              />
              <ButtonLink
                href={`/invoices/${invoice.id}/edit` as Route}
                variant="primary"
              >
                Edit Invoice
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
            <div className="border-b border-slate-200 px-8 py-5 print:hidden">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Status</span>
                <StatusBadge status={invoice.status} />
              </div>
            </div>
            <InvoiceDocument invoice={invoiceDocument} id="invoice-detail-pdf" hideStatus className="border-0 shadow-none" />
          </div>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
