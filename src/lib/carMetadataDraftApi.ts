import { apiRequest } from "@/src/lib/api";

type MetadataRecord = Record<string, unknown>;
type DataSource = "server" | "local";

type DraftListResponse<T> = {
  items?: T[];
};

type RawCategory = {
  id: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  metadata?: MetadataRecord | null;
};

type RawBrand = {
  id: string;
  categoryId?: string | null;
  name: string;
  slug: string;
  externalId?: string | null;
  source?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  metadata?: MetadataRecord | null;
};

type RawModel = {
  id: string;
  categoryId?: string | null;
  brandId: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  metadata?: MetadataRecord | null;
  carsCount?: number;
};

type RawState = {
  categories: RawCategory[];
  brands: RawBrand[];
  models: RawModel[];
};

export type CarCategoryConfig = RawCategory & {
  brandsCount: number;
  modelsCount: number;
};

export type CarBrandConfig = RawBrand & {
  categoryName: string;
  modelsCount: number;
};

export type CarModelConfig = RawModel & {
  categoryName: string;
  brandName: string;
};

export type CarCategoryInput = {
  id?: string;
  name: string;
  slug?: string;
  externalId?: string;
  source?: string;
  isActive: boolean;
  sortOrder?: number;
  metadata?: MetadataRecord;
};

export type CarBrandInput = {
  id?: string;
  categoryId?: string;
  name: string;
  slug?: string;
  externalId?: string;
  source?: string;
  isActive: boolean;
  sortOrder?: number;
  metadata?: MetadataRecord;
};

export type CarModelInput = {
  id?: string;
  categoryId?: string;
  brandId: string;
  name: string;
  slug?: string;
  externalId?: string;
  source?: string;
  isActive: boolean;
  sortOrder?: number;
  metadata?: MetadataRecord;
};

export type CarMetadataSnapshot = {
  source: DataSource;
  categories: CarCategoryConfig[];
  brands: CarBrandConfig[];
  models: CarModelConfig[];
};

export type CarMetadataImportItem = {
  externalId?: string;
  name: string;
  slug: string;
  sortOrder: number;
  metadata?: MetadataRecord;
};

const STORAGE_KEY = "sureride_admin_car_metadata_draft_v1";
const FALLBACK_DATE = "2026-03-21T10:00:00.000Z";

const DEFAULT_RAW_STATE: RawState = {
  categories: [
    {
      id: "cat_suv",
      name: "SUV",
      slug: "suv",
      source: "seed",
      isActive: true,
      sortOrder: 1,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
    },
    {
      id: "cat_sedan",
      name: "Sedan",
      slug: "sedan",
      source: "seed",
      isActive: true,
      sortOrder: 2,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
    },
    {
      id: "cat_luxury",
      name: "Luxury",
      slug: "luxury",
      source: "seed",
      isActive: false,
      sortOrder: 3,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
    },
  ],
  brands: [
    {
      id: "brand_toyota",
      categoryId: "cat_sedan",
      name: "Toyota",
      slug: "toyota",
      source: "seed",
      isActive: true,
      sortOrder: 1,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
    },
    {
      id: "brand_bmw",
      categoryId: "cat_suv",
      name: "BMW",
      slug: "bmw",
      source: "seed",
      isActive: true,
      sortOrder: 2,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
    },
    {
      id: "brand_tesla",
      categoryId: "cat_luxury",
      name: "Tesla",
      slug: "tesla",
      source: "seed",
      isActive: false,
      sortOrder: 3,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
    },
  ],
  models: [
    {
      id: "model_corolla",
      categoryId: "cat_sedan",
      brandId: "brand_toyota",
      name: "Corolla",
      slug: "corolla",
      source: "seed",
      isActive: true,
      sortOrder: 1,
      carsCount: 96,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
      metadata: { yearRange: "2015 - 2025" },
    },
    {
      id: "model_x5",
      categoryId: "cat_suv",
      brandId: "brand_bmw",
      name: "X5",
      slug: "x5",
      source: "seed",
      isActive: true,
      sortOrder: 2,
      carsCount: 21,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
      metadata: { yearRange: "2017 - 2025" },
    },
    {
      id: "model_3",
      categoryId: "cat_luxury",
      brandId: "brand_tesla",
      name: "Model 3",
      slug: "model-3",
      source: "seed",
      isActive: false,
      sortOrder: 3,
      carsCount: 7,
      createdAt: FALLBACK_DATE,
      updatedAt: FALLBACK_DATE,
      metadata: { yearRange: "2020 - 2025" },
    },
  ],
};

