"use server";

import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  void formData;
  redirect("/login?message=Supabase Auth has been removed. This app now uses Cloudflare D1 for data only.");
}

export async function logout() {
  redirect("/");
}
