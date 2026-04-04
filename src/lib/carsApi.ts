import { apiRequest } from "@/src/lib/api";
import type {
  BackendCarStatus,
  RawCarApi,
  RentalCarRow,
} from "@/src/types/rentalCar";

export type ListCarsParams = {
  q?: string;
  status?: RentalCarRow["dashboardStatus"] | "";
  providerId?: string;
  city?: string;
  page?: number;
  limit?: number;
};

export type AdminCarListResponse = {
  items: RawCarApi[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type CreateAdminCarPayload = {
  providerId: string;
  locationId: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  seats: number;
  bags: string;
  hasAC: boolean;
  transmission: string;
  mileagePolicy: string;
  dailyRate: number;
  hourlyRate?: number | null;
  autoApprove?: boolean;
  note?: string;
};

export type AdminCarFeatureOption = {
  id: string;
  name: string;
  category: string;
  icon?: string | null;
  providerId?: string | null;
  isActive?: boolean;
};

export type RentalLocationOption = {
  id: string;
  name: string;
  address: string;
  providerId: string;
  providerName: string;
};

function toBackendStatus(
  status?: ListCarsParams["status"],
): BackendCarStatus | undefined {
  if (!status) return undefined;
  if (status === "active") return "APPROVED";
  if (status === "flagged") return "FLAGGED";
  return "PENDING_APPROVAL";
}

function toDashboardStatus(car: RawCarApi): RentalCarRow["dashboardStatus"] {
  const backendStatus = (car.status || "DRAFT") as BackendCarStatus;

  if (backendStatus === "FLAGGED") {
    return "flagged";
  }

  if (backendStatus === "APPROVED" && car.isActive !== false) {
    return "active";
  }

  return "pending";
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

export function mapCarToRow(car: RawCarApi): RentalCarRow {
  const locationName = car.location?.name || "-";
  const address = car.location?.address || "";
  const backendStatus = (car.status || "DRAFT") as BackendCarStatus;

  return {
    id: car.id,
    brand: car.brand || "-",
    model: car.model || "-",
    category: car.category || "-",
    year: typeof car.year === "number" ? car.year : null,
    seats: typeof car.seats === "number" ? car.seats : null,
    transmission: car.transmission || "-",
    dailyRate: typeof car.dailyRate === "number" ? car.dailyRate : null,
    hourlyRate: typeof car.hourlyRate === "number" ? car.hourlyRate : null,
    isActive: car.isActive !== false,
    providerId: car.provider?.id || "",
    providerName: car.provider?.name || "Unknown Provider",
    providerStatus: car.provider?.status || "UNKNOWN",
    locationId: car.location?.id || "",
    locationName,
    city: address || locationName,
    imageUrl: car.images?.[0]?.url || "",
    createdAt: car.createdAt || new Date().toISOString(),
    dashboardStatus: toDashboardStatus(car),
    backendStatus,
    moderationNote: car.moderationNote ?? null,
    flaggedReason: car.flaggedReason ?? null,
  };
}

export async function listCars(params: ListCarsParams = {}) {
  const query = makeQuery({
    q: params.q,
    status: toBackendStatus(params.status),
    providerId: params.providerId,
    city: params.city,
    page: params.page ?? 1,
    limit: params.limit ?? 100,
  });

  const response = await apiRequest<AdminCarListResponse>(`/admin/cars${query}`);

  return {
    items: response.items.map(mapCarToRow),
    meta: response.meta,
  };
}

export function createAdminCar(payload: CreateAdminCarPayload) {
  return apiRequest<{ message: string; car: RawCarApi }>("/admin/cars", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listAdminCarFeatureOptions(providerId?: string) {
  const query = makeQuery({
    providerId,
  });

  return apiRequest<{ items: AdminCarFeatureOption[] }>(
    `/admin/cars/meta/features${query}`,
  );
}

export function attachAdminCarFeatures(carId: string, featureIds: string[]) {
  return apiRequest<{ message: string; car: RawCarApi }>(
    `/admin/cars/${carId}/features`,
    {
      method: "POST",
      body: JSON.stringify({ featureIds }),
    },
  );
}

export function uploadAdminCarImages(carId: string, files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  return apiRequest<{ message: string }>(`/admin/cars/${carId}/images`, {
    method: "POST",
    body: formData,
  });
}

export function approveAdminCar(carId: string, note?: string) {
  return apiRequest<{ message: string; car: RawCarApi }>(
    `/admin/cars/${carId}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify({ note }),
    },
  );
}

export function rejectAdminCar(carId: string, reason: string) {
  return apiRequest<{ message: string; car: RawCarApi }>(
    `/admin/cars/${carId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}

export function flagAdminCar(carId: string, reason: string) {
  return apiRequest<{ message: string; car: RawCarApi }>(
    `/admin/cars/${carId}/flag`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}

export function unflagAdminCar(carId: string, note?: string) {
  return apiRequest<{ message: string; car: RawCarApi }>(
    `/admin/cars/${carId}/unflag`,
    {
      method: "PATCH",
      body: JSON.stringify({ note }),
    },
  );
}

export function activateAdminCar(carId: string) {
  return apiRequest<{ message: string; car: RawCarApi }>(
    `/admin/cars/${carId}/activate`,
    {
      method: "PATCH",
    },
  );
}

export function deactivateAdminCar(carId: string, reason?: string) {
  return apiRequest<{ message: string; car: RawCarApi }>(
    `/admin/cars/${carId}/deactivate`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}

export async function listRentalLocations() {
  const rows = await apiRequest<
    Array<{
      id: string;
      name?: string;
      address?: string;
      provider?: { id?: string; name?: string };
    }>
  >("/rental/locations");

  return rows.map((row) => ({
    id: row.id,
    name: row.name || "Unnamed location",
    address: row.address || "",
    providerId: row.provider?.id || "",
    providerName: row.provider?.name || "Unknown Provider",
  })) as RentalLocationOption[];
}
