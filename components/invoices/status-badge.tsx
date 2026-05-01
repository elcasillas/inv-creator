import { cn } from "@/lib/utils/cn";
import { InvoiceStatus } from "@/types/invoice";

const statusStyles: Record<InvoiceStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Sent: "bg-sky-100 text-sky-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-rose-100 text-rose-700"
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
