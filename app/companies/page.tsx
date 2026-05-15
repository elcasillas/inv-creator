import { CompanyTable } from "@/components/companies/company-table";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCompanies } from "@/lib/d1/queries";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Companies</h1>
            <p className="mt-1 text-sm text-slate-500">
              Save company profiles and reuse them when creating invoices.
            </p>
          </div>
          <ButtonLink href="/companies/new" variant="primary">
            Add Company
          </ButtonLink>
        </div>
        <Card className="overflow-hidden">
          <CompanyTable companies={companies} />
        </Card>
      </div>
    </main>
  );
}
