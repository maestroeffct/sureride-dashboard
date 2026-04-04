import { mapCarToRow, type AdminCarFeatureOption, type RentalLocationOption } from "@/src/lib/carsApi";
import type { RentalCarRow } from "@/src/types/rentalCar";

type ProviderApiRequestInit = RequestInit;

type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type ProviderRawBooking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus:
    | "UNPAID"
    | "REQUIRES_ACTION"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "CANCELED";
  totalPrice: number;
  basePrice: number;
  insuranceFee: number;
  pickupAt: string;
  returnAt: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneCountry?: string;
    phoneNumber?: string;
  };
  car?: {
    brand?: string;
    model?: string;
    category?: string;
    transmission?: string;
    location?: {
      name?: string;
      address?: string;
    };
    images?: Array<{
      url?: string;
    }>;
  };
};

export type ProviderSessionUser = {
  id: string;
  name: string;
  email: string;
  status: string;
};

export type ProviderLoginResponse = {
  token: string;
  provider: ProviderSessionUser;
  message: string;
  mustChangePassword: boolean;
  tempPasswordExpiresAt?: string | null;
};

export type ProviderProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  contactPersonName?: string | null;
  contactPersonRole?: string | null;
  contactPersonPhone?: string | null;
  businessAddress?: string | null;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  logoUrl?: string | null;
  commissionRate?: number | null;
  mustChangePassword?: boolean;
  tempPasswordExpiresAt?: string | null;
  payoutAccount?: {
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    currency?: string | null;
    isVerified?: boolean | null;
  } | null;
  _count?: {
    cars: number;
    locations: number;
    documents: number;
  };
};

export type ProviderDashboardStats = {
  totalCars: number;
  activeCars: number;
  pendingCars: number;
  activeRentals: number;
  upcomingRentals: number;
  completedRentals: number;
  revenueThisMonth: number;
};

export type ProviderBookingRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  carName: string;
  carMeta: string;
  pickupAt: string;
  returnAt: string;
  location: string;
  totalPrice: number;
  paymentStatus: ProviderRawBooking["paymentStatus"];
  status: ProviderRawBooking["status"];
  imageUrl: string;
  createdAt: string;
};

export type ProviderCreateCarPayload = {
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
};

export type ProviderCarBrandOption = {
  id: string;
  name: string;
  brandId?: string;
};

export type ProviderCarModelOption = {
  id: string;
  name: string;
  brandId: string;
};

export type UpdateProviderProfilePayload = {
  name?: string;
  phone?: string | null;
  contactPersonName?: string | null;
  contactPersonRole?: string | null;
  contactPersonPhone?: string | null;
  businessAddress?: string | null;
};

function getProviderToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("sureride_provider_token")
    : null;
}

async function providerApiRequest<T = any>(
  endpoint: string,
  options: ProviderApiRequestInit = {},
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  const headers = new Headers(options.headers ?? {});

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    const token = getProviderToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Something went wrong";

    throw new Error(message);
  }

  return data as T;
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

function mapBookingToRow(booking: ProviderRawBooking): ProviderBookingRow {
  const firstName = booking.user?.firstName?.trim() || "";
  const lastName = booking.user?.lastName?.trim() || "";
  const customerName =
    `${firstName} ${lastName}`.trim() || booking.user?.email || "Unknown renter";

  return {
    id: booking.id,
    customerName,
    customerEmail: booking.user?.email || "-",
    customerPhone: `${booking.user?.phoneCountry || ""} ${booking.user?.phoneNumber || ""}`.trim(),
    carName: `${booking.car?.brand || "-"} ${booking.car?.model || ""}`.trim(),
    carMeta: `${booking.car?.category || "-"} • ${booking.car?.transmission || "-"}`,
    pickupAt: booking.pickupAt,
    returnAt: booking.returnAt,
    location:
      booking.car?.location?.name ||
      booking.car?.location?.address ||
      "Unknown location",
    totalPrice: booking.totalPrice,
    paymentStatus: booking.paymentStatus,
    status: booking.status,
    imageUrl: booking.car?.images?.[0]?.url || "",
    createdAt: booking.createdAt,
  };
}

