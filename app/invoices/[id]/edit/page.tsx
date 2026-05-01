import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getInvoiceById } from "@/lib/supabase/queries";
import { mapInvoiceToFormValues } from "@/lib/utils/invoice-mappers";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const invoice = await getInvoiceById(id);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <Link href={`/invoices/${id}` as Route} className="text-sm text-slate-500 hover:text-slate-900">
              Back to invoice
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Edit Invoice</h1>
            <p className="text-sm text-slate-500">
              Update the invoice and replace its line items in Supabase.
            </p>
          </div>
          <InvoiceForm mode="edit" invoiceId={id} initialValues={mapInvoiceToFormValues(invoice)} />
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
