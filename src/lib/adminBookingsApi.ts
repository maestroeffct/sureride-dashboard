import { apiRequest } from "@/src/lib/api";

export type AdminBookingDetail = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  paymentStatus: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  paymentGatewayKey: string | null;
  paymentReference: string | null;
  paymentError: string | null;
  paidAt: string | null;
  totalPrice: number;
  basePrice: number;
  insuranceFee: number;
  platformFee: number;
  providerEarning: number;
  depositAmount: number;
  currency: string;
  pricingUnit: string;
  collectionCode: string | null;
  pickupAt: string;
  returnAt: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneCountry: string | null;
    phoneNumber: string | null;
    profileStatus: string | null;
  } | null;
  car: {
    id: string;
    brand: string;
    model: string;
    category: string | null;
    transmission: string | null;
    location: {
      id: string;
      name: string | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
    } | null;
    provider: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    } | null;
    images: Array<{ url: string }>;
  } | null;
  insurance: { id: string; name: string } | null;
};

export function getAdminBooking(bookingId: string) {
  return apiRequest<AdminBookingDetail>(`/admin/bookings/${bookingId}`);
}

export type AdminBookingRow = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  paymentStatus: string;
  paymentMethod: string | null;
  totalPrice: number;
  basePrice: number;
  insuranceFee: number;
  currency: string;
  collectionCode: string | null;
  pickupAt: string;
  returnAt: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneCountry: string | null;
    phoneNumber: string | null;
  } | null;
  car: {
    id: string;
    brand: string;
    model: string;
    category: string | null;
    transmission: string | null;
    location: { name: string | null; address: string | null } | null;
    provider: { id: string; name: string } | null;
    images: Array<{ url: string }>;
  } | null;
  insurance: { id: string; name: string } | null;
};

type AdminBookingsResponse = {
  items: AdminBookingRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export function listAdminBookings(params: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 50));

  return apiRequest<AdminBookingsResponse>(
    `/admin/bookings?${search.toString()}`,
  );
}

export function cancelAdminBooking(bookingId: string) {
  return apiRequest<{ message: string }>(`/admin/bookings/${bookingId}/cancel`, {
    method: "PATCH",
  });
}
