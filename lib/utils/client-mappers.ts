import { ClientFormValues } from "@/lib/validation/client";
import { ClientRow } from "@/types/client";

export function mapClientToFormValues(client: ClientRow): ClientFormValues {
  return {
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    billingAddress: client.billing_address ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    postalCode: client.postal_code ?? "",
    country: client.country ?? "",
    taxId: client.tax_id ?? "",
    notes: client.notes ?? ""
  };
}
