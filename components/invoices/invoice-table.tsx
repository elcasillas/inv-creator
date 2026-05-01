import Link from "next/link";
import { deleteInvoiceAction } from "@/app/actions/invoice-actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { InvoiceRow } from "@/types/invoice";
import { StatusBadge } from "@/components/invoices/status-badge";
import { DeleteInvoiceButton } from "@/components/invoices/delete-invoice-button";

export function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No invoices yet</h2>
        <p className="mt-2 text-sm text-slate-500">
          Start by creating your first invoice from the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50">
          <tr className="text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-medium">Invoice #</th>
            <th className="px-5 py-3 font-medium">Client</th>
            <th className="px-5 py-3 font-medium">Invoice Date</th>
            <th className="px-5 py-3 font-medium">Due Date</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Total</th>
            <th className="px-5 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="align-top text-sm text-slate-700">
              <td className="px-5 py-4 font-medium text-slate-950">{invoice.invoice_number}</td>
              <td className="px-5 py-4">{invoice.client_name}</td>
              <td className="px-5 py-4">{formatDate(invoice.invoice_date)}</td>
              <td className="px-5 py-4">{formatDate(invoice.due_date)}</td>
              <td className="px-5 py-4">
                <StatusBadge status={invoice.status} />
              </td>
              <td className="px-5 py-4 font-medium text-slate-950">
                {formatCurrency(invoice.total)}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link href={`/invoices/${invoice.id}`} className="text-slate-700 hover:text-slate-950">
                    View
                  </Link>
                  <Link
                    href={`/invoices/${invoice.id}/edit`}
                    className="text-slate-700 hover:text-slate-950"
                  >
                    Edit
                  </Link>
                  <form action={deleteInvoiceAction.bind(null, invoice.id)}>
                    <DeleteInvoiceButton />
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
