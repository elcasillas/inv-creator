"use client";

import { useState, useTransition } from "react";
import {
  deleteUserAction,
  setUserDisabledAction,
  updateUserAction
} from "@/app/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ProfileRow } from "@/types/profile";

export function UsersTable({
  users,
  currentUserId
}: {
  users: ProfileRow[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function runAction(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      setMessage({ type: result.success ? "success" : "error", text: result.message });
    });
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No users found</h2>
        <p className="mt-2 text-sm text-slate-500">Create the first managed user account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p
          className={
            message.type === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const disabled = Boolean(user.disabled_at);

              return (
                <tr key={user.id} className="align-top text-sm text-slate-700">
                  <td className="px-5 py-4">
                    <Input
                      form={`user-${user.id}`}
                      name="fullName"
                      defaultValue={user.full_name ?? ""}
                      required
                      className="min-w-48"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="min-w-56 font-medium text-slate-950">{user.email ?? "No email"}</div>
                    {isCurrentUser ? <div className="mt-1 text-xs text-slate-500">Current user</div> : null}
                  </td>
                  <td className="px-5 py-4">
                    <Select
                      form={`user-${user.id}`}
                      name="role"
                      defaultValue={user.role}
                      disabled={isCurrentUser}
                      className="min-w-32"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </Select>
                    {isCurrentUser ? <input form={`user-${user.id}`} type="hidden" name="role" value="admin" /> : null}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        disabled
                          ? "inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"
                          : "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                      }
                    >
                      {disabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex min-w-72 flex-wrap gap-2">
                      <form
                        id={`user-${user.id}`}
                        action={(formData) => runAction(() => updateUserAction(user.id, formData))}
                      >
                        <Button type="submit" disabled={isPending}>
                          {isPending ? "Saving..." : "Save"}
                        </Button>
                      </form>
                      <Button
                        type="button"
                        disabled={isPending || isCurrentUser}
                        onClick={() => runAction(() => setUserDisabledAction(user.id, !disabled))}
                      >
                        {disabled ? "Enable" : "Disable"}
                      </Button>
                      <Button
                        type="button"
                        disabled={isPending || isCurrentUser}
                        onClick={() => {
                          if (window.confirm(`Delete ${user.email ?? "this user"}? This cannot be undone.`)) {
                            runAction(() => deleteUserAction(user.id));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
