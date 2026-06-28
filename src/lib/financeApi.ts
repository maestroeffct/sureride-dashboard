import { apiRequest } from "@/src/lib/api";

export type PaymentStatus =
  | "UNPAID"
  | "REQUIRES_ACTION"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED";

export type PaymentTransactionRow = {
  id: string;
  userId: string | null;
  carId: string | null;
  totalPrice: number;
  currency: string | null;
  status: string;
  paymentProvider: string | null;
  paymentGatewayKey: string | null;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  paymentError: string | null;
  paidAt: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
  car?: { brand: string; model: string } | null;
};

type ListResponse = {
  items: PaymentTransactionRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export async function adminListPaymentTransactions(params: {
  status?: PaymentStatus | "";
  provider?: string;
  gatewayKey?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.provider) qs.set("provider", params.provider);
  if (params.gatewayKey) qs.set("gatewayKey", params.gatewayKey);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return apiRequest<ListResponse>(
    `/admin/payments/transactions${s ? `?${s}` : ""}`,
  );
}
