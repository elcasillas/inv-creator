import Image from "next/image";
import { redirect } from "next/navigation";
import { login } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUserWithPassword } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const currentUser = await getCurrentUserWithPassword();

  if (currentUser && !currentUser.disabled_at) {
    redirect("/");
  }

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
            <Button formAction={login} variant="primary">
              Log in
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
