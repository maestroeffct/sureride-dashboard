// API wrappers for the provider ops bundle: fines-view, maintenance,
// availability, handovers, damages, refunds, addons, support, reviews,
// analytics, settings. Split out of providerApi.ts to keep that file
// from ballooning.

const TOKEN_KEY = "sureride_provider_token";

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function req<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const headers = new Headers(options.headers ?? {});
  const bodyIsFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!bodyIsFormData && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const t = token();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : ({} as any);
  if (!res.ok) {
    const msg = (data as any)?.message ??
      (data as any)?.errors?.[0]?.message ??
      res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "") return;
    s.set(k, String(v));
  });
  const q = s.toString();
  return q ? `?${q}` : "";
}

// ─── Fines (provider view) ────────────────────────────────────────────────
export type ProviderFineStatus = "PENDING" | "PAID" | "WAIVED" | "DISPUTED" | "OVERDUE";
export type ProviderFineCategory =
  | "TRAFFIC_VIOLATION"
  | "LATE_RETURN"
  | "DAMAGE"
  | "CLEANING"
  | "MISSED_PICKUP"
  | "CANCELLATION"
  | "OTHER";
export type ProviderFineRow = {
  id: string;
  amount: number;
  currency: string;
  category: ProviderFineCategory;
  status: ProviderFineStatus;
  reason: string;
  adminNote: string | null;
  dueDate: string | null;
  issuedByAdminEmail: string;
  resolvedAt: string | null;
  createdAt: string;
  booking: { id: string; pickupAt: string; returnAt: string; totalPrice: number; currency: string } | null;
};

