"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { createInvoiceAction, updateInvoiceAction } from "@/app/actions/invoice-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/utils/invoice";
import {
  invoiceDefaults,
  invoiceSchema,
  type InvoiceFormValues
} from "@/lib/validation/invoice";

interface InvoiceFormProps {
  mode: "create" | "edit";
  invoiceId?: string;
  initialValues?: InvoiceFormValues;
}

export function InvoiceForm({ mode, invoiceId, initialValues }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialValues ?? invoiceDefaults
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items"
  });
  const watchedTaxRate = useWatch({
    control: form.control,
    name: "taxRate"
  });

  const totals = useMemo(
    () =>
      calculateInvoiceTotals({
        items:
          watchedItems?.map((item) => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0
          })) ?? [],
        taxRate: Number(watchedTaxRate) || 0
      }),
    [watchedItems, watchedTaxRate]
  );

  useEffect(() => {
    form.setValue("subtotal", totals.subtotal);
    form.setValue("taxAmount", totals.taxAmount);
    form.setValue("total", totals.total);
  }, [form, totals]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      setSubmitError(null);
      setSubmitSuccess(null);

      const result =
        mode === "edit" && invoiceId
          ? await updateInvoiceAction(invoiceId, values)
          : await createInvoiceAction(values);

      if (!result.success) {
        setSubmitError(result.message);
        return;
      }

      setSubmitSuccess(mode === "create" ? "Invoice saved. Redirecting..." : "Invoice updated. Redirecting...");
      router.push(
        mode === "create"
          ? `/invoices/${result.invoiceId}?created=1`
          : `/invoices/${result.invoiceId}?updated=1`
      );
      router.refresh();
    });
  });

  return (
    <form id="invoice-form" onSubmit={onSubmit} className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {mode === "create" ? "Ready to save this invoice?" : "Ready to update this invoice?"}
            </p>
            <p className="text-sm text-slate-500">
              Required fields are validated before anything is written to Supabase.
            </p>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-slate-900 text-white hover:bg-slate-800 sm:min-w-40"
          >
            {isPending ? "Saving..." : mode === "create" ? "Save Invoice" : "Update Invoice"}
          </Button>
        </div>
        {submitSuccess ? (
          <p className="mt-3 text-sm text-emerald-700">{submitSuccess}</p>
        ) : null}
        {submitError ? <p className="mt-3 text-sm text-rose-600">{submitError}</p> : null}
      </Card>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="Invoice Number" error={form.formState.errors.invoiceNumber?.message}>
            <Input {...form.register("invoiceNumber")} placeholder="INV-1001" />
          </FormField>
          <FormField label="Invoice Date" error={form.formState.errors.invoiceDate?.message}>
            <Input type="date" {...form.register("invoiceDate")} />
          </FormField>
          <FormField label="Due Date" error={form.formState.errors.dueDate?.message}>
            <Input type="date" {...form.register("dueDate")} />
          </FormField>
          <FormField label="Status" error={form.formState.errors.status?.message}>
            <Select {...form.register("status")}>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </Select>
          </FormField>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Client</h2>
          <div className="mt-4 space-y-4">
            <FormField label="Client Name" error={form.formState.errors.clientName?.message}>
              <Input {...form.register("clientName")} placeholder="Acme Inc." />
            </FormField>
            <FormField label="Client Email" error={form.formState.errors.clientEmail?.message}>
              <Input {...form.register("clientEmail")} type="email" placeholder="billing@client.com" />
            </FormField>
            <FormField label="Client Address" error={form.formState.errors.clientAddress?.message}>
              <Textarea {...form.register("clientAddress")} placeholder="123 Main Street" />
            </FormField>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Company</h2>
          <div className="mt-4 space-y-4">
            <FormField label="Company Name" error={form.formState.errors.companyName?.message}>
              <Input {...form.register("companyName")} placeholder="My Company LLC" />
            </FormField>
            <FormField label="Company Email" error={form.formState.errors.companyEmail?.message}>
              <Input {...form.register("companyEmail")} type="email" placeholder="hello@company.com" />
            </FormField>
            <FormField label="Company Address" error={form.formState.errors.companyAddress?.message}>
              <Textarea {...form.register("companyAddress")} placeholder="456 Market Street" />
            </FormField>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Line Items</h2>
            <p className="text-sm text-slate-500">Add each service or product on the invoice.</p>
          </div>
          <Button
            type="button"
            onClick={() =>
              append({
                description: "",
                quantity: 1,
                unitPrice: 0,
                lineTotal: 0
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {fields.map((field, index) => {
            const quantity = Number(watchedItems?.[index]?.quantity) || 0;
            const unitPrice = Number(watchedItems?.[index]?.unitPrice) || 0;
            const lineTotal = calculateLineTotal(quantity, unitPrice);

            return (
              <div
                key={field.id}
                className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1.8fr)_120px_140px_120px_auto]"
              >
                <FormField
                  label="Description"
                  error={form.formState.errors.items?.[index]?.description?.message}
                >
                  <Input {...form.register(`items.${index}.description`)} placeholder="Website design" />
                </FormField>
                <FormField label="Qty" error={form.formState.errors.items?.[index]?.quantity?.message}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </FormField>
                <FormField
                  label="Unit Price"
                  error={form.formState.errors.items?.[index]?.unitPrice?.message}
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                </FormField>
                <FormField label="Line Total">
                  <input
                    type="hidden"
                    value={lineTotal}
                    {...form.register(`items.${index}.lineTotal`, { valueAsNumber: true })}
                  />
                  <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600">
                    {lineTotal.toFixed(2)}
                  </div>
                </FormField>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="w-full justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {form.formState.errors.items?.message ? (
          <p className="mt-3 text-sm text-rose-600">{form.formState.errors.items.message}</p>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6">
          <FormField label="Notes" error={form.formState.errors.notes?.message}>
            <Textarea
              {...form.register("notes")}
              placeholder="Payment terms, thank-you message, or extra details."
            />
          </FormField>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <FormField label="Tax Rate (%)" error={form.formState.errors.taxRate?.message}>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...form.register("taxRate", { valueAsNumber: true })}
              />
            </FormField>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-900">{totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
                <span className="font-semibold text-slate-950">Total</span>
                <span className="font-semibold text-slate-950">{totals.total.toFixed(2)}</span>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
            >
              {isPending ? "Saving..." : mode === "create" ? "Save Invoice" : "Update Invoice"}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
