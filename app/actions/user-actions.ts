"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminProfile } from "@/lib/supabase/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/profile";

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
  const { user, isAdmin } = await requireAdminProfile();

  if (!user || !isAdmin) {
    return { user: null, error: "Only admin users can manage accounts." };
  }

  return { user, error: null };
}

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function getRole(formData: FormData): UserRole {
  return getString(formData, "role") === "admin" ? "admin" : "user";
}

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  const admin = await assertAdmin();

  if (admin.error) {
    return { success: false, message: admin.error };
  }

  const parsed = createUserSchema.safeParse({
    email: getString(formData, "email"),
    password: String(formData.get("password") ?? ""),
    fullName: getString(formData, "fullName"),
    role: getRole(formData)
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Check the user details." };
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.fullName,
      role: parsed.data.role
    }
  });

  if (error || !data.user) {
    return { success: false, message: error?.message ?? "Failed to create user." };
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    email: parsed.data.email,
    full_name: parsed.data.fullName,
    role: parsed.data.role,
    disabled_at: null
  });

  if (profileError) {
    return { success: false, message: profileError.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User created." };
}

export async function updateUserAction(userId: string, formData: FormData): Promise<UserActionResult> {
  const admin = await assertAdmin();

  if (admin.error) {
    return { success: false, message: admin.error };
  }

  const parsed = updateUserSchema.safeParse({
    fullName: getString(formData, "fullName"),
    role: getRole(formData)
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Check the user details." };
  }

  if (admin.user?.id === userId && parsed.data.role !== "admin") {
    return { success: false, message: "You cannot remove your own admin role." };
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: parsed.data.fullName,
      role: parsed.data.role
    }
  });

  if (authError) {
    return { success: false, message: authError.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      role: parsed.data.role
    })
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User updated." };
}

export async function setUserDisabledAction(
  userId: string,
  disabled: boolean
): Promise<UserActionResult> {
  const admin = await assertAdmin();

  if (admin.error) {
    return { success: false, message: admin.error };
  }

  if (admin.user?.id === userId) {
    return { success: false, message: "You cannot disable your own account." };
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: disabled ? "876000h" : "none"
  });

  if (authError) {
    return { success: false, message: authError.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ disabled_at: disabled ? new Date().toISOString() : null })
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: disabled ? "User disabled." : "User enabled." };
}

export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  const admin = await assertAdmin();

  if (admin.error) {
    return { success: false, message: admin.error };
  }

  if (admin.user?.id === userId) {
    return { success: false, message: "You cannot delete your own account." };
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User deleted." };
}
