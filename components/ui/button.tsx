import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const buttonClasses =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(buttonClasses, className)} {...props} />;
}

export function ButtonLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={cn(buttonClasses, className)} {...props} />;
}
