import { mapCarToRow, type AdminCarFeatureOption } from "@/src/lib/carsApi";
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

export type ProviderRegisterPayload = {
  businessName: string;
  email: string;
  phone?: string;
  password: string;
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
  businessOpeningTime?: string | null;
  businessClosingTime?: string | null;
  businessOperatingDays?: string[];
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
  cancelledRentals: number;
  revenueThisMonth: number;
  charts: {
    revenueTrend: Array<{ label: string; value: number }>;
    bookingsTrend: Array<{ label: string; value: number }>;
    bookingStatusBreakdown: Array<{ label: string; value: number }>;
    fleetStatusBreakdown: Array<{ label: string; value: number }>;
  };
  recent: {
    bookings: Array<{
      id: string;
      title: string;
      subtitle: string;
      status: string;
      createdAt: string;
      value?: number;
    }>;
  };
};

function normalizeProviderDashboardStats(raw: any): ProviderDashboardStats {
  const totalCars = Number(raw?.totalCars ?? 0);
  const activeCars = Number(raw?.activeCars ?? 0);
  const pendingCars = Number(raw?.pendingCars ?? 0);
  const activeRentals = Number(raw?.activeRentals ?? 0);
  const upcomingRentals = Number(raw?.upcomingRentals ?? 0);
  const completedRentals = Number(raw?.completedRentals ?? 0);
  const cancelledRentals = Number(raw?.cancelledRentals ?? 0);
  const revenueThisMonth = Number(raw?.revenueThisMonth ?? 0);

  return {
    totalCars,
    activeCars,
    pendingCars,
    activeRentals,
    upcomingRentals,
    completedRentals,
    cancelledRentals,
    revenueThisMonth,
    charts: {
      revenueTrend: Array.isArray(raw?.charts?.revenueTrend)
        ? raw.charts.revenueTrend
        : [],
      bookingsTrend: Array.isArray(raw?.charts?.bookingsTrend)
        ? raw.charts.bookingsTrend
        : [],
      bookingStatusBreakdown: Array.isArray(raw?.charts?.bookingStatusBreakdown)
        ? raw.charts.bookingStatusBreakdown
        : [
            { label: "Active", value: activeRentals },
            { label: "Upcoming", value: upcomingRentals },
            { label: "Completed", value: completedRentals },
            { label: "Cancelled", value: cancelledRentals },
          ],
      fleetStatusBreakdown: Array.isArray(raw?.charts?.fleetStatusBreakdown)
        ? raw.charts.fleetStatusBreakdown
        : [
            { label: "Approved", value: activeCars },
            { label: "Pending", value: pendingCars },
            {
              label: "Other",
              value: Math.max(totalCars - activeCars - pendingCars, 0),
            },
          ],
    },
    recent: {
      bookings: Array.isArray(raw?.recent?.bookings) ? raw.recent.bookings : [],
    },
  };
}

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
  businessOpeningTime?: string | null;
  businessClosingTime?: string | null;
  businessOperatingDays?: string[];
};

export type ProviderCountryOption = {
  id: string;
  name: string;
  code: string;
};

