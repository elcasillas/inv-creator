import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PASSWORD_HASH_PREFIX = "pbkdf2_sha256";
const PASSWORD_ITERATIONS = 100000;
const PASSWORD_KEY_LENGTH = 32;

function bytesToBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  return new Uint8Array(pbkdf2Sync(password, salt, iterations, PASSWORD_KEY_LENGTH, "sha256"));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [prefix, iterationValue, saltBase64, hashBase64] = storedHash.split("$");

  if (prefix !== PASSWORD_HASH_PREFIX || !iterationValue || !saltBase64 || !hashBase64) {
    return false;
  }

  const iterations = Number(iterationValue);

  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const salt = base64ToBytes(saltBase64);
  const expectedHash = Buffer.from(base64ToBytes(hashBase64));
  const actualHash = Buffer.from(derivePasswordHash(password, salt, iterations));

  if (expectedHash.length !== actualHash.length) {
    return false;
  }

  return timingSafeEqual(expectedHash, actualHash);
}
