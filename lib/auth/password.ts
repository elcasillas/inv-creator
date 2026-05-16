const PASSWORD_HASH_PREFIX = "pbkdf2_sha256";
const PASSWORD_ITERATIONS = 310000;
const PASSWORD_KEY_LENGTH = 32;
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array) {
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? BASE64_ALPHABET[chunk & 63] : "=";
  }

  return output;
}

function base64ToBytes(value: string) {
  const sanitized = value.replace(/[^A-Za-z0-9+/=]/g, "");
  const padding = sanitized.endsWith("==") ? 2 : sanitized.endsWith("=") ? 1 : 0;
  const outputLength = (sanitized.length / 4) * 3 - padding;
  const bytes = new Uint8Array(outputLength);
  let byteIndex = 0;

  for (let index = 0; index < sanitized.length; index += 4) {
    const encoded0 = BASE64_ALPHABET.indexOf(sanitized[index] ?? "A");
    const encoded1 = BASE64_ALPHABET.indexOf(sanitized[index + 1] ?? "A");
    const encoded2 = sanitized[index + 2] === "=" ? 0 : BASE64_ALPHABET.indexOf(sanitized[index + 2] ?? "A");
    const encoded3 = sanitized[index + 3] === "=" ? 0 : BASE64_ALPHABET.indexOf(sanitized[index + 3] ?? "A");
    const chunk = (encoded0 << 18) | (encoded1 << 12) | (encoded2 << 6) | encoded3;

    if (byteIndex < outputLength) {
      bytes[byteIndex] = (chunk >> 16) & 255;
      byteIndex += 1;
    }

    if (byteIndex < outputLength) {
      bytes[byteIndex] = (chunk >> 8) & 255;
      byteIndex += 1;
    }

    if (byteIndex < outputLength) {
      bytes[byteIndex] = chunk & 255;
      byteIndex += 1;
    }
  }

  return bytes;
}

function encodeBase64(bytes: Uint8Array) {
  return bytesToBase64(bytes);
}

function decodeBase64(value: string) {
  return base64ToBytes(value);
}

function textToBytes(value: string) {
  return new TextEncoder().encode(value);
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", textToBytes(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations,
      hash: "SHA-256"
    },
    key,
    PASSWORD_KEY_LENGTH * 8
  );

  return new Uint8Array(bits);
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_ITERATIONS}$${encodeBase64(salt)}$${encodeBase64(hash)}`;
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

  const salt = decodeBase64(saltBase64);
  const expectedHash = decodeBase64(hashBase64);
  const actualHash = await derivePasswordHash(password, salt, iterations);

  return constantTimeEqual(expectedHash, actualHash);
}
