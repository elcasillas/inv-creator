import { createHash, createHmac } from "node:crypto";

const EMPTY_BODY_SHA256 = createHash("sha256").update("").digest("hex");
const AWS4_REQUEST = "aws4_request";
const R2_SERVICE = "s3";
const R2_REGION = "auto";

type R2S3Config = {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  bucketName: string;
  endpoint: string;
};

type R2ObjectResponse = {
  body: ArrayBuffer;
  contentType: string | null;
  cacheControl: string | null;
};

type R2AccessCheckResult = {
  ok: boolean;
  status: number | null;
  message: string | null;
};

function normalizeEnvValue(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

function sha256Hex(value: string | ArrayBuffer) {
  return createHash("sha256").update(typeof value === "string" ? value : Buffer.from(value)).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function encodePathSegment(segment: string) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildEncodedObjectKey(objectKey: string) {
  return objectKey
    .split("/")
    .filter(Boolean)
    .map(encodePathSegment)
    .join("/");
}

function getAmzDates(now = new Date()) {
  const isoString = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: isoString,
    shortDate: isoString.slice(0, 8)
  };
}

function getSigningKey(secretAccessKey: string, shortDate: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, shortDate);
  const kRegion = hmac(kDate, R2_REGION);
  const kService = hmac(kRegion, R2_SERVICE);
  return hmac(kService, AWS4_REQUEST);
}

function getR2S3Config(): R2S3Config | null {
  const accessKeyId = normalizeEnvValue(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID);
  const secretAccessKey = normalizeEnvValue(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY);
  const accountId = normalizeEnvValue(process.env.CLOUDFLARE_ACCOUNT_ID);
  const bucketName = normalizeEnvValue(process.env.CLOUDFLARE_R2_BUCKET_NAME) ?? "company-logos";

  if (!accessKeyId || !secretAccessKey || !accountId) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    accountId,
    bucketName,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`
  };
}

function createSignedRequest(
  config: R2S3Config,
  method: "GET" | "PUT" | "DELETE",
  objectKey: string,
  options?: {
    body?: ArrayBuffer;
    contentType?: string;
    query?: string;
  }
) {
  const encodedKey = buildEncodedObjectKey(objectKey);
  const canonicalUri = `/${config.bucketName}/${encodedKey}`;
  const canonicalQuery = options?.query ?? "";
  const url = `${config.endpoint}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ""}`;
  const { amzDate, shortDate } = getAmzDates();
  const payloadHash = options?.body ? sha256Hex(options.body) : EMPTY_BODY_SHA256;
  const headers = new Headers({
    host: `${config.accountId}.r2.cloudflarestorage.com`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  });

  if (options?.contentType) {
    headers.set("content-type", options.contentType);
  }

  const canonicalHeaders = Array.from(headers.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value.trim()}\n`)
    .join("");
  const signedHeaders = Array.from(headers.keys())
    .sort((left, right) => left.localeCompare(right))
    .join(";");
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${shortDate}/${R2_REGION}/${R2_SERVICE}/${AWS4_REQUEST}`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = getSigningKey(config.secretAccessKey, shortDate);
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  headers.set(
    "Authorization",
    [
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`
    ].join(", ")
  );

  return {
    url,
    headers
  };
}

function createSignedBucketRequest(
  config: R2S3Config,
  query = "list-type=2&max-keys=1"
) {
  const canonicalUri = `/${config.bucketName}`;
  const url = `${config.endpoint}${canonicalUri}?${query}`;
  const { amzDate, shortDate } = getAmzDates();
  const headers = new Headers({
    host: `${config.accountId}.r2.cloudflarestorage.com`,
    "x-amz-content-sha256": EMPTY_BODY_SHA256,
    "x-amz-date": amzDate
  });
  const canonicalHeaders = Array.from(headers.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value.trim()}\n`)
    .join("");
  const signedHeaders = Array.from(headers.keys())
    .sort((left, right) => left.localeCompare(right))
    .join(";");
  const canonicalRequest = [
    "GET",
    canonicalUri,
    query,
    canonicalHeaders,
    signedHeaders,
    EMPTY_BODY_SHA256
  ].join("\n");
  const credentialScope = `${shortDate}/${R2_REGION}/${R2_SERVICE}/${AWS4_REQUEST}`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = getSigningKey(config.secretAccessKey, shortDate);
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  headers.set(
    "Authorization",
    [
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`
    ].join(", ")
  );

  return { url, headers };
}

