import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { logout } from "@/app/login/actions";
import { getCurrentProfile } from "@/lib/supabase/auth";

const navItems = [
  { href: "/", label: "Invoices" },
  { href: "/clients", label: "Clients" },
  { href: "/companies", label: "Companies" }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export async function TopNav() {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    return null;
  }

  const visibleNavItems =
    profile?.role === "admin" && !profile.disabled_at
      ? [...navItems, { href: "/admin/users", label: "Admin Users" } as const]
      : navItems;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 text-base font-semibold tracking-tight text-slate-950 sm:text-lg"
        >
          <Image
            src="/invoice-creator-logo.svg"
            alt="Invoice Creator logo"
            width={36}
            height={36}
            className="h-9 w-9"
            priority
          />
          <span>Invoice Creator</span>
        </Link>
        <nav className="flex items-center gap-4 text-xs text-slate-600 sm:gap-6 sm:text-sm">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-slate-950">
              {item.label}
            </Link>
          ))}
          <form action={logout}>
            <button className="whitespace-nowrap hover:text-slate-950" type="submit">
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
