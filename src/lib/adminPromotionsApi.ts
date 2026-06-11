import { apiRequest } from "@/src/lib/api";

export type PromoPushSegment = "ALL_USERS" | "ALL_PROVIDERS" | "EVERYONE";

export type SendPromoPushPayload = {
  title: string;
  body: string;
  segment: PromoPushSegment;
  deepLink?: string;
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
