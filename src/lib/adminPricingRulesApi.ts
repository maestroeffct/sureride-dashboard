import { apiRequest } from "@/src/lib/api";

export type DepositType = "FIXED" | "PERCENTAGE";

export type PricingRule = {
  id: string;
  categorySlug: string | null; // null = global
  platformCommissionRate: number;
  priceMultiplier: number;
  depositType: DepositType;
  depositValue: number;
  minRentalDays: number;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertPricingRulePayload = {
  categorySlug?: string | null;
  platformCommissionRate?: number;
  priceMultiplier?: number;
  depositType?: DepositType;
  depositValue?: number;
  minRentalDays?: number;
  isActive?: boolean;
  note?: string;
};

export function listPricingRules() {
  return apiRequest<PricingRule[]>("/admin/pricing-rules");
}

export function upsertPricingRule(payload: UpsertPricingRulePayload) {
  return apiRequest<PricingRule>("/admin/pricing-rules", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePricingRule(id: string) {
  return apiRequest<{ message: string }>(`/admin/pricing-rules/${id}`, {
    method: "DELETE",
  });
}
