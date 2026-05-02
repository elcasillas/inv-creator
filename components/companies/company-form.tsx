"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCompanyAction, updateCompanyAction } from "@/app/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { companyDefaults, companySchema, type CompanyFormValues } from "@/lib/validation/company";

export function CompanyForm({
  mode,
  companyId,
  initialValues
}: {
  mode: "create" | "edit";
  companyId?: string;
  initialValues?: CompanyFormValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: initialValues ?? companyDefaults
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setSubmitError(null);
      const result =
        mode === "edit" && companyId
          ? await updateCompanyAction(companyId, values)
          : await createCompanyAction(values);

      if (!result.success) {
        setSubmitError(result.message);
        return;
      }

      router.push("/companies");
      router.refresh();
    });
  });

  const invoiceStartNumberField = form.register("invoiceStartNumber", {
    valueAsNumber: true
  });

  function handleWholeNumberInput(event: React.FormEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value.replace(/\D/g, "");
    event.currentTarget.value = nextValue;
    invoiceStartNumberField.onChange(event);
  }

  function handleWholeNumberKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (
      ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Company Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Northwind Studio" />
          </FormField>
          <FormField
            label="Invoice Start Number"
            error={form.formState.errors.invoiceStartNumber?.message}
          >
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="1000"
              {...invoiceStartNumberField}
              onInput={handleWholeNumberInput}
              onKeyDown={handleWholeNumberKeyDown}
            />
          </FormField>
          <FormField label="Email" error={form.formState.errors.email?.message}>
            <Input {...form.register("email")} type="email" placeholder="hello@company.com" />
          </FormField>
          <FormField label="Phone" error={form.formState.errors.phone?.message}>
            <Input {...form.register("phone")} placeholder="+1 555 123 4567" />
          </FormField>
          <FormField label="Website" error={form.formState.errors.website?.message}>
            <Input {...form.register("website")} placeholder="https://example.com" />
          </FormField>
          <FormField label="Tax ID / VAT" error={form.formState.errors.taxId?.message}>
            <Input {...form.register("taxId")} placeholder="VAT-12345" />
          </FormField>
          <FormField label="Logo URL" error={form.formState.errors.logoUrl?.message}>
            <Input {...form.register("logoUrl")} placeholder="https://example.com/logo.png" />
          </FormField>
          <FormField label="Address" error={form.formState.errors.address?.message} className="md:col-span-2">
            <Input {...form.register("address")} placeholder="123 Main Street" />
          </FormField>
          <FormField label="City" error={form.formState.errors.city?.message}>
            <Input {...form.register("city")} placeholder="Toronto" />
          </FormField>
          <FormField label="State / Province" error={form.formState.errors.state?.message}>
            <Input {...form.register("state")} placeholder="Ontario" />
          </FormField>
          <FormField label="Postal / ZIP Code" error={form.formState.errors.postalCode?.message}>
            <Input {...form.register("postalCode")} placeholder="M5V 2T6" />
          </FormField>
          <FormField label="Country" error={form.formState.errors.country?.message}>
            <Input {...form.register("country")} placeholder="Canada" />
          </FormField>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : <div />}
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : mode === "create" ? "Save Company" : "Update Company"}
        </Button>
      </div>
    </form>
  );
}
