import Image from "next/image";
import { Card } from "@/components/ui/card";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Image
              src="/invoice-creator-logo.svg"
              alt="Invoice Creator logo"
              width={96}
              height={96}
              className="h-24 w-24"
              priority
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
            <p className="text-sm text-slate-500">Sign in with the account provided by your admin.</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Supabase authentication is no longer part of this app. Invoice, company, and client data are now loaded
              from the configured Cloudflare D1 database.
            </p>
            <p className="text-sm text-slate-600">
              Set `CLOUDFLARE_API_TOKEN` in `.env.local` to enable database access.
            </p>
            {params?.message ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {params.message}
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