export type ProviderLocation = {
  id: string;
  name: string;
  address: string;
  providerId: string;
  providerName: string;
  countryId: string;
  countryName: string;
  countryCode: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type ProviderInsurancePackage = {
  id: string;
  name: string;
  description: string;
  dailyPrice: number;
  isActive: boolean;
  providerId?: string | null;
  carId?: string | null;
  car?: {
    id: string;
    label: string;
  } | null;
  createdAt: string;
};

export type UpsertProviderInsurancePayload = {
  name: string;
  description: string;
  dailyPrice: number;
  isActive?: boolean;
  carId?: string | null;
};

export type UpsertProviderLocationPayload = {
  name: string;
  address: string;
  countryId: string;
  latitude?: string | null;
  longitude?: string | null;
};

type RawProviderLocation = {
  id: string;
  name?: string;
  address?: string;
  providerId?: string;
  provider?: { name?: string };
  countryId?: string;
  country?: { name?: string; code?: string };
  latitude?: number | null;
  longitude?: number | null;
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

function mapProviderLocation(row: RawProviderLocation): ProviderLocation {
  return {
    id: row.id,
    name: row.name || "Unnamed location",
    address: row.address || "",
    providerId: row.providerId || "",
    providerName: row.provider?.name || "",
    countryId: row.countryId || "",
    countryName: row.country?.name || "",
    countryCode: row.country?.code || "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  };
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

export function loginProvider(
  email: string,
  password: string,
  recaptchaToken?: string,
) {
  return providerApiRequest<ProviderLoginResponse>("/provider/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, recaptchaToken }),
  });
}

export function registerProvider(
  payload: ProviderRegisterPayload & { recaptchaToken?: string },
) {
  return providerApiRequest<{ message: string }>("/provider/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestProviderPasswordReset(
  email: string,
  recaptchaToken?: string,
) {
  return providerApiRequest<{ message: string }>(
    "/provider/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ email, recaptchaToken }),
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
  return providerApiRequest<any>("/provider/dashboard").then(
    normalizeProviderDashboardStats,
  );
}

export async function listProviderLocations() {
  const rows = await providerApiRequest<RawProviderLocation[]>("/provider/locations");
  return rows.map(mapProviderLocation);
}

export function listProviderCountries() {
  return providerApiRequest<ProviderCountryOption[]>("/provider/countries");
}

export function listProviderInsurancePackages() {
  return providerApiRequest<{ items: ProviderInsurancePackage[] }>(
    "/provider/insurance",
  );
}

export function createProviderInsurancePackage(
  payload: UpsertProviderInsurancePayload,
) {
  return providerApiRequest<{
    message: string;
    insurance: ProviderInsurancePackage;
  }>("/provider/insurance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProviderInsurancePackage(
  insuranceId: string,
  payload: Partial<UpsertProviderInsurancePayload>,
) {
  return providerApiRequest<{
    message: string;
    insurance: ProviderInsurancePackage;
  }>(`/provider/insurance/${insuranceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteProviderInsurancePackage(insuranceId: string) {
  return providerApiRequest<{ message: string }>(
    `/provider/insurance/${insuranceId}`,
    {
      method: "DELETE",
    },
  );
}

export function createProviderLocation(payload: UpsertProviderLocationPayload) {
  return providerApiRequest<{ message: string; location: RawProviderLocation }>(
    "/provider/locations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  ).then((response) => ({
    ...response,
    location: mapProviderLocation(response.location),
  }));
}

export function updateProviderLocation(
  locationId: string,
  payload: Partial<UpsertProviderLocationPayload>,
) {
  return providerApiRequest<{ message: string; location: RawProviderLocation }>(
    `/provider/locations/${locationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  ).then((response) => ({
    ...response,
    location: mapProviderLocation(response.location),
  }));
}

export function deleteProviderLocation(locationId: string) {
  return providerApiRequest<{ message: string }>(`/provider/locations/${locationId}`, {
    method: "DELETE",
  });
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

export type ProviderCarDetail = {
  id: string;
  brand: string;
  model: string;
  category: string;
  year: number | null;
  seats: number | null;
  bags: string | null;
  hasAC: boolean;
  transmission: string;
  mileagePolicy: string;
  dailyRate: number;
  hourlyRate: number | null;
  status: string;
  isActive: boolean;
  moderationNote: string | null;
  flaggedReason: string | null;
  locationId: string;
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
  features: Array<{ featureId: string; feature: { id: string; name: string; category: string } }>;
  location: {
    id: string;
    name: string;
    address: string;
    country?: { name: string; code: string } | null;
  } | null;
};

export type UpdateProviderCarPayload = Partial<ProviderCreateCarPayload>;

export function getProviderCar(carId: string) {
  return providerApiRequest<ProviderCarDetail>(`/provider/cars/${carId}`);
}

export function updateProviderCar(carId: string, payload: UpdateProviderCarPayload) {
  return providerApiRequest<{ message: string; car: ProviderCarDetail }>(
    `/provider/cars/${carId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteProviderCarImage(carId: string, imageId: string) {
  return providerApiRequest<{ message: string }>(
    `/provider/cars/${carId}/images/${imageId}`,
    { method: "DELETE" },
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

/* ── Earnings & Payouts ── */

export type ProviderEarningsOverview = {
  totalEarned: number;
  totalPaid: number;
  pendingAmount: number;
  availableBalance: number;
  bookingCount?: number;
  pendingPayoutCount?: number;
  recentPayouts: Array<{
    id: string;
    amount: number;
    currency: string;
    status: "PENDING" | "PAID" | "CANCELLED";
    reference: string | null;
    note: string | null;
    createdAt: string;
  }>;
  recentBookings: Array<{
    id: string;
    car?: { brand?: string; model?: string } | null;
    providerEarning: number | null;
    status: string;
    pickupAt: string;
    returnAt: string;
  }>;
};

export type ProviderPayoutAccount = {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency?: string;
  isVerified?: boolean;
};

export function getProviderEarnings() {
  return providerApiRequest<ProviderEarningsOverview>("/provider/earnings");
}

export function listProviderPayouts(params?: { page?: number; limit?: number }) {
  const query = makeQuery({ page: params?.page ?? 1, limit: params?.limit ?? 50 });
  return providerApiRequest<{ items: ProviderEarningsOverview["recentPayouts"]; meta: { total: number; pages: number } }>(
    `/provider/payouts${query}`,
  );
}

export function requestProviderPayout(amount: number, note?: string) {
  return providerApiRequest<{ message: string }>("/provider/payouts/request", {
    method: "POST",
    body: JSON.stringify({ amount, note }),
  });
}

export function getProviderPayoutAccount() {
  return providerApiRequest<ProviderPayoutAccount | null>("/provider/payout-account");
}

export function upsertProviderPayoutAccount(payload: Omit<ProviderPayoutAccount, "id" | "isVerified">) {
  return providerApiRequest<{ message: string; account: ProviderPayoutAccount }>(
    "/provider/payout-account",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
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
