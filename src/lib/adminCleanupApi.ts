import { apiRequest } from "@/src/lib/api";

export type CleanupTaskId =
  | "expired-sessions"
  | "expired-otps"
  | "unverified-accounts"
  | "cancelled-bookings";

export type CleanupCounts = Record<string, number>;

export type CleanupPreview = {
  id: CleanupTaskId;
  title: string;
  counts: CleanupCounts;
};

export type CleanupRunResult = {
  id: CleanupTaskId;
  title: string;
  deleted: CleanupCounts;
  runAt: string;
};

export async function listCleanupPreviews() {
  return apiRequest<{ items: CleanupPreview[] }>("/admin/platform/cleanup");
}

export async function runCleanupTask(taskId: CleanupTaskId) {
  return apiRequest<CleanupRunResult>(`/admin/platform/cleanup/${taskId}`, {
    method: "POST",
  });
}
