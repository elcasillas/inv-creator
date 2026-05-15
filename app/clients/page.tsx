import { ClientTable } from "@/components/clients/client-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { canManageClients, getClients } from "@/lib/d1/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const authEnabled = await canManageClients();
  const clients = await getClients();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Clients</h1>
            <p className="mt-1 text-sm text-slate-500">
              Save reusable client profiles for invoice billing details.
            </p>
          </div>
          <ButtonLink href="/clients/new" variant="primary">
            Add Client
          </ButtonLink>
        </div>
        <Card className="overflow-hidden">
          {!authEnabled ? (
            <div className="border-b border-slate-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              Add `CLOUDFLARE_API_TOKEN` in `.env.local` to create and reuse saved clients.
            </div>
          ) : null}
          <ClientTable clients={clients} />
        </Card>
      </div>
    </main>
  );
}
