export type UserProfileStatus =
  | "INCOMPLETE"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export type UserKycStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED";

export type UserKycRecord = {
  id?: string;
  status?: UserKycStatus;
  rejectionReason?: string | null;

  passportPhotoUrl?: string | null;
  governmentIdFrontUrl?: string | null;
  governmentIdBackUrl?: string | null;
  driverLicenseFrontUrl?: string | null;
  driverLicenseBackUrl?: string | null;

  governmentIdType?: string | null;
  governmentIdNumber?: string | null;
  driverLicenseNumber?: string | null;
  driverLicenseExpiry?: string | null;

  [key: string]: unknown;
};

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  isVerified: boolean;
  isActive: boolean;
  profileStatus: UserProfileStatus;
  createdAt: string;
  updatedAt: string;
  kyc?: UserKycRecord | null;
};

export type PaginatedAdminUsers = {
  items: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
