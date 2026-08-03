import { apiRequest } from "@/src/lib/api";

export type ProtectionTier = "PREMIUM" | "STANDARD" | "MINIMUM";
export type ProtectionProductType = "DAMAGE_WAIVER" | "INSURANCE";
export type ProtectionPricingModel = "PER_DAY" | "PERCENT_OF_TRIP";
export type ProtectionApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  currency: string;
  // Protection Plan fields
  tier: ProtectionTier;
  productType: ProtectionProductType;
  pricingModel: ProtectionPricingModel;
  pricingPercent: number | null;
  deductibleAmount: number | null;
  liabilityLimit: number | null;
  physicalDamageLimit: number | null;
  coveredPerils: string[];
  exclusions: string[];
  coverageType: string | null;
  underwriter: string | null;
  allowedRegions: string[];
  productHighlights: string[];
  approvalStatus: ProtectionApprovalStatus;
  approvalNote: string | null;
  approvedByAdminEmail: string | null;
  approvedAt: string | null;
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

export function adminSetInsuranceApproval(
  insuranceId: string,
  payload: { approvalStatus: "APPROVED" | "REJECTED" | "PENDING"; approvalNote?: string },
) {
  return apiRequest<{ message: string; insurance: AdminInsurancePackage }>(
    `/admin/insurance/${insuranceId}/approval`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
