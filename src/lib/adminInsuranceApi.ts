import { apiRequest } from "@/src/lib/api";

export type AdminInsurancePackage = {
  id: string;
  name: string;
  description: string;
  dailyPrice: number;
  isActive: boolean;
  providerId: string | null;
  carId: string | null;
  provider: { id: string; name: string } | null;
  car: { id: string; label: string } | null;
  isGlobal: boolean;
  createdAt: string;
};

export type AdminInsurancePayload = {
  name: string;
  description: string;
  dailyPrice: number;
  isActive?: boolean;
  /** null/undefined => global (admin-owned) */
  providerId?: string | null;
  /** null/undefined => available to all cars in the chosen scope */
  carId?: string | null;
};

export type AdminInsuranceUpdatePayload = Partial<AdminInsurancePayload>;

export type ListAdminInsuranceParams = {
  providerId?: string;
  scope?: "global" | "provider" | "all";
  isActive?: boolean;
  search?: string;
};

function buildQuery(params: ListAdminInsuranceParams) {
  const qs = new URLSearchParams();
  if (params.providerId) qs.set("providerId", params.providerId);
  if (params.scope) qs.set("scope", params.scope);
  if (typeof params.isActive === "boolean") {
    qs.set("isActive", params.isActive ? "true" : "false");
  }
  if (params.search?.trim()) qs.set("search", params.search.trim());
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function adminListInsurance(params: ListAdminInsuranceParams = {}) {
  return apiRequest<{ items: AdminInsurancePackage[] }>(
    `/admin/insurance${buildQuery(params)}`,
  );
}

export function adminGetInsurance(insuranceId: string) {
  return apiRequest<{ insurance: AdminInsurancePackage }>(
    `/admin/insurance/${insuranceId}`,
  );
}

export function adminCreateInsurance(payload: AdminInsurancePayload) {
  return apiRequest<{ message: string; insurance: AdminInsurancePackage }>(
    `/admin/insurance`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function adminUpdateInsurance(
  insuranceId: string,
  payload: AdminInsuranceUpdatePayload,
) {
  return apiRequest<{ message: string; insurance: AdminInsurancePackage }>(
    `/admin/insurance/${insuranceId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function adminDeleteInsurance(insuranceId: string) {
  return apiRequest<{ message: string }>(`/admin/insurance/${insuranceId}`, {
    method: "DELETE",
  });
}
