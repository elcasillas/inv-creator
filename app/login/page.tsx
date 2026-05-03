import Link from "next/link";
import { login } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            Back to app
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <p className="text-sm text-slate-500">Sign in with the account provided by your admin.</p>
        </div>

        <Card className="p-6">
          <form className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <Input name="email" type="email" required placeholder="you@example.com" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <Input name="password" type="password" required placeholder="••••••••" />
            </label>
            {params?.message ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {params.message}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button formAction={login} variant="primary">
                Log in
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
