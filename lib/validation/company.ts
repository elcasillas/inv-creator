import { z } from "zod";

function isValidCompanyLogoValue(value: string) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/api/company-logo/object/")) {
    return true;
  }

  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  invoiceStartNumber: z.coerce
    .number({ invalid_type_error: "Invoice start number is required" })
    .int("Invoice start number must be a whole number")
    .min(0, "Invoice start number cannot be negative"),
  address: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  taxId: z.string().trim().optional().or(z.literal("")),
  logoUrl: z
    .string()
    .trim()
    .refine(isValidCompanyLogoValue, "Enter a valid URL")
    .optional()
    .or(z.literal(""))
});

export type CompanyFormValues = z.infer<typeof companySchema>;

export const companyDefaults: CompanyFormValues = {
  name: "",
  invoiceStartNumber: 1000,
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  email: "",
  phone: "",
  website: "",
  taxId: "",
  logoUrl: ""
};
