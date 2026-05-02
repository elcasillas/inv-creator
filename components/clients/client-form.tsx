"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientAction, updateClientAction } from "@/app/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientDefaults, clientSchema, type ClientFormValues } from "@/lib/validation/client";

export function ClientForm({
  mode,
  clientId,
  initialValues
}: {
  mode: "create" | "edit";
  clientId?: string;
  initialValues?: ClientFormValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialValues ?? clientDefaults
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setSubmitError(null);
      const result =
        mode === "edit" && clientId
          ? await updateClientAction(clientId, values)
          : await createClientAction(values);

      if (!result.success) {
        setSubmitError(result.message);
        return;
      }

      router.push("/clients");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Client Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Acme Inc." />
          </FormField>
          <FormField label="Email" error={form.formState.errors.email?.message}>
            <Input {...form.register("email")} type="email" placeholder="billing@client.com" />
          </FormField>
          <FormField label="Phone" error={form.formState.errors.phone?.message}>
            <Input {...form.register("phone")} placeholder="+1 555 123 4567" />
          </FormField>
          <FormField label="Tax ID" error={form.formState.errors.taxId?.message}>
            <Input {...form.register("taxId")} placeholder="TAX-12345" />
          </FormField>
          <FormField label="Billing Address" error={form.formState.errors.billingAddress?.message} className="md:col-span-2">
            <Textarea {...form.register("billingAddress")} placeholder="123 Client Street" />
          </FormField>
          <FormField label="City" error={form.formState.errors.city?.message}>
            <Input {...form.register("city")} placeholder="New York" />
          </FormField>
          <FormField label="State" error={form.formState.errors.state?.message}>
            <Input {...form.register("state")} placeholder="NY" />
          </FormField>
          <FormField label="Postal Code" error={form.formState.errors.postalCode?.message}>
            <Input {...form.register("postalCode")} placeholder="10001" />
          </FormField>
          <FormField label="Country" error={form.formState.errors.country?.message}>
            <Input {...form.register("country")} placeholder="USA" />
          </FormField>
          <FormField label="Notes" error={form.formState.errors.notes?.message} className="md:col-span-2">
            <Textarea {...form.register("notes")} placeholder="Payment preferences or extra info." />
          </FormField>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : <div />}
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : mode === "create" ? "Save Client" : "Update Client"}
        </Button>
      </div>
    </form>
  );
}
