import { apiRequest } from "@/src/lib/api";

export type FeatureCategory =
  | "SAFETY"
  | "PROTECTION"
  | "RENTAL_POLICY"
  | "COMFORT"
  | "OTHER";

export type AdminFeature = {
  id: string;
  name: string;
  category: FeatureCategory;
  icon?: string | null;
  providerId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ListAdminFeaturesParams = {
  q?: string;
  category?: FeatureCategory | "";
  isActive?: boolean;
};

function makeQuery(params: Record<string, string | boolean | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listAdminFeatures(params: ListAdminFeaturesParams = {}) {
  const query = makeQuery({
    q: params.q,
    category: params.category,
    isActive: params.isActive,
  });

  return apiRequest<{ items: AdminFeature[] }>(`/admin/cars/meta/features${query}`);
}

export function createAdminFeature(payload: {
  name: string;
  category: FeatureCategory;
  icon?: string | null;
}) {
  return apiRequest<{ message: string; feature: AdminFeature }>(
    "/admin/cars/meta/features",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateAdminFeature(
  featureId: string,
  payload: {
    name?: string;
    category?: FeatureCategory;
    icon?: string | null;
    isActive?: boolean;
  },
) {
  return apiRequest<{ message: string; feature: AdminFeature }>(
    `/admin/cars/meta/features/${featureId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
