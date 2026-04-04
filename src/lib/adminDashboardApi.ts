import { apiRequest } from "@/src/lib/api";

export type AdminOverviewTrendPoint = {
  label: string;
  value: number;
};

export type AdminOverviewActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
  value?: number;
};

export type AdminOverviewResponse = {
  stats: {
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    totalProviders: number;
    activeProviders: number;
    pendingProviders: number;
    totalCars: number;
    activeCars: number;
    pendingCars: number;
    flaggedCars: number;
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    pendingProviderRequests: number;
    totalRevenue: number;
    currentMonthRevenue: number;
  };
  charts: {
    bookingsTrend: AdminOverviewTrendPoint[];
    usersTrend: AdminOverviewTrendPoint[];
    providersTrend: AdminOverviewTrendPoint[];
    revenueTrend: AdminOverviewTrendPoint[];
    bookingStatusBreakdown: AdminOverviewTrendPoint[];
    fleetStatusBreakdown: AdminOverviewTrendPoint[];
  };
  recent: {
    users: AdminOverviewActivityItem[];
    providers: AdminOverviewActivityItem[];
    cars: AdminOverviewActivityItem[];
    bookings: AdminOverviewActivityItem[];
    providerRequests: AdminOverviewActivityItem[];
  };
};

export function getAdminOverview() {
  return apiRequest<AdminOverviewResponse>("/admin/dashboard/overview");
}
