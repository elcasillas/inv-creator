"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function login(formData: FormData) {
  const email = getField(formData, "email");
  const password = getField(formData, "password");

  if (!email || !password) {
    redirect("/login?message=Email and password are required.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?message=Invalid email or password.");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
