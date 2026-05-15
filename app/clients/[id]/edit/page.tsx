import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { canManageClients, getClientById } from "@/lib/d1/queries";
import { mapClientToFormValues } from "@/lib/utils/client-mappers";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authEnabled = await canManageClients();

  if (!authEnabled) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="space-y-2">
            <Link href="/clients" className="text-sm text-slate-500 hover:text-slate-900">
              Back to clients
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Edit Client</h1>
            <p className="text-sm text-slate-500">Configure Cloudflare D1 to edit saved client profiles.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Add `CLOUDFLARE_API_TOKEN` in `.env.local` to manage your saved clients.
          </div>
        </div>
      </main>
    );
  }

  try {
    const client = await getClientById(id);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="space-y-2">
            <Link href="/clients" className="text-sm text-slate-500 hover:text-slate-900">
              Back to clients
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Edit Client</h1>
            <p className="text-sm text-slate-500">Update this saved client profile.</p>
          </div>
          <ClientForm
            mode="edit"
            clientId={id}
            initialValues={mapClientToFormValues(client)}
            authEnabled={authEnabled}
          />
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
