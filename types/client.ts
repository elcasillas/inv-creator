export interface ClientRow {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
