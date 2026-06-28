import { apiRequest } from "@/src/lib/api";

export type LimousineRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type LimousineRequestRow = {
  id: string;
  userId: string | null;
  customerName: string;
  contactEmail: string;
  contactPhone: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string | null;
  passengerCount: number;
  eventType: string | null;
  notes: string | null;
  status: LimousineRequestStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  items: LimousineRequestRow[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export async function adminListLimousineRequests(params: {
  status?: LimousineRequestStatus | "";
  q?: string;
  page?: number;
  limit?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiRequest<ListResponse>(
    `/admin/limousine-requests${qs ? `?${qs}` : ""}`,
  );
}

export async function adminUpdateLimousineRequest(
  id: string,
  payload: { status: LimousineRequestStatus; adminNote?: string },
) {
  return apiRequest<{ message: string; request: LimousineRequestRow }>(
    `/admin/limousine-requests/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
