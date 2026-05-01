import { InvoiceTable } from "@/components/invoices/invoice-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getInvoices } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const envReady = hasSupabaseEnv();
  const invoices = envReady ? await getInvoices() : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Invoices</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, manage, and print invoices from one simple dashboard.
            </p>
          </div>
          <ButtonLink href="/invoices/new" className="bg-slate-900 text-white hover:bg-slate-800">
            Create Invoice
          </ButtonLink>
        </div>

        <Card className="overflow-hidden">
          {!envReady ? (
            <div className="border-b border-slate-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` to load and save invoices.
            </div>
          ) : null}
          <InvoiceTable invoices={invoices} />
        </Card>
      </div>
    </main>
  );
}
