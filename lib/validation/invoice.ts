import { z } from "zod";

const statusEnum = z.enum(["Draft", "Sent", "Paid", "Overdue"]);

const itemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  lineTotal: z.coerce.number().min(0)
});

export const invoiceSchema = z.object({
  companyId: z.string().uuid("Select a company"),
  clientId: z.string().uuid().optional().or(z.literal("")),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().optional().or(z.literal("")),
  status: statusEnum,
  clientName: z.string().trim().min(1, "Client name is required"),
  clientEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  clientAddress: z.string().trim().optional().or(z.literal("")),
  companyName: z.string().trim().optional().or(z.literal("")),
  companyEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  companyAddress: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  taxRate: z.coerce.number().min(0, "Tax rate cannot be negative"),
  subtotal: z.coerce.number().min(0),
  taxAmount: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
  items: z.array(itemSchema).min(1, "Add at least one line item")
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const invoiceDefaults: InvoiceFormValues = {
  companyId: "",
  clientId: "",
  invoiceNumber: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  status: "Draft",
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  companyName: "",
  companyEmail: "",
  companyAddress: "",
  notes: "",
  taxRate: 0,
  subtotal: 0,
  taxAmount: 0,
  total: 0,
  items: [
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    }
  ]
};
