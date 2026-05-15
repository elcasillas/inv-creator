import Link from "next/link";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getClients, getCompanies, getNextInvoiceNumbersByCompany } from "@/lib/d1/queries";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const companies = await getCompanies();
  const clients = await getClients();
  const nextInvoiceNumbers = await getNextInvoiceNumbersByCompany(companies);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            Back to invoices
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Create Invoice</h1>
          <p className="text-sm text-slate-500">
            Enter the invoice details and save them to Cloudflare D1.
          </p>
        </div>
        <InvoiceForm
          mode="create"
          companies={companies}
          clients={clients}
          nextInvoiceNumbers={nextInvoiceNumbers}
        />
      </div>
    </main>
  );
}
