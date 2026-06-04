import "server-only";

type DataversePrimitive = string | number | boolean | null;
export type DataverseRecord = Record<string, DataversePrimitive | DataversePrimitive[] | Record<string, unknown> | undefined>;

const API_VERSION = "v9.2";

export function isDataverseConfigured(): boolean {
  return !!(
    process.env.TENANT_ID &&
    process.env.CLIENT_ID &&
    process.env.CLIENT_SECRET &&
    process.env.DATAVERSE_URL
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getDataverseBaseUrl(): string {
  return `${requireEnv("DATAVERSE_URL").replace(/\/$/, "")}/api/data/${API_VERSION}`;
}

async function getAccessToken(): Promise<string> {
  const tenantId = requireEnv("TENANT_ID");
  const clientId = requireEnv("CLIENT_ID");
  const clientSecret = requireEnv("CLIENT_SECRET");
  const dataverseUrl = requireEnv("DATAVERSE_URL").replace(/\/$/, "");

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: `${dataverseUrl}/.default`,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Entra ID access token: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

async function dataverseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const baseUrl = getDataverseBaseUrl();
  const response = await fetch(`${baseUrl}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dataverse request failed (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function normalizeQuery(odataQuery?: string): string {
  if (!odataQuery) {
    return "";
  }

  return odataQuery.startsWith("?") ? odataQuery : `?${odataQuery}`;
}

function validateTableName(table: string): string {
  if (!/^[a-z0-9_]+$/.test(table)) {
    throw new Error("Invalid Dataverse table logical name.");
  }

  return table;
}

export async function getRecords<T extends DataverseRecord>(
  table: string,
  odataQuery?: string
): Promise<T[]> {
  const logicalName = validateTableName(table);
  const query = normalizeQuery(odataQuery);
  const data = await dataverseFetch<{ value: T[] }>(`${logicalName}${query}`);
  return data.value;
}

export async function getRecord<T extends DataverseRecord>(
  table: string,
  id: string
): Promise<T | null> {
  const logicalName = validateTableName(table);

  try {
    return await dataverseFetch<T>(`${logicalName}(${id})`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) {
      return null;
    }

    throw error;
  }
}

export async function createRecord<TBody extends DataverseRecord>(
  table: string,
  body: TBody
): Promise<{ id: string | null }> {
  const logicalName = validateTableName(table);
  const token = await getAccessToken();
  const baseUrl = getDataverseBaseUrl();

  const response = await fetch(`${baseUrl}/${logicalName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dataverse create failed (${response.status}): ${errorText}`);
  }

  const entityIdHeader =
    response.headers.get("OData-EntityId") ?? response.headers.get("odata-entityid");

  const id = entityIdHeader?.match(/\(([0-9a-fA-F-]{36})\)/)?.[1] ?? null;

  return { id };
}

export async function updateRecord<TBody extends DataverseRecord>(
  table: string,
  id: string,
  body: TBody
): Promise<void> {
  const logicalName = validateTableName(table);

  await dataverseFetch<void>(`${logicalName}(${id})`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const logicalName = validateTableName(table);
  await dataverseFetch<void>(`${logicalName}(${id})`, { method: "DELETE" });
}
