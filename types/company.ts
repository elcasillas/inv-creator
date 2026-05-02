export interface CompanyRow {
  id: string;
  name: string;
  invoice_start_number: number;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  tax_id: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}
