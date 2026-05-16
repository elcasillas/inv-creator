"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { requireAdminProfile } from "@/lib/auth/session";
import { executeStatement } from "@/lib/d1/client";

type UserActionResult = { success: true; message: string } | { success: false; message: string };

const userRoleSchema = z.enum(["admin", "user"]);

const createUserSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().trim().min(1, "Full name is required."),
  role: userRoleSchema
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  role: userRoleSchema
});

async function assertAdmin() {
  try {
    const admin = await requireAdminProfile();
    return { admin, error: null };
  } catch {
    return { admin: null, error: "Only admin users can manage accounts." };
  }
}

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function getRole(formData: FormData) {
  return getString(formData, "role") === "admin" ? "admin" : "user";
}

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  const { error } = await assertAdmin();

  if (error) {
    return { success: false, message: error };
  }

  const parsed = createUserSchema.safeParse({
    email: getString(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
    fullName: getString(formData, "fullName"),
    role: getRole(formData)
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Check the user details." };
  }

  try {
    const now = new Date().toISOString();
    await executeStatement(
      `INSERT INTO app_users (
        id, email, full_name, role, password_hash, disabled_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
      [
        crypto.randomUUID(),
        parsed.data.email,
        parsed.data.fullName,
        parsed.data.role,
        await hashPassword(parsed.data.password),
        now,
        now
      ]
    );
  } catch (actionError) {
    return {
      success: false,
      message:
        actionError instanceof Error && actionError.message.toLowerCase().includes("unique")
          ? "A user with that email already exists."
          : actionError instanceof Error
            ? actionError.message
            : "Failed to create user."
    };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User created." };
}

export async function updateUserAction(userId: string, formData: FormData): Promise<UserActionResult> {
  const { admin, error } = await assertAdmin();

  if (error) {
    return { success: false, message: error };
  }

  const parsed = updateUserSchema.safeParse({
    fullName: getString(formData, "fullName"),
    role: getRole(formData)
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Check the user details." };
  }

  if (admin?.id === userId && parsed.data.role !== "admin") {
    return { success: false, message: "You cannot remove your own admin role." };
  }

  await executeStatement(
    "UPDATE app_users SET full_name = ?, role = ?, updated_at = ? WHERE id = ?",
    [parsed.data.fullName, parsed.data.role, new Date().toISOString(), userId]
  );

  revalidatePath("/admin/users");
  return { success: true, message: "User updated." };
}

export async function setUserDisabledAction(
  userId: string,
  disabled: boolean
): Promise<UserActionResult> {
  const { admin, error } = await assertAdmin();

  if (error) {
    return { success: false, message: error };
  }

  if (admin?.id === userId) {
    return { success: false, message: "You cannot disable your own account." };
  }

  await executeStatement("UPDATE app_users SET disabled_at = ?, updated_at = ? WHERE id = ?", [
    disabled ? new Date().toISOString() : null,
    new Date().toISOString(),
    userId
  ]);

  revalidatePath("/admin/users");
  return { success: true, message: disabled ? "User disabled." : "User enabled." };
}

export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  const { admin, error } = await assertAdmin();

  if (error) {
    return { success: false, message: error };
  }

  if (admin?.id === userId) {
    return { success: false, message: "You cannot delete your own account." };
  }

  await executeStatement("DELETE FROM app_users WHERE id = ?", [userId]);
  revalidatePath("/admin/users");
  return { success: true, message: "User deleted." };
}
