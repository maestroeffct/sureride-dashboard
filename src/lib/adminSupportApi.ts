import { apiRequest } from "@/src/lib/api";

export type SupportCategory =
  | "ACCOUNT" | "PAYOUTS" | "BOOKINGS" | "DOCUMENTS" | "TECHNICAL" | "OTHER";
export type SupportStatus = "OPEN" | "ANSWERED" | "CLOSED";

export type AdminSupportRow = {
  id: string;
  subject: string;
  message: string;
  category: SupportCategory;
  status: SupportStatus;
  adminReply: string | null;
  adminReplyAt: string | null;
  adminReplyBy: string | null;
  createdAt: string;
  updatedAt: string;
  provider: { id: string; name: string; email: string };
};

export function listAdminSupportTickets(params: { status?: SupportStatus | "" } = {}) {
  const q = params.status ? `?status=${params.status}` : "";
  return apiRequest<{ items: AdminSupportRow[] }>(`/admin/support-tickets${q}`);
}

export function replyAdminSupportTicket(id: string, adminReply: string) {
  return apiRequest<{ ticket: AdminSupportRow }>(
    `/admin/support-tickets/${id}/reply`,
    { method: "POST", body: JSON.stringify({ adminReply }) },
  );
}
