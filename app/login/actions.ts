"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteCurrentSession } from "@/lib/auth/session";
import { queryFirst } from "@/lib/d1/client";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?message=Email and password are required.");
  }

  let user: Record<string, unknown> | null = null;

  try {
    user = await queryFirst<Record<string, unknown>>("SELECT * FROM app_users WHERE lower(email) = ? LIMIT 1", [
      email
    ]);
  } catch (error) {
    console.error("Login user lookup failed.", error);
    redirect("/login?message=Unable to load user account.");
  }

  if (!user || user.disabled_at) {
    redirect("/login?message=Invalid email or password.");
  }

  let valid = false;

  try {
    valid = await verifyPassword(password, String(user.password_hash ?? ""));
  } catch (error) {
    console.error("Login password verification failed.", error);
    const detail =
      error instanceof Error && error.message ? error.message : typeof error === "string" ? error : "unknown error";
    redirect(`/login?message=${encodeURIComponent(`Unable to verify password: ${detail}`)}`);
  }

  if (!valid) {
    redirect("/login?message=Invalid email or password.");
  }

  try {
    await createSession(String(user.id), String(user.password_hash ?? ""));
  } catch (error) {
    console.error("Login session creation failed.", error);
    redirect("/login?message=Unable to start session.");
  }

  redirect("/");
}

export async function logout() {
  await deleteCurrentSession();
  redirect("/login");
}
