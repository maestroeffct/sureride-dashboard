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

export type ProviderDetailApi = {
  id: string;
  name: string;
  logoUrl?: string | null;
  email: string;
  phone?: string | null;
  contactPersonName?: string | null;
  contactPersonRole?: string | null;
  contactPersonPhone?: string | null;
  businessAddress?: string | null;
  countryId?: string | null;
  country?: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    createdAt: string;
  } | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  status: ProviderWorkflowStatus;
  createdBy: "SURERIDE_ADMIN" | "PROVIDER_SELF_REGISTERED";
  isVerified: boolean;
  isActive: boolean;
  commissionRate: number | null;
  createdAt: string;
  updatedAt: string;
  payoutAccount?: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    currency: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  locations: Array<{
    id: string;
    name: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    createdAt: string;
    country?: {
      id: string;
      name: string;
      code: string;
    };
    _count?: {
      cars: number;
    };
  }>;
  cars: Array<{
    id: string;
    brand: string;
    model: string;
    category: string;
    year: number;
    dailyRate: number;
    status: string;
    isActive: boolean;
    createdAt: string;
    location?: {
      id: string;
      name: string;
      address: string;
    } | null;
    images?: Array<{ url?: string }>;
  }>;
  documents: ProviderDocumentApi[];
  stats: {
    totalCars: number;
    activeCars: number;
    pendingCars: number;
    documentsCount: number;
    locationsCount: number;
  };
};

function normalizeProviderDetail(data: any): ProviderDetailApi {
  const locations = Array.isArray(data?.locations) ? data.locations : [];
  const cars = Array.isArray(data?.cars) ? data.cars : [];
  const documents = Array.isArray(data?.documents) ? data.documents : [];
  const totalCars =
    typeof data?.stats?.totalCars === "number"
      ? data.stats.totalCars
      : typeof data?.totalCars === "number"
        ? data.totalCars
        : cars.length;
  const activeCars =
    typeof data?.stats?.activeCars === "number"
      ? data.stats.activeCars
      : typeof data?.activeCars === "number"
        ? data.activeCars
        : cars.filter((car: any) => car?.isActive).length;
  const pendingCars =
    typeof data?.stats?.pendingCars === "number"
      ? data.stats.pendingCars
      : typeof data?.pendingCars === "number"
        ? data.pendingCars
        : cars.filter((car: any) =>
            car?.status === "PENDING_APPROVAL" || car?.status === "DRAFT",
          ).length;
  const documentsCount =
    typeof data?.stats?.documentsCount === "number"
      ? data.stats.documentsCount
      : typeof data?.documentsCount === "number"
        ? data.documentsCount
        : documents.length;
  const locationsCount =
    typeof data?.stats?.locationsCount === "number"
      ? data.stats.locationsCount
      : locations.length;

  return {
    id: String(data?.id ?? ""),
    name: String(data?.name ?? ""),
    logoUrl: data?.logoUrl ?? null,
    email: String(data?.email ?? ""),
    phone: data?.phone ?? null,
    contactPersonName:
      data?.contactPersonName ?? data?.contactPerson ?? null,
    contactPersonRole: data?.contactPersonRole ?? null,
    contactPersonPhone: data?.contactPersonPhone ?? null,
    businessAddress: data?.businessAddress ?? data?.city ?? null,
    countryId: data?.countryId ?? null,
    country: data?.country ?? null,
    bankName: data?.bankName ?? null,
    bankAccountNumber: data?.bankAccountNumber ?? null,
    bankAccountName: data?.bankAccountName ?? null,
    status:
      data?.status === "draft"
        ? "DRAFT"
        : data?.status === "pending"
          ? "PENDING_APPROVAL"
          : data?.status === "active"
            ? "ACTIVE"
            : data?.status === "suspended"
              ? "SUSPENDED"
              : (data?.status ?? data?.workflowStatus ?? "DRAFT"),
    createdBy: data?.createdBy ?? "SURERIDE_ADMIN",
    isVerified: Boolean(data?.isVerified),
    isActive: data?.isActive !== false,
    commissionRate:
      typeof data?.commissionRate === "number" ? data.commissionRate : null,
    createdAt: String(data?.createdAt ?? data?.joinedOn ?? new Date().toISOString()),
    updatedAt: String(data?.updatedAt ?? data?.joinedOn ?? new Date().toISOString()),
    payoutAccount: data?.payoutAccount ?? null,
    locations,
    cars,
    documents,
    stats: {
      totalCars,
      activeCars,
      pendingCars,
      documentsCount,
      locationsCount,
    },
  };
}

export type SaveProviderDraftPayload = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  contactPersonName?: string;
  contactPersonRole?: string;
  contactPersonPhone?: string;
  businessAddress?: string;
  countryName?: string;
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

export async function getProviderDetail(providerId: string) {
  const data = await apiRequest<any>(`/admin/providers/${providerId}`);
  return normalizeProviderDetail(data);
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
  return apiRequest<{
    message: string;
    temporaryPassword?: string | null;
    tempPasswordExpiresAt?: string | null;
  }>(`/admin/providers/${providerId}/approve`, {
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
  return apiRequest<{
    message: string;
    temporaryPassword?: string | null;
    tempPasswordExpiresAt?: string | null;
  }>(
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
