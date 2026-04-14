"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, CheckCircle, Clock, Filter } from "lucide-react";
import { apiRequest } from "@/src/lib/api";
import type { CSSProperties } from "react";

/* ─── Types ──────────────────────────────────────────────── */

type PayoutStatus = "PENDING" | "PAID";

type PayoutRow = {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  reference: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    name: string;
    email: string | null;
    payoutAccount: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      currency: string;
      isVerified: boolean;
    } | null;
  } | null;
};

type PayoutsResponse = {
  items: PayoutRow[];
  meta: { page: number; limit: number; total: number; pages: number };
};

/* ─── API ────────────────────────────────────────────────── */

function listPayouts(status?: string) {
  const q = new URLSearchParams({ limit: "200" });
  if (status) q.set("status", status);
  return apiRequest<PayoutsResponse>(`/admin/payouts?${q}`);
}

function markPaid(payoutId: string, reference: string) {
  return apiRequest<{ message: string; payout: PayoutRow }>(`/admin/payouts/${payoutId}/paid`, {
    method: "PATCH",
    body: JSON.stringify({ reference }),
  });
}

/* ─── Helpers ────────────────────────────────────────────── */

function fmtMoney(v: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(v);
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PAID", label: "Paid" },
] as const;

/* ─── Page ───────────────────────────────────────────────── */

