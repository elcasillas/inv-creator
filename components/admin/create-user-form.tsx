"use client";

import { useRef, useState, useTransition } from "react";
import { createUserAction } from "@/app/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      setMessage(null);
      const result = await createUserAction(formData);
      setMessage({ type: result.success ? "success" : "error", text: result.message });

      if (result.success) {
        formRef.current?.reset();
      }
    });
  }

  return (
    <Card className="p-6">
      <form ref={formRef} action={onSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Full Name">
            <Input name="fullName" required placeholder="Jane Doe" />
          </FormField>
          <FormField label="Email">
            <Input name="email" type="email" required placeholder="jane@example.com" />
          </FormField>
          <FormField label="Password">
            <Input name="password" type="password" required minLength={8} placeholder="Minimum 8 characters" />
          </FormField>
          <FormField label="Role">
            <Select name="role" defaultValue="user">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
          </FormField>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          ) : (
            <div />
          )}
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
