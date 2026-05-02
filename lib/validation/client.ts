import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  billingAddress: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().optional().or(z.literal("")),
  taxId: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal(""))
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const clientDefaults: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  billingAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  taxId: "",
  notes: ""
};
