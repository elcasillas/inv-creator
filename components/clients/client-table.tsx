import Link from "next/link";
import { deleteClientAction } from "@/app/actions/client-actions";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { ClientRow } from "@/types/client";

export function ClientTable({ clients }: { clients: ClientRow[] }) {
  if (clients.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No clients yet</h2>
        <p className="mt-2 text-sm text-slate-500">
          Save client profiles to reuse billing details on future invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50">
          <tr className="text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-medium">Client</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Phone</th>
            <th className="px-5 py-3 font-medium">Country</th>
            <th className="px-5 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {clients.map((client) => (
            <tr key={client.id} className="align-top text-sm text-slate-700">
              <td className="px-5 py-4 font-medium text-slate-950">{client.name}</td>
              <td className="px-5 py-4">{client.email || "—"}</td>
              <td className="px-5 py-4">{client.phone || "—"}</td>
              <td className="px-5 py-4">{client.country || "—"}</td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-3">
                  <Link href={`/clients/${client.id}/edit`} className="text-slate-700 hover:text-slate-950">
                    Edit
                  </Link>
                  <form action={deleteClientAction.bind(null, client.id)}>
                    <DeleteClientButton />
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