export function loginProvider(email: string, password: string) {
  return providerApiRequest<ProviderLoginResponse>("/provider/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function requestProviderPasswordReset(email: string) {
  return providerApiRequest<{ message: string }>(
    "/provider/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  );
}

export function resetProviderPassword(token: string, password: string) {
  return providerApiRequest<{ message: string }>("/provider/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function changeProviderPassword(
  currentPassword: string,
  newPassword: string,
) {
  return providerApiRequest<{ message: string }>("/provider/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function logoutProvider() {
  return providerApiRequest<{ message: string }>("/provider/auth/logout", {
    method: "POST",
  });
}

export function getProviderProfile() {
  return providerApiRequest<ProviderProfile>("/provider/me");
}

export function updateProviderProfile(payload: UpdateProviderProfilePayload) {
  return providerApiRequest<{ message: string; provider: ProviderProfile }>(
    "/provider/me",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function getProviderDashboardStats() {
  return providerApiRequest<ProviderDashboardStats>("/provider/dashboard");
}

export async function listProviderLocations() {
  const rows = await providerApiRequest<
    Array<{
      id: string;
      name?: string;
      address?: string;
      providerId?: string;
      provider?: { name?: string };
    }>
  >("/provider/locations");

  return rows.map((row) => ({
    id: row.id,
    name: row.name || "Unnamed location",
    address: row.address || "",
    providerId: row.providerId || "",
    providerName: row.provider?.name || "",
  })) as RentalLocationOption[];
}

export function listProviderCars(params: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = makeQuery({
    q: params.q,
    status: params.status,
    page: params.page ?? 1,
    limit: params.limit ?? 100,
  });

  return providerApiRequest<PaginatedResponse<any>>(`/provider/cars${query}`).then(
    (response) => ({
      items: response.items.map(mapCarToRow) as RentalCarRow[],
      meta: response.meta,
    }),
  );
}

export function listProviderFeatureOptions() {
  return providerApiRequest<{ items: AdminCarFeatureOption[] }>(
    "/provider/cars/meta/features",
  );
}

export function listProviderCarMetaBrands() {
  return providerApiRequest<{ items: ProviderCarBrandOption[] }>(
    "/provider/cars/meta/brands",
  );
}

export function listProviderCarMetaModels() {
  return providerApiRequest<{ items: ProviderCarModelOption[] }>(
    "/provider/cars/meta/models",
  );
}

export function createProviderCar(payload: ProviderCreateCarPayload) {
  return providerApiRequest<{ message: string; car: { id: string } }>(
    "/provider/cars",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function adminResetProviderPassword(providerId: string) {
  return providerApiRequest<{ message: string }>(
    `/admin/providers/${providerId}/reset-password`,
    {
      method: "PATCH",
    },
  );
}

export function uploadProviderCarImages(carId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  return providerApiRequest<{ message: string }>(`/provider/cars/${carId}/images`, {
    method: "POST",
    body: formData,
  });
}

export function attachProviderCarFeatures(carId: string, featureIds: string[]) {
  return providerApiRequest<{ message: string }>(`/provider/cars/${carId}/features`, {
    method: "POST",
    body: JSON.stringify({ featureIds }),
  });
}

export function submitProviderCar(carId: string, note?: string) {
  return providerApiRequest<{ message: string }>(`/provider/cars/${carId}/submit`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function listProviderBookings(params: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = makeQuery({
    q: params.q,
    status: params.status,
    page: params.page ?? 1,
    limit: params.limit ?? 100,
  });

  return providerApiRequest<PaginatedResponse<ProviderRawBooking>>(
    `/provider/bookings${query}`,
  ).then((response) => ({
    items: response.items.map(mapBookingToRow),
    meta: response.meta,
  }));
}
