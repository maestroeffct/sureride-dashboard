export type DashboardCarStatus = "active" | "pending" | "flagged";

export type BackendCarStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "FLAGGED";

export type RentalCarRow = {
  id: string;
  brand: string;
  model: string;
  category: string;
  year: number | null;
  seats: number | null;
  transmission: string;
  dailyRate: number | null;
  hourlyRate: number | null;
  isActive: boolean;
  providerId: string;
  providerName: string;
  providerStatus: string;
  locationId: string;
  locationName: string;
  city: string;
  imageUrl: string;
  createdAt: string;
  dashboardStatus: DashboardCarStatus;
  backendStatus: BackendCarStatus;
  moderationNote: string | null;
  flaggedReason: string | null;
};

export type RawCarApi = {
  id: string;
  brand?: string;
  model?: string;
  category?: string;
  year?: number;
  seats?: number;
  transmission?: string;
  dailyRate?: number;
  hourlyRate?: number | null;
  isActive?: boolean;
  createdAt?: string;
  status?: BackendCarStatus;
  moderationNote?: string | null;
  flaggedReason?: string | null;
  provider?: {
    id?: string;
    name?: string;
    status?: string;
  };
  location?: {
    id?: string;
    name?: string;
    address?: string;
  };
  images?: Array<{
    id?: string;
    url?: string;
    isPrimary?: boolean;
  }>;
};
