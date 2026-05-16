"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteCurrentSession } from "@/lib/auth/session";
import { queryFirst } from "@/lib/d1/client";

export async function login(formData: FormData) {
  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirect("/login?message=Email and password are required.");
    }

    const user = await queryFirst<Record<string, unknown>>(
      "SELECT * FROM app_users WHERE lower(email) = ? LIMIT 1",
      [email]
    );

    if (!user || user.disabled_at) {
      redirect("/login?message=Invalid email or password.");
    }

    const valid = await verifyPassword(password, String(user.password_hash ?? ""));

    if (!valid) {
      redirect("/login?message=Invalid email or password.");
    }

    await createSession(String(user.id));
    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Login failed unexpectedly.", error);
    redirect("/login?message=Unable to sign in right now.");
  }
}

export async function logout() {
  await deleteCurrentSession();
  redirect("/login");
}
