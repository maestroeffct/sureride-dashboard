import { apiRequest } from "@/src/lib/api";

// User-facing notification API. Works with either a USER or PROVIDER token —
// the backend route accepts both via dual auth.

export type NotificationRow = {
  id: string;
  userId: string | null;
  providerId: string | null;
  event: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type ListNotificationsResponse = {
  items: NotificationRow[];
  unreadCount: number;
};

export type ListNotificationsParams = {
  limit?: number;
  unreadOnly?: boolean;
};

function buildQuery(params: ListNotificationsParams) {
  const parts: string[] = [];
  if (params.limit) parts.push(`limit=${encodeURIComponent(params.limit)}`);
  if (params.unreadOnly) parts.push("unreadOnly=true");
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function listMyNotifications(params: ListNotificationsParams = {}) {
  return apiRequest<ListNotificationsResponse>(`/notifications${buildQuery(params)}`);
}

export async function markNotificationRead(id: string) {
  return apiRequest<NotificationRow>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>(`/notifications/read-all`, {
    method: "POST",
  });
}

export async function deleteNotification(id: string) {
  return apiRequest<{ deleted: boolean }>(`/notifications/${id}`, {
    method: "DELETE",
  });
}

// ── Device registration (for mobile apps wanting push) ──────────────────────

export type RegisterDevicePayload = {
  token: string;
  platform: "ANDROID" | "IOS" | "WEB";
  label?: string;
};

export async function registerDevice(payload: RegisterDevicePayload) {
  return apiRequest<{
    id: string;
    token: string;
    platform: string;
  }>(`/notifications/devices`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function unregisterDevice(token: string) {
  return apiRequest<{ deleted: number }>(
    `/notifications/devices/${encodeURIComponent(token)}`,
    { method: "DELETE" },
  );
}
