import { redirect } from "next/navigation";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { UsersTable } from "@/components/admin/users-table";
import { Card } from "@/components/ui/card";
import { normalizeProfile, requireAdminProfile } from "@/lib/supabase/auth";
import { hasSupabaseServiceEnv } from "@/lib/supabase/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { user, isAdmin } = await requireAdminProfile();

  if (!user || !isAdmin) {
    redirect("/");
  }

  const serviceConfigured = hasSupabaseServiceEnv();
  const users = serviceConfigured
    ? await createServiceRoleSupabaseClient()
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            throw new Error(error.message);
          }

          return ((data ?? []) as Record<string, unknown>[]).map((row) => normalizeProfile(row));
        })
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Admin Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create accounts and manage role access for invoice app users.
          </p>
        </div>

        {!serviceConfigured ? (
          <Card className="border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Add `SUPABASE_SERVICE_ROLE_KEY` in the server environment to enable admin user management.
          </Card>
        ) : (
          <>
            <CreateUserForm />
            <Card className="p-5">
              <UsersTable users={users} currentUserId={user.id} />
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
