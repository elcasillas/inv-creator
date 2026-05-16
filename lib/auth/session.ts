import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { executeStatement, queryFirst } from "@/lib/d1/client";
import type { ProfileRow } from "@/types/profile";

const SESSION_COOKIE_NAME = "inv_creator_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionUserRow = ProfileRow & {
  password_hash: string;
};

function toProfileRow(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    email: (row.email as string | null | undefined) ?? null,
    full_name: (row.full_name as string | null | undefined) ?? null,
    role: row.role === "admin" ? "admin" : "user",
    disabled_at: (row.disabled_at as string | null | undefined) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? "")
  } satisfies ProfileRow;
}

async function hashSessionToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Buffer.from(digest).toString("base64");
}

export async function createSession(userId: string) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(tokenBytes).toString("base64url");
  const tokenHash = await hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  await executeStatement(
    "INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    [crypto.randomUUID(), userId, tokenHash, expiresAt, now.toISOString()]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await executeStatement("DELETE FROM user_sessions WHERE token_hash = ?", [await hashSessionToken(sessionToken)]);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUserWithPassword() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const row = await queryFirst<Record<string, unknown>>(
    `SELECT
       app_users.id,
       app_users.email,
       app_users.full_name,
       app_users.role,
       app_users.password_hash,
       app_users.disabled_at,
       app_users.created_at,
       app_users.updated_at
     FROM user_sessions
     JOIN app_users ON app_users.id = user_sessions.user_id
     WHERE user_sessions.token_hash = ?
       AND user_sessions.expires_at > ?
     LIMIT 1`,
    [await hashSessionToken(sessionToken), new Date().toISOString()]
  );

  if (!row) {
    return null;
  }

  return {
    ...toProfileRow(row),
    password_hash: String(row.password_hash ?? "")
  } satisfies SessionUserRow;
}

export async function getCurrentProfile() {
  const user = await getCurrentUserWithPassword();
  return user ? toProfileRow(user as unknown as Record<string, unknown>) : null;
}

export async function requireCurrentProfile() {
  const profile = await getCurrentProfile();

  if (!profile || profile.disabled_at) {
    redirect("/login?message=Please sign in to continue.");
  }

  return profile;
}

export async function requireAdminProfile() {
  const profile = await requireCurrentProfile();

  if (profile.role !== "admin") {
    redirect("/");
  }

  return profile;
}
