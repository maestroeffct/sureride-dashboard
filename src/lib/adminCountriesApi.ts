import { apiRequest } from "@/src/lib/api";

export type AdminCountry = {
  id: string;
  name: string;
  code: string;
  /** ISO 4217 currency code — null when not set yet. */
  currency: string | null;
  isActive: boolean;
  locationsCount: number;
};

type ListAdminCountriesResponse = {
  items: AdminCountry[];
};

type AdminCountryPayload = {
  name: string;
  code: string;
  currency?: string | null;
  isActive?: boolean;
};

export async function listAdminCountries() {
  const data = await apiRequest<ListAdminCountriesResponse>(
    "/admin/platform/countries",
  );

  return data.items ?? [];
}

export async function createAdminCountry(payload: AdminCountryPayload) {
  return apiRequest<AdminCountry>("/admin/platform/countries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCountry(
  countryId: string,
  payload: Partial<AdminCountryPayload>,
) {
  return apiRequest<AdminCountry>(`/admin/platform/countries/${countryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
