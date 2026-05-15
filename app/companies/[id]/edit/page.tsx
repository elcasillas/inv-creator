import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyForm } from "@/components/companies/company-form";
import { getCompanyById } from "@/lib/d1/queries";
import { mapCompanyToFormValues } from "@/lib/utils/company-mappers";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const company = await getCompanyById(id);

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="space-y-2">
            <Link href="/companies" className="text-sm text-slate-500 hover:text-slate-900">
              Back to companies
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Edit Company</h1>
            <p className="text-sm text-slate-500">Update this saved sender profile.</p>
          </div>
          <CompanyForm mode="edit" companyId={id} initialValues={mapCompanyToFormValues(company)} />
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
