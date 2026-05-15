import { getD1Env } from "@/lib/d1/env";

type CloudflareError = {
  message?: string;
};

type D1QueryResult<T> = {
  success?: boolean;
  results?: T[];
  meta?: {
    changes?: number;
    last_row_id?: number;
  };
  error?: string;
};

type D1Envelope<T> = {
  success?: boolean;
  errors?: CloudflareError[];
  result?: D1QueryResult<T>[] | D1QueryResult<T>;
};

function getErrorMessage(payload: D1Envelope<unknown>, fallback: string) {
  const topLevel = payload.errors?.map((error) => error.message).filter(Boolean).join(", ");
  if (topLevel) {
    return topLevel;
  }

  const firstResult = Array.isArray(payload.result) ? payload.result[0] : payload.result;
  return firstResult?.error || fallback;
}

async function postToD1<T>(body: object) {
  const { accountId, apiToken, databaseId } = getD1Env();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    }
  );

  const payload = (await response.json()) as D1Envelope<T>;

  if (!response.ok || !payload.success) {
    throw new Error(getErrorMessage(payload, "Cloudflare D1 request failed."));
  }

  return payload;
}

export async function queryRows<T>(sql: string, params: unknown[] = []) {
  const payload = await postToD1<T>({ sql, params });
  const result = Array.isArray(payload.result) ? payload.result[0] : payload.result;
  return result?.results ?? [];
}

export async function queryFirst<T>(sql: string, params: unknown[] = []) {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function executeStatement(sql: string, params: unknown[] = []) {
  const payload = await postToD1<never>({ sql, params });
  const result = Array.isArray(payload.result) ? payload.result[0] : payload.result;
  return {
    changes: Number(result?.meta?.changes ?? 0),
    lastRowId: result?.meta?.last_row_id ?? null
  };
}
