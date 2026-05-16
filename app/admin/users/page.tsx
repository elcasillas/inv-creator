import { CreateUserForm } from "@/components/admin/create-user-form";
import { UsersTable } from "@/components/admin/users-table";
import { Card } from "@/components/ui/card";
import { requireAdminProfile } from "@/lib/auth/session";
import { queryRows } from "@/lib/d1/client";
import type { ProfileRow } from "@/types/profile";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentUser = await requireAdminProfile();
  const users = (await queryRows<Record<string, unknown>>(
    "SELECT id, email, full_name, role, disabled_at, created_at, updated_at FROM app_users ORDER BY created_at DESC"
  )).map(
    (row) =>
      ({
        id: String(row.id ?? ""),
        email: (row.email as string | null | undefined) ?? null,
        full_name: (row.full_name as string | null | undefined) ?? null,
        role: row.role === "admin" ? "admin" : "user",
        disabled_at: (row.disabled_at as string | null | undefined) ?? null,
        created_at: String(row.created_at ?? ""),
        updated_at: String(row.updated_at ?? "")
      }) satisfies ProfileRow
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Admin Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create accounts and manage access for invoice app users.
          </p>
        </div>
        <CreateUserForm />
        <Card className="p-5">
          <UsersTable users={users} currentUserId={currentUser.id} />
        </Card>
      </div>
    </main>
  );
}
