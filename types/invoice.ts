import { CompanyRow } from "@/types/company";
import { ClientRow } from "@/types/client";

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface InvoiceRow {
  id: string;
  company_id: string | null;
  client_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  company_name: string | null;
  company_email: string | null;
  company_address: string | null;
  notes: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface InvoiceWithItems extends InvoiceRow {
  company: CompanyRow | null;
  client: ClientRow | null;
  invoice_items: InvoiceItemRow[];
}
