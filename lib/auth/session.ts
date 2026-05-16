import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { queryFirst } from "@/lib/d1/client";
import type { ProfileRow } from "@/types/profile";

const SESSION_COOKIE_NAME = "inv_creator_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionUserRow = ProfileRow & {
  password_hash: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

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
  return bytesToBase64(new Uint8Array(digest));
}

async function signSession(userId: string, expiresAt: number, passwordHash: string) {
  return hashSessionToken(`${userId}.${expiresAt}.${passwordHash}`);
}

function encodeSessionValue(userId: string, expiresAt: number, signature: string) {
  return bytesToBase64Url(new TextEncoder().encode(`${userId}.${expiresAt}.${signature}`));
}

function decodeSessionValue(value: string) {
  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(value));
    const [userId, expiresAtValue, signature] = decoded.split(".");

    if (!userId || !expiresAtValue || !signature) {
      return null;
    }

    const expiresAt = Number(expiresAtValue);

    if (!Number.isFinite(expiresAt)) {
      return null;
    }

    return { userId, expiresAt, signature };
  } catch {
    return null;
  }
}

function constantTimeEqualStrings(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }

  return diff === 0;
}

export async function createSession(userId: string, passwordHash: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const signature = await signSession(userId, expiresAt, passwordHash);
  const token = encodeSessionValue(userId, expiresAt, signature);

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

  const parsedSession = decodeSessionValue(sessionToken);

  if (!parsedSession || parsedSession.expiresAt <= Date.now()) {
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0
    });
    return null;
  }

  let row: Record<string, unknown> | null = null;

  try {
    row = await queryFirst<Record<string, unknown>>(
      `SELECT
         id,
         email,
         full_name,
         role,
         password_hash,
         disabled_at,
         created_at,
         updated_at
       FROM app_users
       WHERE id = ?
       LIMIT 1`,
      [parsedSession.userId]
    );
  } catch (error) {
    console.error("Failed to load current session user.", error);
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0
    });
    return null;
  }

  if (!row) {
    return null;
  }

  const passwordHash = String(row.password_hash ?? "");
  const expectedSignature = await signSession(parsedSession.userId, parsedSession.expiresAt, passwordHash);

  if (!constantTimeEqualStrings(parsedSession.signature, expectedSignature)) {
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0
    });
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
