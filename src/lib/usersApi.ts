import { apiRequest } from "@/src/lib/api";
import type {
  AdminUser,
  PaginatedAdminUsers,
  UserProfileStatus,
} from "@/src/types/adminUser";

export type ListAdminUsersParams = {
  q?: string;
  profileStatus?: UserProfileStatus;
  isVerified?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type CreateAdminUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneCountry: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  isActive?: boolean;
  isVerified?: boolean;
  profileStatus?: UserProfileStatus;
  sendInvite?: boolean;
};

export type CreateAdminUserResponse = {
  message: string;
  user: AdminUser;
  inviteEmailSent: boolean;
  temporaryPasswordGenerated: boolean;
};

function makeQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function createAdminUser(payload: CreateAdminUserPayload) {
  return apiRequest<CreateAdminUserResponse>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAdminUsers(params: ListAdminUsersParams = {}) {
  const query = makeQuery({
    q: params.q,
    profileStatus: params.profileStatus,
    isVerified: params.isVerified,
    isActive: params.isActive,
    page: params.page,
    limit: params.limit,
  });

  return apiRequest<PaginatedAdminUsers>(`/admin/users${query}`);
}

export async function getAdminUser(userId: string) {
  return apiRequest<AdminUser>(`/admin/users/${userId}`);
}

export async function updateAdminUserStatus(userId: string, isActive: boolean) {
  return apiRequest<{ message: string; user: AdminUser }>(
    `/admin/users/${userId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
  );
}

export async function updateAdminUserVerification(
  userId: string,
  payload: { isVerified: boolean; profileStatus?: UserProfileStatus },
) {
  return apiRequest<{ message: string; user: AdminUser }>(
    `/admin/users/${userId}/verification`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateAdminUserProfileStatus(
  userId: string,
  profileStatus: UserProfileStatus,
) {
  return apiRequest<{ message: string; user: AdminUser }>(
    `/admin/users/${userId}/profile-status`,
    {
      method: "PATCH",
      body: JSON.stringify({ profileStatus }),
    },
  );
}

export async function approveAdminUserKyc(userId: string) {
  return apiRequest<{ message: string; user: AdminUser }>(
    `/admin/users/${userId}/kyc/approve`,
    {
      method: "PATCH",
    },
  );
}

export async function rejectAdminUserKyc(userId: string, reason: string) {
  return apiRequest<{ message: string; user: AdminUser }>(
    `/admin/users/${userId}/kyc/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
  );
}
