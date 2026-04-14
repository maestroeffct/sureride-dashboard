import { apiRequest } from "@/src/lib/api";

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT";

export type AdminCoupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minBookingAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type CouponsResponse = {
  items: AdminCoupon[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type CreateCouponPayload = {
  code: string;
  type: CouponType;
  value: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
  description?: string;
};

export function listAdminCoupons(params: { q?: string; active?: boolean; limit?: number }) {
  const q = new URLSearchParams({ limit: String(params.limit ?? 200) });
  if (params.q) q.set("q", params.q);
  if (typeof params.active === "boolean") q.set("active", String(params.active));
  return apiRequest<CouponsResponse>(`/admin/coupons?${q}`);
}

export function createAdminCoupon(payload: CreateCouponPayload) {
  return apiRequest<AdminCoupon>("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminCoupon(id: string, payload: Partial<CreateCouponPayload>) {
  return apiRequest<AdminCoupon>(`/admin/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function toggleAdminCoupon(id: string) {
  return apiRequest<{ message: string; coupon: AdminCoupon }>(`/admin/coupons/${id}/toggle`, {
    method: "PATCH",
  });
}

export function deleteAdminCoupon(id: string) {
  return apiRequest<{ message: string }>(`/admin/coupons/${id}`, {
    method: "DELETE",
  });
}