export function listProviderFines(params: {
  status?: ProviderFineStatus | "";
  page?: number;
  limit?: number;
} = {}) {
  return req<{
    items: ProviderFineRow[];
    meta: { page: number; limit: number; total: number; pages: number };
    summary: { totalOutstanding: number; pendingCount: number; overdueCount: number; paidValue: number };
  }>(`/provider/fines${qs(params as any)}`);
}
export function disputeProviderFine(fineId: string, reason: string) {
  return req<{ fine: ProviderFineRow }>(`/provider/fines/${fineId}/dispute`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ─── Maintenance ──────────────────────────────────────────────────────────
export type MaintenanceType =
  | "OIL_CHANGE" | "TYRE" | "BRAKES" | "BODYWORK"
  | "CLEANING" | "FULL_SERVICE" | "INSPECTION" | "OTHER";
export type MaintenanceRow = {
  id: string;
  carId: string;
  type: MaintenanceType;
  serviceDate: string;
  odometerKm: number | null;
  cost: number | null;
  currency: string;
  workshop: string | null;
  notes: string | null;
  receiptUrl: string | null;
  car: { id: string; brand: string; model: string; licensePlate: string | null };
  unavailability: { id: string; startAt: string; endAt: string }[];
  createdAt: string;
};

export function listMaintenance(params: { carId?: string } = {}) {
  return req<{ items: MaintenanceRow[] }>(`/provider/maintenance${qs(params)}`);
}
export function createMaintenance(payload: {
  carId: string;
  type: MaintenanceType;
  serviceDate: string;
  odometerKm?: number;
  cost?: number;
  currency?: string;
  workshop?: string;
  notes?: string;
  receiptUrl?: string;
  blockCarUntil?: string;
}) {
  return req<{ log: MaintenanceRow }>(`/provider/maintenance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function deleteMaintenance(id: string) {
  return req<{ ok: true }>(`/provider/maintenance/${id}`, { method: "DELETE" });
}

// ─── Availability ─────────────────────────────────────────────────────────
export type UnavailabilityReason = "MAINTENANCE" | "OWNER_USE" | "INSURANCE_LAPSE" | "OTHER";
export type UnavailabilityRow = {
  id: string;
  carId: string;
  startAt: string;
  endAt: string;
  reason: UnavailabilityReason;
  note: string | null;
  maintenanceLogId: string | null;
  car: { id: string; brand: string; model: string; licensePlate: string | null };
  createdAt: string;
};

export function listAvailability(params: {
  carId?: string; from?: string; to?: string;
} = {}) {
  return req<{ items: UnavailabilityRow[] }>(`/provider/availability${qs(params)}`);
}
export function createAvailabilityBlock(payload: {
  carId: string;
  startAt: string;
  endAt: string;
  reason?: UnavailabilityReason;
  note?: string;
}) {
  return req<{ block: UnavailabilityRow }>(`/provider/availability`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function deleteAvailabilityBlock(id: string) {
  return req<{ ok: true }>(`/provider/availability/${id}`, { method: "DELETE" });
}

// ─── Handovers ────────────────────────────────────────────────────────────
export type HandoverType = "PICKUP" | "RETURN";
export type HandoverRow = {
  id: string;
  bookingId: string;
  type: HandoverType;
  odometerKm: number;
  fuelLevel: number;
  exteriorNotes: string | null;
  interiorNotes: string | null;
  damagesFound: boolean;
  photos: string[];
  signedByCustomer: boolean;
  performedByStaffId: string | null;
  createdAt: string;
};

export function listHandovers(bookingId: string) {
  return req<{ items: HandoverRow[] }>(`/provider/bookings/${bookingId}/handovers`);
}
export function saveHandover(bookingId: string, payload: {
  type: HandoverType;
  odometerKm: number;
  fuelLevel: number;
  exteriorNotes?: string;
  interiorNotes?: string;
  damagesFound?: boolean;
  photos?: string[];
  signedByCustomer?: boolean;
}) {
  return req<{ handover: HandoverRow }>(`/provider/bookings/${bookingId}/handovers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Damage claims ────────────────────────────────────────────────────────
export type DamageClaimStatus = "OPEN" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";
export type DamageClaimRow = {
  id: string;
  bookingId: string;
  description: string;
  estimatedCost: number;
  currency: string;
  photos: string[];
  status: DamageClaimStatus;
  resolutionNote: string | null;
  fine: { id: string; amount: number; status: string } | null;
  booking: {
    id: string; pickupAt: string; returnAt: string;
    user: { firstName: string; lastName: string; email: string } | null;
    car: { brand: string; model: string; licensePlate: string | null };
  };
  createdAt: string;
};
export function listDamages(params: { status?: DamageClaimStatus | "" } = {}) {
  return req<{ items: DamageClaimRow[] }>(`/provider/damages${qs(params as any)}`);
}
export function createDamage(payload: {
  bookingId: string;
  description: string;
  estimatedCost: number;
  currency?: string;
  photos?: string[];
}) {
  return req<{ claim: DamageClaimRow }>(`/provider/damages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function updateDamage(id: string, payload: Partial<{
  description: string;
  estimatedCost: number;
  photos: string[];
  status: "OPEN" | "UNDER_REVIEW" | "CANCELLED";
  resolutionNote: string;
}>) {
  return req<{ claim: DamageClaimRow }>(`/provider/damages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ─── Refund requests ──────────────────────────────────────────────────────
export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";
export type RefundRow = {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  providerResponse: string | null;
  adminNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  booking: {
    id: string; pickupAt: string; returnAt: string; totalPrice: number; currency: string;
    car: { brand: string; model: string };
  };
  user: { firstName: string; lastName: string; email: string };
};
export function listRefunds(params: { status?: RefundStatus | "" } = {}) {
  return req<{ items: RefundRow[] }>(`/provider/refunds${qs(params as any)}`);
}
export function respondRefund(id: string, decision: "APPROVED" | "REJECTED", providerResponse: string) {
  return req<{ request: RefundRow }>(`/provider/refunds/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ decision, providerResponse }),
  });
}

// ─── Add-ons ──────────────────────────────────────────────────────────────
export type AddOnUnit = "PER_RENTAL" | "PER_DAY" | "PER_HOUR";
export type AddOnRow = {
  id: string;
  name: string;
  description: string | null;
  pricePerUnit: number;
  currency: string;
  unit: AddOnUnit;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export function listAddons() {
  return req<{ items: AddOnRow[] }>(`/provider/addons`);
}
export function createAddon(payload: {
  name: string;
  description?: string;
  pricePerUnit: number;
  currency?: string;
  unit?: AddOnUnit;
  isActive?: boolean;
}) {
  return req<{ addon: AddOnRow }>(`/provider/addons`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function updateAddon(id: string, payload: Partial<AddOnRow>) {
  return req<{ addon: AddOnRow }>(`/provider/addons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
export function deleteAddon(id: string) {
  return req<{ ok: true }>(`/provider/addons/${id}`, { method: "DELETE" });
}

// ─── Support ──────────────────────────────────────────────────────────────
export type SupportCategory = "ACCOUNT" | "PAYOUTS" | "BOOKINGS" | "DOCUMENTS" | "TECHNICAL" | "OTHER";
export type SupportStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type SupportRow = {
  id: string;
  subject: string;
  message: string;
  category: SupportCategory;
  status: SupportStatus;
  adminReply: string | null;
  adminReplyAt: string | null;
  adminReplyBy: string | null;
  createdAt: string;
  updatedAt: string;
};
export function listSupportTickets(params: { status?: SupportStatus | "" } = {}) {
  return req<{ items: SupportRow[] }>(`/provider/support-tickets${qs(params as any)}`);
}
export function createSupportTicket(payload: {
  subject: string;
  message: string;
  category?: SupportCategory;
}) {
  return req<{ ticket: SupportRow }>(`/provider/support-tickets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function closeSupportTicket(id: string) {
  return req<{ ticket: SupportRow }>(`/provider/support-tickets/${id}/close`, { method: "POST" });
}

// ─── Reviews ──────────────────────────────────────────────────────────────
export type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  userDisplayName: string | null;
  createdAt: string;
  car: { id: string; brand: string; model: string; licensePlate: string | null };
  user: { firstName: string; lastName: string };
  booking: { id: string; pickupAt: string; returnAt: string };
};
export function listProviderReviews(params: { carId?: string } = {}) {
  return req<{
    items: ReviewRow[];
    summary: { count: number; average: number; breakdown: { rating: number; count: number }[] };
  }>(`/provider/reviews${qs(params)}`);
}

// ─── Analytics ────────────────────────────────────────────────────────────
export type ProviderAnalytics = {
  days: number;
  fleet: { total: number };
  bookings: { total: number; completed: number; cancelled: number; cancellationRate: number };
  revenue: { total: number };
  utilisation: number;
  reviews: { average: number; count: number };
  topCars: {
    carId: string;
    _count: number;
    _sum: { totalPrice: number | null };
    car: { id: string; brand: string; model: string; licensePlate: string | null } | null;
  }[];
};
export function getProviderAnalytics(days = 30) {
  return req<ProviderAnalytics>(`/provider/analytics${qs({ days })}`);
}

// ─── Settings (push notifications) ────────────────────────────────────────
export function getProviderNotificationSettings() {
  return req<{ settings: { pushNotificationsEnabled: boolean } }>(`/provider/settings/notifications`);
}
export function updateProviderNotificationSettings(payload: { pushNotificationsEnabled: boolean }) {
  return req<{ settings: { pushNotificationsEnabled: boolean } }>(`/provider/settings/notifications`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ─── Notifications inbox (uses existing /notifications endpoints) ─────────
export type NotificationRow = {
  id: string;
  event: string;
  title: string;
  body: string;
  data: any;
  readAt: string | null;
  createdAt: string;
};
export function listNotifications(params: { limit?: number; unreadOnly?: boolean } = {}) {
  const p: Record<string, string | number | undefined> = {};
  if (params.limit) p.limit = params.limit;
  if (params.unreadOnly) p.unreadOnly = "true";
  return req<{ items: NotificationRow[]; unreadCount: number }>(`/notifications${qs(p)}`);
}
export function markNotificationRead(id: string) {
  return req<{ ok: true }>(`/notifications/${id}/read`, { method: "PATCH" });
}
export function markAllNotificationsRead() {
  return req<{ ok: true }>(`/notifications/read-all`, { method: "POST" });
}
export function deleteNotification(id: string) {
  return req<{ ok: true }>(`/notifications/${id}`, { method: "DELETE" });
}

// ─── Business hours ───────────────────────────────────────────────────────
export type BusinessHoursDay = {
  dayOfWeek: number; // 1=Mon .. 7=Sun
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
};
export type BusinessHoursResponse = {
  timezone: string;
  isAlways247: boolean;
  hours: BusinessHoursDay[];
};
export function getBusinessHours() {
  return req<BusinessHoursResponse>(`/provider/business-hours`);
}
export function saveBusinessHours(payload: BusinessHoursResponse) {
  return req<{ ok: true }>(`/provider/business-hours`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ─── Customer fines (provider issues to customers) ────────────────────────
export type CustomerFineRow = {
  id: string;
  reference: string | null;
  amount: number;
  currency: string;
  category: ProviderFineCategory;
  status: ProviderFineStatus;
  reason: string;
  adminNote: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  booking: {
    id: string;
    pickupAt: string;
    returnAt: string;
    car: { brand: string; model: string; licensePlate: string | null } | null;
  } | null;
};
export type CustomerFinesResponse = {
  items: CustomerFineRow[];
  meta: { page: number; limit: number; total: number; pages: number };
  summary: { openCount: number; outstandingAmount: number; dueThisWeek: number; overdue: number };
};
export function listCustomerFines(params: {
  q?: string;
  status?: ProviderFineStatus | "";
  page?: number;
  limit?: number;
} = {}) {
  return req<CustomerFinesResponse>(`/provider/customer-fines${qs(params as any)}`);
}
export function issueCustomerFine(payload: {
  bookingId: string;
  amount: number;
  currency?: string;
  category: ProviderFineCategory;
  reason: string;
  adminNote?: string;
  dueDate?: string;
}) {
  return req<{ fine: CustomerFineRow }>(`/provider/customer-fines`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function resolveCustomerFine(id: string, status: "PAID" | "WAIVED", adminNote?: string) {
  return req<{ fine: CustomerFineRow }>(`/provider/customer-fines/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNote }),
  });
}
