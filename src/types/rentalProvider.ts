export type ProviderStatus = "active" | "pending" | "suspended";

export interface RentalProvider {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state?: string;
  totalCars: number;
  activeCars: number;
  pendingCars: number;
  status: ProviderStatus;
  joinedOn: string; // ISO date
}

export type ProviderDraftStatus = "draft" | "pending";

export type StepKey =
  | "business"
  | "contact"
  | "location"
  | "documents"
  | "financials"
  | "review";

export interface ProviderDraftForm {
  // Step 1
  businessName: string;
  businessType: "" | "Individual" | "Company" | "Fleet";

  // Step 2
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string; // store full incl. +234

  contactCountry: string; // "Nigeria"
  contactDialCode: string; // "+234"

  // Step 3
  country: string;
  state: string;
  city: string;
  zones: string[];

  // Step 4 (placeholders)
  regCert?: File | null;
  govId?: File | null;

  // Step 5 (placeholders)
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;

  // Step 6
  agreeTerms: boolean;
  confirmAccurate: boolean;
}

export type ProviderRequestStatus = "Pending" | "Approved" | "Rejected";

export type ProviderRequestRow = {
  id: string;
  businessName: string;
  businessType: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
  status: ProviderRequestStatus;
};
