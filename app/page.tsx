import { InvoiceTable } from "@/components/invoices/invoice-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getInvoices } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils/format";
import { type InvoiceRow } from "@/types/invoice";

export const dynamic = "force-dynamic";

const UNASSIGNED_COMPANY_KEY = "__unassigned_company__";
const UNASSIGNED_COMPANY_LABEL = "Unassigned Company";

function groupInvoicesByCompany(invoices: InvoiceRow[]) {
  const groups = new Map<
    string,
    {
      key: string;
      companyName: string;
      invoices: InvoiceRow[];
      totalAmount: number;
    }
  >();

  for (const invoice of invoices) {
    const companyId =
      typeof invoice.company_id === "string" && invoice.company_id.length > 0
        ? invoice.company_id
        : UNASSIGNED_COMPANY_KEY;
    const companyName =
      typeof invoice.company_name === "string" && invoice.company_name.trim().length > 0
        ? invoice.company_name
        : UNASSIGNED_COMPANY_LABEL;
    const existingGroup = groups.get(companyId);

    if (existingGroup) {
      existingGroup.invoices.push(invoice);
      existingGroup.totalAmount += invoice.total;
      continue;
    }

    groups.set(companyId, {
      key: companyId,
      companyName,
      invoices: [invoice],
      totalAmount: invoice.total
    });
  }

  return Array.from(groups.values());
}

export default async function DashboardPage() {
  const envReady = hasSupabaseEnv();
  const invoices = envReady ? await getInvoices() : [];
  const invoiceGroups = groupInvoicesByCompany(invoices);

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
          <ButtonLink href="/invoices/new" variant="primary">
            Create Invoice
          </ButtonLink>
        </div>

        {!envReady ? (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` to load and save invoices.
            </div>
            <InvoiceTable invoices={[]} />
          </Card>
        ) : invoiceGroups.length === 0 ? (
          <Card className="overflow-hidden">
            <InvoiceTable invoices={[]} />
          </Card>
        ) : (
          <div className="space-y-4">
            {invoiceGroups.map((group, index) => (
              <Card key={group.key} className="overflow-hidden">
                <details open={index === 0} className="group">
                  <summary className="flex cursor-pointer list-none flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-slate-950">{group.companyName}</h2>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>
                          {group.invoices.length} invoice{group.invoices.length === 1 ? "" : "s"}
                        </span>
                        <span>Total: {formatCurrency(group.totalAmount)}</span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span className="group-open:hidden">Expand</span>
                      <span className="hidden group-open:inline">Collapse</span>
                      <span className="text-base transition group-open:rotate-180">▾</span>
                    </div>
                  </summary>
                  <InvoiceTable invoices={group.invoices} />
                </details>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
