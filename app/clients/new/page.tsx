import Link from "next/link";
import { ClientForm } from "@/components/clients/client-form";
import { canManageClients } from "@/lib/d1/queries";

export default async function NewClientPage() {
  const authEnabled = await canManageClients();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <Link href="/clients" className="text-sm text-slate-500 hover:text-slate-900">
            Back to clients
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Create Client</h1>
          <p className="text-sm text-slate-500">Save a reusable client profile.</p>
        </div>
        {!authEnabled ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Add `CLOUDFLARE_API_TOKEN` in `.env.local` to save reusable clients. You can still create invoices
            using manual client details.
          </div>
        ) : null}
        <ClientForm mode="create" authEnabled={authEnabled} />
      </div>
    </main>
  );
}
