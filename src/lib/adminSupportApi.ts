import { apiRequest } from "@/src/lib/api";

export type SupportCategory =
  | "ACCOUNT" | "PAYOUTS" | "BOOKINGS" | "DOCUMENTS" | "TECHNICAL" | "OTHER";
export type SupportStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type SupportAuthor = "PROVIDER" | "ADMIN";

export type AdminSupportMessage = {
  id: string;
  author: SupportAuthor;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  attachments: string[];
  createdAt: string;
};

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
  _count?: { messages: number };
};

export type AdminSupportRowWithThread = AdminSupportRow & {
  messages: AdminSupportMessage[];
};

export function listAdminSupportTickets(params: { status?: SupportStatus | "" } = {}) {
  const q = params.status ? `?status=${params.status}` : "";
  return apiRequest<{ items: AdminSupportRow[] }>(`/admin/support-tickets${q}`);
}

export function getAdminSupportTicket(id: string) {
  return apiRequest<{ ticket: AdminSupportRowWithThread }>(
    `/admin/support-tickets/${id}`,
  );
}

export function postAdminSupportMessage(id: string, body: string) {
  return apiRequest<{ ticket: AdminSupportRowWithThread }>(
    `/admin/support-tickets/${id}/messages`,
    { method: "POST", body: JSON.stringify({ body }) },
  );
}
