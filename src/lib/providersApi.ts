import { apiRequest } from "@/src/lib/api";
import type { RentalProvider } from "@/src/types/rentalProvider";

export type ProviderWorkflowStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "SUSPENDED";

export type ProviderRequestApiStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ProviderDocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ProviderSummaryApi = RentalProvider & {
  workflowStatus: ProviderWorkflowStatus;
  createdBy: "SURERIDE_ADMIN" | "PROVIDER_SELF_REGISTERED";
  isVerified: boolean;
  isActive: boolean;
  documentsCount: number;
  commissionRate: number | null;
};

export type SaveProviderDraftPayload = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  contactPersonName?: string;
  contactPersonRole?: string;
  contactPersonPhone?: string;
  businessAddress?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
};

export type ProviderRequestApiRow = {
  id: string;
  businessName: string;
  email: string;
  phone?: string | null;
  status: ProviderRequestApiStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProviderDocumentApi = {
  id: string;
  providerId: string;
  type: string;
  url: string;
  status: ProviderDocumentStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListProvidersParams = {
  q?: string;
  status?: "draft" | "pending" | "active" | "suspended" | "";
  page?: number;
  limit?: number;
};

export type ListProviderRequestsParams = {
  q?: string;
  status?: ProviderRequestApiStatus;
  page?: number;
  limit?: number;
};

function toProviderStatusFilter(status?: ListProvidersParams["status"]) {
  if (!status) return undefined;
  if (status === "draft") return "DRAFT";
  if (status === "pending") return "PENDING_APPROVAL";
  if (status === "active") return "ACTIVE";
  return "SUSPENDED";
}

function makeQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function listProviders(params: ListProvidersParams = {}) {
  const query = makeQuery({
    q: params.q,
    status: toProviderStatusFilter(params.status),
    page: params.page,
    limit: params.limit,
  });

  return apiRequest<PaginatedResponse<ProviderSummaryApi>>(
    `/admin/providers${query}`,
  );
}

export async function saveProviderDraft(payload: SaveProviderDraftPayload) {
  return apiRequest<ProviderSummaryApi>("/admin/providers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitProvider(providerId: string) {
  return apiRequest<{ message: string; provider: ProviderSummaryApi }>(
    `/admin/providers/${providerId}/submit`,
    { method: "PATCH" },
  );
}

export async function approveProvider(providerId: string) {
  return apiRequest<{ message: string }>(`/admin/providers/${providerId}/approve`, {
    method: "PATCH",
  });
}

export async function suspendProvider(providerId: string, reason?: string) {
  return apiRequest<{ message: string }>(`/admin/providers/${providerId}/suspend`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function resetProviderPassword(providerId: string) {
  return apiRequest<{ message: string }>(
    `/admin/providers/${providerId}/reset-password`,
    {
      method: "PATCH",
    },
  );
}

export async function listProviderRequests(
  params: ListProviderRequestsParams = {},
) {
  const query = makeQuery({
    q: params.q,
    status: params.status,
    page: params.page,
    limit: params.limit,
  });

  return apiRequest<PaginatedResponse<ProviderRequestApiRow>>(
    `/admin/provider-requests${query}`,
  );
}

export async function approveProviderRequest(requestId: string) {
  return apiRequest<{ message: string }>(
    `/admin/provider-requests/${requestId}/approve`,
    {
      method: "PATCH",
    },
  );
}

export async function rejectProviderRequest(
  requestId: string,
  adminNote?: string,
) {
  return apiRequest<{ message: string }>(
    `/admin/provider-requests/${requestId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ adminNote }),
    },
  );
}

export async function listProviderDocuments(providerId: string) {
  return apiRequest<ProviderDocumentApi[]>(`/admin/providers/${providerId}/documents`);
}

export async function approveProviderDocument(docId: string) {
  return apiRequest<{ message: string; doc: ProviderDocumentApi }>(
    `/admin/provider-docs/${docId}/approve`,
    {
      method: "PATCH",
    },
  );
}

export async function rejectProviderDocument(docId: string, reason: string) {
  return apiRequest<{ message: string; doc: ProviderDocumentApi }>(
    `/admin/provider-docs/${docId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}
