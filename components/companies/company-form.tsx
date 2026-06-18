"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCompanyAction, updateCompanyAction } from "@/app/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  COMPANY_LOGO_ALLOWED_EXTENSIONS,
  COMPANY_LOGO_ALLOWED_MIME_TYPES,
  COMPANY_LOGO_MAX_FILE_SIZE_BYTES,
  getCompanyLogoSrc
} from "@/lib/utils/company-logo";
import { companyDefaults, companySchema, type CompanyFormValues } from "@/lib/validation/company";

type LogoUploadStatus = "idle" | "uploading" | "complete" | "failed";

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
  const [logoUploadStatus, setLogoUploadStatus] = useState<LogoUploadStatus>("idle");
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(
    getCompanyLogoSrc(initialValues?.logoUrl) ?? initialValues?.logoUrl ?? ""
  );
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [selectedLogoObjectUrl, setSelectedLogoObjectUrl] = useState<string | null>(null);
  const [logoPreviewLoadError, setLogoPreviewLoadError] = useState<string | null>(null);
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: initialValues ?? companyDefaults
  });

  useEffect(() => {
    if (selectedLogoObjectUrl) {
      URL.revokeObjectURL(selectedLogoObjectUrl);
      setSelectedLogoObjectUrl(null);
    }
    setLogoPreviewUrl(getCompanyLogoSrc(initialValues?.logoUrl) ?? initialValues?.logoUrl ?? "");
    setLogoFileName(null);
    setLogoUploadStatus("idle");
    setLogoUploadError(null);
    setLogoPreviewLoadError(null);
  }, [initialValues?.logoUrl]);

  useEffect(() => {
    return () => {
      if (selectedLogoObjectUrl) {
        URL.revokeObjectURL(selectedLogoObjectUrl);
      }
    };
  }, [selectedLogoObjectUrl]);

  async function uploadLogoFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    if (mode === "edit" && companyId) {
      formData.append("companyId", companyId);
    }

    const response = await fetch("/api/company-logo/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      let message = "Upload failed.";

      try {
        const body = (await response.json()) as { message?: string };
        message = body.message ?? message;
      } catch {
        message = await response.text();
      }

      throw new Error(message);
    }

    return (await response.json()) as { logoUrl: string };
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLogoUploadError(null);
    setLogoPreviewLoadError(null);
    setLogoUploadStatus("idle");

    const normalizedType = file.type.toLowerCase();
    const hasAllowedType =
      COMPANY_LOGO_ALLOWED_MIME_TYPES.includes(normalizedType as (typeof COMPANY_LOGO_ALLOWED_MIME_TYPES)[number]) ||
      COMPANY_LOGO_ALLOWED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));

    if (!hasAllowedType) {
      setLogoUploadStatus("failed");
      setLogoUploadError("Use PNG, JPG, WEBP, or SVG files.");
      input.value = "";
      return;
    }

    if (file.size > COMPANY_LOGO_MAX_FILE_SIZE_BYTES) {
      setLogoUploadStatus("failed");
      setLogoUploadError("Company logos must be 5 MB or smaller.");
      input.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedLogoObjectUrl(objectUrl);
    setLogoPreviewUrl(objectUrl);
    setLogoUploadStatus("uploading");

    try {
      const result = await uploadLogoFile(file);
      setLogoFileName(file.name);
      form.setValue("logoUrl", result.logoUrl, { shouldDirty: true, shouldValidate: true });
      setLogoUploadStatus("complete");
    } catch (error) {
      setLogoUploadStatus("failed");
      setLogoUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      input.value = "";
    }
  }

  function handleLogoPreviewError() {
    if (logoPreviewUrl && selectedLogoObjectUrl) {
      setLogoPreviewLoadError("The uploaded file could not be rendered in the browser preview.");
      return;
    }

    if (logoPreviewUrl) {
      setLogoPreviewLoadError("The saved company logo URL could not be loaded.");
    }
  }

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
          <FormField
            label="Company Logo"
            error={logoUploadError ?? form.formState.errors.logoUrl?.message}
            className="md:col-span-2"
          >
            <div className="space-y-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">
                      Upload a logo image for this company. PNG, JPG, WEBP, or SVG preferred.
                    </p>
                    <p className="text-xs text-slate-500">Max size: 5 MB.</p>
                  </div>
                  <Input
                    type="file"
                    accept={`${COMPANY_LOGO_ALLOWED_EXTENSIONS.join(",")},${COMPANY_LOGO_ALLOWED_MIME_TYPES.join(",")}`}
                    onChange={handleLogoChange}
                    disabled={logoUploadStatus === "uploading" || isPending}
                    className="max-w-md"
                  />
                  <div className="space-y-1 text-xs text-slate-500">
                    {logoUploadStatus === "uploading" ? <p>Uploading...</p> : null}
                    {logoUploadStatus === "complete" ? <p>Upload complete.</p> : null}
                    {logoUploadStatus === "failed" && !logoUploadError ? <p>Upload failed.</p> : null}
                    {logoFileName ? <p>Last uploaded: {logoFileName}</p> : null}
                  </div>
                </div>

                <div className="flex min-h-24 w-full max-w-40 items-center justify-center rounded-xl border border-slate-200 bg-white p-3 sm:w-40">
                  {logoPreviewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={logoPreviewUrl}
                        alt="Company logo preview"
                        className="max-h-16 w-auto object-contain"
                        onError={handleLogoPreviewError}
                      />
                      {logoPreviewLoadError ? (
                        <p className="text-center text-[11px] leading-4 text-rose-600">
                          {logoPreviewLoadError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400">No logo uploaded yet.</p>
                  )}
                </div>
              </div>
            </div>
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
        <Button type="submit" variant="primary" disabled={isPending || logoUploadStatus === "uploading"}>
          {isPending ? "Saving..." : mode === "create" ? "Save Company" : "Update Company"}
        </Button>
      </div>
    </form>
  );
}
