import { ClientTable } from "@/components/clients/client-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getClients } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
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
          <ClientTable clients={clients} />
        </Card>
      </div>
    </main>
  );
}
