import Link from "next/link";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
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
        <ClientForm mode="create" />
      </div>
    </main>
  );
}
