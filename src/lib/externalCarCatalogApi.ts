export type ExternalCatalogItem = {
  externalId: string;
  name: string;
  slug: string;
  sortOrder: number;
  metadata?: Record<string, unknown>;
};

function getCatalogConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_VEHICLE_CATALOG_BASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_VEHICLE_CATALOG_API_KEY;
  const sourceName = process.env.NEXT_PUBLIC_VEHICLE_CATALOG_SOURCE || "external-cars-api";

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_VEHICLE_CATALOG_BASE_URL is not set");
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    sourceName,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeItem(raw: unknown, index: number): ExternalCatalogItem {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const externalId = String(
    record.externalId ?? record.id ?? record.uuid ?? record.code ?? record.slug ?? record.name ?? `item-${index}`,
  );
  const name = String(record.name ?? record.label ?? record.title ?? externalId);
  const slug = String(record.slug ?? slugify(name));
  const sortOrder = Number(record.sortOrder ?? record.order ?? index) || 0;

  const metadataSource =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : record;

  return {
    externalId,
    name,
    slug,
    sortOrder,
    metadata: metadataSource,
  };
}

async function requestCatalog(path: string, params: Record<string, string | undefined>) {
  const { baseUrl, apiKey } = getCatalogConfig();
  const url = new URL(`${baseUrl}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const headers = new Headers();
  if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`);

  const response = await fetch(url.toString(), { headers, cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : "Unable to load external vehicle catalog";
    throw new Error(message);
  }

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return items.map(normalizeItem);
}

export function getExternalCatalogSourceName() {
  return getCatalogConfig().sourceName;
}

export async function listExternalCarCategories(query?: string) {
  return requestCatalog("/categories", {
    q: query || undefined,
    search: query || undefined,
  });
}

export async function listExternalCarBrands(input: {
  query?: string;
  categoryExternalId?: string;
  categoryName?: string;
}) {
  return requestCatalog("/brands", {
    q: input.query || undefined,
    search: input.query || undefined,
    categoryId: input.categoryExternalId || undefined,
    categoryExternalId: input.categoryExternalId || undefined,
    categoryName: input.categoryName || undefined,
  });
}

export async function listExternalCarModels(input: {
  query?: string;
  categoryExternalId?: string;
  categoryName?: string;
  brandExternalId?: string;
  brandName?: string;
}) {
  return requestCatalog("/models", {
    q: input.query || undefined,
    search: input.query || undefined,
    categoryId: input.categoryExternalId || undefined,
    categoryExternalId: input.categoryExternalId || undefined,
    categoryName: input.categoryName || undefined,
    brandId: input.brandExternalId || undefined,
    brandExternalId: input.brandExternalId || undefined,
    brandName: input.brandName || undefined,
  });
}
