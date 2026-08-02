import { apiRequest } from "@/src/lib/api";

export type FineTargetType = "USER" | "PROVIDER";

export type FineCategory =
  | "TRAFFIC_VIOLATION"
  | "LATE_RETURN"
  | "DAMAGE"
  | "CLEANING"
  | "MISSED_PICKUP"
  | "CANCELLATION"
  | "OTHER";

export type FineStatus =
  | "PENDING"
  | "PAID"
  | "WAIVED"
  | "DISPUTED"
  | "OVERDUE";

export type FineRow = {
  id: string;
  targetType: FineTargetType;
  userId: string | null;
  providerId: string | null;
  bookingId: string | null;
  amount: number;
  currency: string;
  category: FineCategory;
  status: FineStatus;
  reason: string;
  adminNote: string | null;
  dueDate: string | null;
  issuedByAdminEmail: string;
  resolvedAt: string | null;
  resolvedByAdminEmail: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneCountry: string;
    phoneNumber: string;
  } | null;
  provider: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  booking: {
    id: string;
    pickupAt: string;
    returnAt: string;
    totalPrice: number;
    currency: string;
  } | null;
};

type ListResponse = {
  items: FineRow[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export async function listFines(
  params: {
    q?: string;
    status?: FineStatus | "";
    targetType?: FineTargetType | "";
    page?: number;
    limit?: number;
  } = {},
) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.targetType) qs.set("targetType", params.targetType);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return apiRequest<ListResponse>(`/admin/fines${s ? `?${s}` : ""}`);
}

export async function issueFine(payload: {
  targetType: FineTargetType;
  userId?: string;
  providerId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  category: FineCategory;
  reason: string;
  adminNote?: string;
  dueDate?: string;
}) {
  return apiRequest<{ fine: FineRow }>("/admin/fines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFineStatus(
  id: string,
  payload: { status: "PAID" | "WAIVED" | "DISPUTED" | "PENDING"; adminNote?: string },
) {
  return apiRequest<{ fine: FineRow }>(`/admin/fines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
