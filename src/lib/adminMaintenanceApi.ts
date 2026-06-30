import { apiRequest } from "@/src/lib/api";

export type WipeableTableGroup =
  | "Identity"
  | "Catalog"
  | "Bookings"
  | "Payments"
  | "Notifications"
  | "Promotions"
  | "Services";

export type WipeableTable = {
  name: string;
  label: string;
  group: WipeableTableGroup;
  count: number;
  /** Tables that will also be wiped (via cascade or explicit expansion). */
  cascadesTo: string[];
};

export async function listWipeableTables() {
  return apiRequest<{ items: WipeableTable[] }>("/admin/maintenance/tables");
}

export type WipeResult = {
  deleted: Record<string, number>;
  effectiveTables: string[];
  totalRows: number;
};

export async function wipeTables(tables: string[]) {
  return apiRequest<WipeResult>("/admin/maintenance/wipe", {
    method: "POST",
    body: JSON.stringify({ tables, confirm: "WIPE" }),
  });
}

// ── Audit Log ────────────────────────────────────────────────────────────

export type AuditLogRow = {
  id: string;
  adminId: string | null;
  adminEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  summary: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AuditListResponse = {
  items: AuditLogRow[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export async function listAuditLog(params: {
  q?: string;
  action?: string;
  adminId?: string;
  targetType?: string;
  page?: number;
  limit?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.action) qs.set("action", params.action);
  if (params.adminId) qs.set("adminId", params.adminId);
  if (params.targetType) qs.set("targetType", params.targetType);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const s = qs.toString();
  return apiRequest<AuditListResponse>(`/admin/audit-log${s ? `?${s}` : ""}`);
}
