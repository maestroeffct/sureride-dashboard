import { apiRequest } from "@/src/lib/api";

export type AdminInboxNotification = {
  id: string;
  adminId: string | null;
  userId: string | null;
  providerId: string | null;
  event: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type AdminInboxResponse = {
  items: AdminInboxNotification[];
  unreadCount: number;
};

export async function listAdminNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<AdminInboxResponse> {
  const query: string[] = [];
  if (params?.limit) query.push(`limit=${params.limit}`);
  if (params?.unreadOnly) query.push("unreadOnly=true");
  const suffix = query.length > 0 ? `?${query.join("&")}` : "";
  return apiRequest<AdminInboxResponse>(`/admin/notifications${suffix}`);
}

export async function markAdminNotificationRead(id: string) {
  return apiRequest<AdminInboxNotification>(
    `/admin/notifications/${id}/read`,
    { method: "PATCH" },
  );
}

export async function markAllAdminNotificationsRead() {
  return apiRequest<{ updated: number }>("/admin/notifications/read-all", {
    method: "POST",
  });
}

export async function deleteAdminNotification(id: string) {
  return apiRequest<{ deleted: true }>(`/admin/notifications/${id}`, {
    method: "DELETE",
  });
}