export default function PayoutsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ALL" | PayoutStatus>("ALL");
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listPayouts()
      .then((res) => setRows(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (tab === "ALL" ? rows : rows.filter((r) => r.status === tab)),
    [rows, tab]
  );

  const totals = useMemo(() => {
    const pending = rows.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.amount, 0);
    const paid = rows.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amount, 0);
    return { pending, paid };
  }, [rows]);

  const handleMarkPaid = async (row: PayoutRow) => {
    const ref = window.prompt(
      `Mark payout for ${row.provider?.name ?? "provider"} as paid.\nEnter payment reference (optional):`,
      ""
    );
    if (ref === null) return; // cancelled
    setMarkingId(row.id);
    try {
      await markPaid(row.id, ref);
      load();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to mark as paid");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <div style={s.titleRow}>
            <DollarSign size={18} style={{ color: "var(--fg-85)" }} />
            <h1 style={s.pageTitle}>Provider Payouts</h1>
            <span style={s.countBadge}>{filtered.length}</span>
          </div>
          <p style={s.pageSub}>Manage and track all provider payout requests</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={s.kpiRow}>
        <div style={s.kpiCard}>
          <Clock size={16} style={{ color: "#FBBF24" }} />
          <div>
            <div style={s.kpiLabel}>Pending Payouts</div>
            <div style={{ ...s.kpiValue, color: "#FBBF24" }}>{fmtMoney(totals.pending)}</div>
          </div>
        </div>
        <div style={s.kpiCard}>
          <CheckCircle size={16} style={{ color: "#34D399" }} />
          <div>
            <div style={s.kpiLabel}>Total Paid Out</div>
            <div style={{ ...s.kpiValue, color: "#34D399" }}>{fmtMoney(totals.paid)}</div>
          </div>
        </div>
        <div style={s.kpiCard}>
          <Filter size={16} style={{ color: "#A78BFA" }} />
          <div>
            <div style={s.kpiLabel}>Pending Count</div>
            <div style={{ ...s.kpiValue, color: "#A78BFA" }}>
              {rows.filter((r) => r.status === "PENDING").length} requests
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabsRow}>
        {STATUS_TABS.map((t) => {
          const count = t.key === "ALL" ? rows.length : rows.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span style={{ ...s.tabCount, ...(tab === t.key ? s.tabCountActive : {}) }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={s.card}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.trHead}>
                <th style={s.th}>#</th>
                <th style={s.th}>Provider</th>
                <th style={s.th}>Bank Account</th>
                <th style={s.thRight}>Amount</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Reference</th>
                <th style={s.th}>Note</th>
                <th style={s.th}>Date</th>
                <th style={s.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} style={s.tr}>
                  <td style={s.td}>{i + 1}</td>

                  <td style={s.td}>
                    <div style={s.twoLine}>
                      <button
                        style={s.providerLink}
                        onClick={() => router.push(`/rentals/providers/${row.provider?.id}`)}
                      >
                        {row.provider?.name ?? "—"}
                      </button>
                      <span style={s.secondaryText}>{row.provider?.email ?? "—"}</span>
                    </div>
                  </td>

                  <td style={s.td}>
                    {row.provider?.payoutAccount ? (
                      <div style={s.twoLine}>
                        <span style={s.primaryText}>{row.provider.payoutAccount.accountName}</span>
                        <span style={s.secondaryText}>
                          {row.provider.payoutAccount.bankName} · {row.provider.payoutAccount.accountNumber}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#EF4444", fontSize: 12 }}>No account set</span>
                    )}
                  </td>

                  <td style={s.tdRight}>
                    <span style={s.amountValue}>{fmtMoney(row.amount, row.currency)}</span>
                  </td>

                  <td style={s.td}>
                    <span
                      style={{
                        ...s.statusPill,
                        ...(row.status === "PAID" ? s.statusPaid : s.statusPending),
                      }}
                    >
                      {row.status === "PAID" ? "Paid" : "Pending"}
                    </span>
                  </td>

                  <td style={s.td}>
                    <span style={s.secondaryText}>{row.reference ?? "—"}</span>
                  </td>

                  <td style={s.td}>
                    <span style={s.secondaryText}>{row.note ?? "—"}</span>
                  </td>

                  <td style={s.td}>
                    <span style={s.secondaryText}>{fmt(row.createdAt)}</span>
                  </td>

                  <td style={s.tdRight}>
                    {row.status === "PENDING" && (
                      <button
                        style={{
                          ...s.markPaidBtn,
                          opacity: markingId === row.id ? 0.5 : 1,
                          cursor: markingId === row.id ? "not-allowed" : "pointer",
                        }}
                        disabled={markingId === row.id}
                        onClick={() => handleMarkPaid(row)}
                      >
                        <CheckCircle size={14} />
                        {markingId === row.id ? "Saving…" : "Mark Paid"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td style={s.emptyCell} colSpan={9}>Loading payouts…</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td style={s.emptyCell} colSpan={9}>No payouts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const s: Record<string, CSSProperties> = {
  page: { width: "100%", maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 },
  headerRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "var(--foreground)" },
  pageSub: { margin: "4px 0 0", fontSize: 13, color: "var(--fg-65)" },
  countBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    color: "var(--foreground)", background: "var(--glass-08)", border: "1px solid var(--glass-08)",
  },

  kpiRow: { display: "flex", gap: 16 },
  kpiCard: {
    flex: 1, display: "flex", alignItems: "center", gap: 14,
    padding: "16px 20px", borderRadius: 14, background: "var(--glass-04)", border: "1px solid var(--glass-08)",
  },
  kpiLabel: { fontSize: 12, color: "var(--fg-60)" },
  kpiValue: { fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums" },

  tabsRow: { display: "flex", gap: 10 },
  tab: {
    height: 38, padding: "0 14px", borderRadius: 999, border: "1px solid var(--glass-10)",
    background: "var(--glass-04)", color: "var(--foreground)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600,
  },
  tabActive: { background: "var(--glass-10)", border: "1px solid var(--glass-14)" },
  tabCount: {
    minWidth: 24, height: 22, borderRadius: 999, padding: "0 6px",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, background: "var(--glass-08)", color: "var(--fg-85)",
  },
  tabCountActive: { background: "rgba(58,237,225,0.18)", border: "1px solid rgba(58,237,225,0.25)" },

  card: { borderRadius: 16, background: "var(--glass-04)", border: "1px solid var(--glass-08)", overflow: "hidden" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900 },
  trHead: { background: "var(--glass-03)" },
  th: { textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--fg-65)", padding: "12px 16px", borderBottom: "1px solid var(--glass-08)", whiteSpace: "nowrap" },
  thRight: { textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--fg-65)", padding: "12px 16px", borderBottom: "1px solid var(--glass-08)", whiteSpace: "nowrap" },
  tr: {},
  td: { padding: "14px 16px", fontSize: 13, color: "var(--fg-85)", borderBottom: "1px solid var(--glass-06)", verticalAlign: "middle" },
  tdRight: { padding: "14px 16px", fontSize: 13, textAlign: "right", borderBottom: "1px solid var(--glass-06)", verticalAlign: "middle" },
  twoLine: { display: "flex", flexDirection: "column", gap: 3 },
  primaryText: { fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  secondaryText: { fontSize: 12, color: "var(--fg-55)" },
  amountValue: { fontSize: 14, fontWeight: 800, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" },
  providerLink: { background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 700, color: "#3AEDE1", cursor: "pointer", textAlign: "left" },
  statusPill: {
    display: "inline-flex", alignItems: "center", height: 26, padding: "0 10px",
    borderRadius: 999, fontSize: 11, fontWeight: 800,
  },
  statusPending: { background: "rgba(251,191,36,0.14)", color: "#FCD34D", border: "1px solid rgba(251,191,36,0.22)" },
  statusPaid: { background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.22)" },
  markPaidBtn: {
    display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px",
    borderRadius: 8, border: "1px solid rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.1)",
    color: "#34D399", fontSize: 12, fontWeight: 600,
  },
  emptyCell: { padding: 22, textAlign: "center", color: "var(--fg-65)", fontSize: 13 },
};
