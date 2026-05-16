const DEFAULT_ACCOUNT_ID = "54e5cb8c2066084f27e65ea99836e6a0";
const DEFAULT_DATABASE_ID = "6e483d82-680a-4e56-959c-abfcd0ab2bd1";

export function hasD1HttpEnv() {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN);
}

export async function hasD1Access() {
  if (hasD1HttpEnv()) {
    return true;
  }

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = getCloudflareContext();
    const env = context.env as Record<string, unknown> | undefined;
    return Boolean(env?.DB);
  } catch {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const context = await getCloudflareContext({ async: true });
      const env = context.env as Record<string, unknown> | undefined;
      return Boolean(env?.DB);
    } catch {
      return false;
    }
  }
}

export function getD1Env() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? DEFAULT_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID ?? DEFAULT_DATABASE_ID;

  if (!apiToken) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN. Set it to query the configured Cloudflare D1 database.");
  }

  return { apiToken, accountId, databaseId };
}