function cloneDefaultState(): RawState {
  return JSON.parse(JSON.stringify(DEFAULT_RAW_STATE)) as RawState;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function readLocalState(): RawState {
  if (typeof window === "undefined") return cloneDefaultState();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneDefaultState();

  try {
    const parsed = JSON.parse(raw) as Partial<RawState>;

    return {
      categories: Array.isArray(parsed.categories)
        ? (parsed.categories as RawCategory[])
        : cloneDefaultState().categories,
      brands: Array.isArray(parsed.brands)
        ? (parsed.brands as RawBrand[])
        : cloneDefaultState().brands,
      models: Array.isArray(parsed.models)
        ? (parsed.models as RawModel[])
        : cloneDefaultState().models,
    };
  } catch {
    return cloneDefaultState();
  }
}

function writeLocalState(state: RawState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mergeServerStateWithLocal(server: RawState): RawState {
  const local = readLocalState();

  return {
    categories: server.categories.map((category) => {
      const localMatch = local.categories.find((item) => item.id === category.id);
      return {
        ...localMatch,
        ...category,
        metadata: category.metadata ?? localMatch?.metadata ?? null,
      };
    }),
    brands: server.brands.map((brand) => {
      const localMatch = local.brands.find((item) => item.id === brand.id);
      return {
        ...localMatch,
        ...brand,
        metadata: brand.metadata ?? localMatch?.metadata ?? null,
      };
    }),
    models: server.models.map((model) => {
      const localMatch = local.models.find((item) => item.id === model.id);
      return {
        ...localMatch,
        ...model,
        metadata: model.metadata ?? localMatch?.metadata ?? null,
        carsCount: model.carsCount ?? localMatch?.carsCount ?? 0,
      };
    }),
  };
}

function deriveState(state: RawState): Omit<CarMetadataSnapshot, "source"> {
  const categories = state.categories
    .map((category) => ({
      ...category,
      brandsCount: state.brands.filter((brand) => brand.categoryId === category.id).length,
      modelsCount: state.models.filter((model) => model.categoryId === category.id).length,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const brands = state.brands
    .map((brand) => ({
      ...brand,
      categoryName:
        state.categories.find((category) => category.id === brand.categoryId)?.name ?? "Unassigned",
      modelsCount: state.models.filter((model) => model.brandId === brand.id).length,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const models = state.models
    .map((model) => ({
      ...model,
      brandName: state.brands.find((brand) => brand.id === model.brandId)?.name ?? "Unknown brand",
      categoryName:
        state.categories.find((category) => category.id === model.categoryId)?.name ?? "Unassigned",
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return { categories, brands, models };
}

async function fetchServerState(): Promise<RawState> {
  const [categories, brands, models] = await Promise.all([
    apiRequest<DraftListResponse<RawCategory>>("/admin/cars/meta/categories?limit=200"),
    apiRequest<DraftListResponse<RawBrand>>("/admin/cars/meta/brands?limit=500"),
    apiRequest<DraftListResponse<RawModel>>("/admin/cars/meta/models?limit=1000"),
  ]);

  return {
    categories: categories.items ?? [],
    brands: brands.items ?? [],
    models: models.items ?? [],
  };
}

async function refreshFromServerOrLocal(): Promise<CarMetadataSnapshot> {
  try {
    const state = mergeServerStateWithLocal(await fetchServerState());
    writeLocalState(state);

    return {
      source: "server",
      ...deriveState(state),
    };
  } catch {
    const local = readLocalState();
    return {
      source: "local",
      ...deriveState(local),
    };
  }
}

export async function listCarMetadataDraft(): Promise<CarMetadataSnapshot> {
  return refreshFromServerOrLocal();
}

export async function saveCarCategoryDraft(input: CarCategoryInput) {
  try {
    if (input.id) {
      await apiRequest(`/admin/cars/meta/categories/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          externalId: input.externalId || undefined,
          source: input.source || undefined,
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          metadata: input.metadata ?? undefined,
        }),
      });
    } else {
      await apiRequest("/admin/cars/meta/categories", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || undefined,
          source: input.source || undefined,
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          metadata: input.metadata ?? undefined,
        }),
      });
    }

    const snapshot = await refreshFromServerOrLocal();
    return snapshot;
  } catch (error) {
    const shouldFallback = error instanceof Error && error.message === "NEXT_PUBLIC_API_BASE_URL is not set";
    if (!shouldFallback) throw error;
    const state = readLocalState();
    const timestamp = nowIso();
    const currentCategory = input.id
      ? state.categories.find((category) => category.id === input.id)
      : undefined;

    const nextCategory: RawCategory = input.id
      ? {
          ...(currentCategory ??
            state.categories[0] ?? {
              id: input.id,
              createdAt: timestamp,
            }),
          id: input.id,
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || null,
          source: input.source || "manual",
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          updatedAt: timestamp,
          createdAt: currentCategory?.createdAt ?? timestamp,
          metadata: input.metadata ?? null,
        }
      : {
          id: randomId("cat"),
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || null,
          source: input.source || "manual",
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          metadata: input.metadata ?? null,
        };

    const categories = input.id
      ? state.categories.map((category) => (category.id === input.id ? nextCategory : category))
      : [...state.categories, nextCategory];

    const nextState = { ...state, categories };
    writeLocalState(nextState);

    return {
      source: "local" as const,
      ...deriveState(nextState),
    };
  }
}

export async function setCarCategoryStatusDraft(categoryId: string, isActive: boolean) {
  const state = readLocalState();
  const category = state.categories.find((item) => item.id === categoryId);
  if (!category) return refreshFromServerOrLocal();

  return saveCarCategoryDraft({
    id: category.id,
    name: category.name,
    slug: category.slug,
    externalId: category.externalId ?? undefined,
    source: category.source ?? undefined,
    isActive,
    sortOrder: category.sortOrder,
    metadata: category.metadata ?? undefined,
  });
}

export async function saveCarBrandDraft(input: CarBrandInput) {
  try {
    if (!input.id && !input.categoryId) {
      throw new Error("Category is required");
    }

    if (input.id) {
      await apiRequest(`/admin/cars/meta/brands/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: input.categoryId || undefined,
          name: input.name,
          externalId: input.externalId || undefined,
          source: input.source || undefined,
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          metadata: input.metadata ?? undefined,
        }),
      });
    } else {
      await apiRequest("/admin/cars/meta/brands", {
        method: "POST",
        body: JSON.stringify({
          categoryId: input.categoryId,
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || undefined,
          source: input.source || undefined,
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          metadata: input.metadata ?? undefined,
        }),
      });
    }

    const snapshot = await refreshFromServerOrLocal();
    return snapshot;
  } catch (error) {
    const shouldFallback = error instanceof Error && error.message === "NEXT_PUBLIC_API_BASE_URL is not set";
    if (!shouldFallback) throw error;
    const state = readLocalState();
    const timestamp = nowIso();
    const currentBrand = input.id ? state.brands.find((brand) => brand.id === input.id) : undefined;

    const nextBrand: RawBrand = input.id
      ? {
          ...(currentBrand ??
            state.brands[0] ?? {
              id: input.id,
              createdAt: timestamp,
            }),
          id: input.id,
          categoryId: input.categoryId || null,
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || null,
          source: input.source || "manual",
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          updatedAt: timestamp,
          createdAt: currentBrand?.createdAt ?? timestamp,
          metadata: input.metadata ?? null,
        }
      : {
          id: randomId("brand"),
          categoryId: input.categoryId || null,
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || null,
          source: input.source || "manual",
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          metadata: input.metadata ?? null,
        };

    const brands = input.id
      ? state.brands.map((brand) => (brand.id === input.id ? nextBrand : brand))
      : [...state.brands, nextBrand];

    const nextState = { ...state, brands };
    writeLocalState(nextState);

    return {
      source: "local" as const,
      ...deriveState(nextState),
    };
  }
}

export async function setCarBrandStatusDraft(brandId: string, isActive: boolean) {
  const state = readLocalState();
  const brand = state.brands.find((item) => item.id === brandId);
  if (!brand) return refreshFromServerOrLocal();

  return saveCarBrandDraft({
    id: brand.id,
    categoryId: brand.categoryId ?? undefined,
    name: brand.name,
    slug: brand.slug,
    externalId: brand.externalId ?? undefined,
    source: brand.source ?? undefined,
    isActive,
    sortOrder: brand.sortOrder,
    metadata: brand.metadata ?? undefined,
  });
}

export async function saveCarModelDraft(input: CarModelInput) {
  try {
    if (input.id) {
      await apiRequest(`/admin/cars/meta/models/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: input.categoryId || undefined,
          brandId: input.brandId,
          name: input.name,
          externalId: input.externalId || undefined,
          source: input.source || undefined,
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          metadata: input.metadata ?? undefined,
        }),
      });
    } else {
      await apiRequest("/admin/cars/meta/models", {
        method: "POST",
        body: JSON.stringify({
          categoryId: input.categoryId || undefined,
          brandId: input.brandId,
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || undefined,
          source: input.source || undefined,
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          metadata: input.metadata ?? undefined,
        }),
      });
    }

    const snapshot = await refreshFromServerOrLocal();
    return snapshot;
  } catch (error) {
    const shouldFallback = error instanceof Error && error.message === "NEXT_PUBLIC_API_BASE_URL is not set";
    if (!shouldFallback) throw error;
    const state = readLocalState();
    const timestamp = nowIso();
    const currentModel = input.id ? state.models.find((model) => model.id === input.id) : undefined;

    const nextModel: RawModel = input.id
      ? {
          ...(currentModel ??
            state.models[0] ?? {
              id: input.id,
              createdAt: timestamp,
            }),
          id: input.id,
          categoryId: input.categoryId || null,
          brandId: input.brandId,
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || null,
          source: input.source || "manual",
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          updatedAt: timestamp,
          createdAt: currentModel?.createdAt ?? timestamp,
          carsCount: currentModel?.carsCount ?? 0,
          metadata: input.metadata ?? null,
        }
      : {
          id: randomId("model"),
          categoryId: input.categoryId || null,
          brandId: input.brandId,
          name: input.name,
          slug: input.slug || slugify(input.name),
          externalId: input.externalId || null,
          source: input.source || "manual",
          isActive: input.isActive,
          sortOrder: input.sortOrder ?? 0,
          createdAt: timestamp,
          updatedAt: timestamp,
          carsCount: 0,
          metadata: input.metadata ?? null,
        };

    const models = input.id
      ? state.models.map((model) => (model.id === input.id ? nextModel : model))
      : [...state.models, nextModel];

    const nextState = { ...state, models };
    writeLocalState(nextState);

    return {
      source: "local" as const,
      ...deriveState(nextState),
    };
  }
}

export async function setCarModelStatusDraft(modelId: string, isActive: boolean) {
  const state = readLocalState();
  const model = state.models.find((item) => item.id === modelId);
  if (!model) return refreshFromServerOrLocal();

  return saveCarModelDraft({
    id: model.id,
    categoryId: model.categoryId ?? undefined,
    brandId: model.brandId,
    name: model.name,
    slug: model.slug,
    externalId: model.externalId ?? undefined,
    source: model.source ?? undefined,
    isActive,
    sortOrder: model.sortOrder,
    metadata: model.metadata ?? undefined,
  });
}

export async function importCarMetaCategories(input: {
  source: string;
  items: CarMetadataImportItem[];
}) {
  await apiRequest("/admin/cars/meta/categories/import", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return refreshFromServerOrLocal();
}

export async function importCarMetaBrands(input: {
  source: string;
  categoryId: string;
  items: CarMetadataImportItem[];
}) {
  await apiRequest("/admin/cars/meta/brands/import", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return refreshFromServerOrLocal();
}

export async function importCarMetaModels(input: {
  source: string;
  categoryId?: string;
  brandId: string;
  items: CarMetadataImportItem[];
}) {
  await apiRequest("/admin/cars/meta/models/import", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return refreshFromServerOrLocal();
}
