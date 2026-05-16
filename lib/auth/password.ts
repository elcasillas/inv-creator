const PASSWORD_HASH_PREFIX = "pbkdf2_sha256";
const PASSWORD_ITERATIONS = 310000;
const PASSWORD_KEY_LENGTH = 32;

function encodeBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function decodeBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function textToBytes(value: string) {
  return new TextEncoder().encode(value);
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
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
