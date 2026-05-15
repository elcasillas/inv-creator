import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Admin Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            This D1-based version no longer uses Supabase Auth user management.
          </p>
        </div>
        <Card className="border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Admin account management was removed with the Supabase dependency. If you still need application auth,
          it should be reintroduced as a separate Cloudflare-compatible auth flow.
        </Card>
      </div>
    </main>
  );
}
