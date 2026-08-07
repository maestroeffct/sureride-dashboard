import { apiRequest } from "@/src/lib/api";

export type PromoPushSegment = "ALL_USERS" | "ALL_PROVIDERS" | "EVERYONE";

export type SendPromoPushPayload = {
  title: string;
  body: string;
  segment: PromoPushSegment;
  deepLink?: string;
  /** Public HTTPS URL from uploadPromoPushImage. Backend forwards this
   *  as notification.image (Android bigPicture / iOS attachment). */
  imageUrl?: string;
};

export type SendPromoPushResult = {
  sent: number;
  failed: number;
  totalDevices: number;
  entry?: {
    id: string;
    title: string;
    body: string;
    segment: PromoPushSegment;
    deepLink: string | null;
    sent: number;
    failed: number;
    totalDevices: number;
    sentAt: string;
  };
  message?: string;
};

export async function sendPromoPush(payload: SendPromoPushPayload) {
  return apiRequest<SendPromoPushResult>("/admin/promotions/push/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Uploads an image via the admin's active storage driver and returns
 * the public URL to attach to the push. 5MB cap; FCM's own limit sits
 * around 1MB so keep artwork tight.
 */
export async function uploadPromoPushImage(file: File): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<{ url: string; key: string }>(
    "/admin/promotions/push/upload-image",
    { method: "POST", body: form },
  );
}