export function hasR2S3Env() {
  return Boolean(getR2S3Config());
}

export async function putObjectToR2(
  objectKey: string,
  body: ArrayBuffer,
  contentType: string
) {
  const config = getR2S3Config();

  if (!config) {
    throw new Error(
      "Missing CLOUDFLARE_R2_ACCESS_KEY_ID or CLOUDFLARE_R2_SECRET_ACCESS_KEY for direct R2 upload."
    );
  }

  const request = createSignedRequest(config, "PUT", objectKey, {
    body,
    contentType
  });
  const response = await fetch(request.url, {
    method: "PUT",
    headers: request.headers,
    body
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `R2 upload failed with status ${response.status}.${responseText ? ` ${responseText}` : ""}`
    );
  }
}

export async function getObjectFromR2(objectKey: string): Promise<R2ObjectResponse | null> {
  const config = getR2S3Config();

  if (!config) {
    return null;
  }

  const request = createSignedRequest(config, "GET", objectKey);
  const response = await fetch(request.url, {
    method: "GET",
    headers: request.headers,
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `R2 fetch failed with status ${response.status}.${responseText ? ` ${responseText}` : ""}`
    );
  }

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control")
  };
}

export async function verifyR2Access(): Promise<R2AccessCheckResult> {
  const config = getR2S3Config();

  if (!config) {
    return {
      ok: false,
      status: null,
      message: "Missing CLOUDFLARE_R2_ACCESS_KEY_ID or CLOUDFLARE_R2_SECRET_ACCESS_KEY."
    };
  }

  const request = createSignedBucketRequest(config);
  const response = await fetch(request.url, {
    method: "GET",
    headers: request.headers,
    cache: "no-store"
  });

  if (response.ok) {
    return {
      ok: true,
      status: response.status,
      message: null
    };
  }

  const responseText = await response.text();
  return {
    ok: false,
    status: response.status,
    message: responseText || "R2 access verification failed."
  };
}

export async function verifyR2WriteAccess(): Promise<R2AccessCheckResult> {
  const config = getR2S3Config();

  if (!config) {
    return {
      ok: false,
      status: null,
      message: "Missing CLOUDFLARE_R2_ACCESS_KEY_ID or CLOUDFLARE_R2_SECRET_ACCESS_KEY."
    };
  }

  const testObjectKey = `company-logos/healthcheck-${crypto.randomUUID()}.txt`;
  const testBody = new TextEncoder().encode("ok").buffer;
  const putRequest = createSignedRequest(config, "PUT", testObjectKey, {
    body: testBody,
    contentType: "text/plain"
  });
  const putResponse = await fetch(putRequest.url, {
    method: "PUT",
    headers: putRequest.headers,
    body: testBody
  });

  if (!putResponse.ok) {
    const responseText = await putResponse.text();
    return {
      ok: false,
      status: putResponse.status,
      message: responseText || "R2 write verification failed."
    };
  }

  const deleteRequest = createSignedRequest(config, "DELETE", testObjectKey);
  const deleteResponse = await fetch(deleteRequest.url, {
    method: "DELETE",
    headers: deleteRequest.headers
  });

  if (!deleteResponse.ok) {
    const responseText = await deleteResponse.text();
    return {
      ok: false,
      status: deleteResponse.status,
      message: responseText || "R2 cleanup after write verification failed."
    };
  }

  return {
    ok: true,
    status: putResponse.status,
    message: null
  };
}
