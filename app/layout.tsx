import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";
import { requireCurrentProfile } from "@/lib/auth/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Creator",
  description: "A simple invoice creator built with Next.js and Cloudflare D1.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const showAppChrome = pathname !== "/login";

  if (showAppChrome) {
    await requireCurrentProfile();
  }

  return (
    <html lang="en">
      <body>
        {showAppChrome ? <TopNav /> : null}
        <main>{children}</main>
      </body>
    </html>
  );
}
