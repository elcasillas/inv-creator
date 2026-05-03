import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/profile";

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export function normalizeProfile(row: Record<string, unknown>): ProfileRow {
  return {
    id: String(row.id ?? ""),
    email: (row.email as string | null | undefined) ?? null,
    full_name: (row.full_name as string | null | undefined) ?? null,
    role: row.role === "admin" ? "admin" : "user",
    disabled_at: (row.disabled_at as string | null | undefined) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? "")
  };
}

export async function getCurrentProfile() {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { supabase, user, profile: null };
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    supabase,
    user,
    profile: data ? normalizeProfile(data as Record<string, unknown>) : null
  };
}

export async function requireAdminProfile() {
  const { supabase, user, profile } = await getCurrentProfile();

  if (!user || profile?.role !== "admin" || profile.disabled_at) {
    return { supabase, user, profile: null, isAdmin: false };
  }

  return { supabase, user, profile, isAdmin: true };
}
