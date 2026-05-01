import Link from "next/link";
import type { Route } from "next";

const navItems = [
  { href: "/", label: "Invoices" },
  { href: "/companies", label: "Companies" }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
          Invoice Creator
        </Link>
        <nav className="flex items-center gap-6 text-sm text-slate-600">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
