import { apiRequest } from "@/src/lib/api";

export type AdminFinanceTrendPoint = {
  date: string;
  revenue: number;
  bookings: number;
};

export type AdminFinanceTopProvider = {
  providerId: string;
  providerName: string;
  gross: number;
  bookingCount: number;
};

export type AdminFinanceOverview = {
  summary: {
    totalBookings: number;
    paidBookings: number;
    completedBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    grossVolume: number;
    platformFees: number;
    providerEarnings: number;
    pendingPaymentAmount: number;
    refundedAmount: number;
    pendingPayouts: {
      amount: number;
      count: number;
    };
    commissionRate: number;
  };
  recentTrend: AdminFinanceTrendPoint[];
  topProviders: AdminFinanceTopProvider[];
};

export function getAdminFinanceOverview() {
  return apiRequest<AdminFinanceOverview>("/admin/finance/overview");
}
