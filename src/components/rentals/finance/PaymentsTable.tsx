"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Search,
  RotateCw,
  Receipt,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  adminListPaymentTransactions,
  type PaymentStatus,
  type PaymentTransactionRow,
} from "@/src/lib/financeApi";
import { downloadCsv, downloadPdf } from "@/src/lib/exportTable";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";

type Variant = "payments" | "invoices";

/**
 * Shared table component used by both Finance > Payments (all transactions)
 * and Finance > Invoices (SUCCEEDED only — treated as receipts). The two
 * surfaces share the same backend; the variant just preselects filters and
 * tweaks the copy.
 */
export default function PaymentsTable({
  variant,
}: {
  variant: Variant;
}) {
  const [rows, setRows] = useState<PaymentTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">(
    variant === "invoices" ? "SUCCEEDED" : "",
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListPaymentTransactions({
        status: statusFilter,
        limit: 100,
      });
      setRows(res.items);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load transactions",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim();
      const car = `${r.car?.brand ?? ""} ${r.car?.model ?? ""}`.trim();
      return (
        r.id.toLowerCase().includes(q) ||
        r.paymentReference?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        car.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  // KPI numbers — derived from the loaded set so they always reconcile with
  // what's on screen even when a filter is applied.
  const kpis = useMemo(() => {
    let succeeded = 0;
    let pending = 0;
    let failed = 0;
    let succeededValue = 0;
    for (const r of rows) {
      if (r.paymentStatus === "SUCCEEDED") {
        succeeded += 1;
        succeededValue += r.totalPrice;
      } else if (
        r.paymentStatus === "PROCESSING" ||
        r.paymentStatus === "REQUIRES_ACTION" ||
        r.paymentStatus === "UNPAID"
      ) {
        pending += 1;
      } else if (r.paymentStatus === "FAILED" || r.paymentStatus === "CANCELED") {
        failed += 1;
      }
    }
    const sample = rows.find((r) => r.currency)?.currency?.toUpperCase() ?? "NGN";
    return { total: rows.length, succeeded, pending, failed, succeededValue, currency: sample };
  }, [rows]);

  const exportHeaders = [
    "Transaction ID",
    "Date",
    "Customer",
    "Email",
    "Car",
    "Provider",
    "Gateway",
    "Reference",
    "Amount",
    "Currency",
    "Payment Status",
    "Booking Status",
    "Paid At",
  ];
  const exportRows = () =>
    filtered.map((r) => [
      r.id,
      new Date(r.createdAt).toISOString().slice(0, 10),
      `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim(),
      r.user?.email ?? "",
      `${r.car?.brand ?? ""} ${r.car?.model ?? ""}`.trim(),
      r.paymentProvider ?? "",
      r.paymentGatewayKey ?? "",
      r.paymentReference ?? "",
      r.totalPrice,
      r.currency ?? "",
      r.paymentStatus,
      r.status,
      r.paidAt ?? "",
    ]);

  const baseName = variant === "invoices" ? "sureride-invoices" : "sureride-payments";
  const exportTitle = variant === "invoices" ? "Invoices" : "Payments";

  const handleExportCsv = () => {
    if (filtered.length === 0) return toast.error("Nothing to export");
    downloadCsv(baseName, exportHeaders, exportRows());
  };
  const handleExportPdf = () => {
    if (filtered.length === 0) return toast.error("Nothing to export");
    downloadPdf(baseName, exportTitle, exportHeaders, exportRows());
  };

  const title = variant === "invoices" ? "Invoices" : "Payments";
  const subtitle =
    variant === "invoices"
      ? "Receipts for successfully paid bookings. One invoice per paid booking."
      : "Customer payment ledger across all bookings — succeeded, failed, refunded, pending.";

  return (
    <div style={s.page}>
      <div>
        <h1 style={s.title}>
          {variant === "invoices" ? (
            <Receipt size={20} color="var(--brand-secondary)" />
          ) : (
            <CreditCard size={20} color="var(--brand-secondary)" />
          )}{" "}
          {title}
        </h1>
        <p style={s.subtitle}>{subtitle}</p>
      </div>

      {/* KPIs */}
      <KpiGrid>
        <KpiCard
          label="Total"
          value={kpis.total}
          subtext="In current view"
          icon={<CreditCard size={18} />}
          tone="var(--brand-primary)"
        />
        <KpiCard
          label="Succeeded"
          value={kpis.succeeded}
          subtext={`${kpis.currency} ${kpis.succeededValue.toLocaleString()}`}
          icon={<CheckCircle2 size={18} />}
          tone="#22c55e"
        />
        <KpiCard
          label="Pending"
          value={kpis.pending}
          subtext="In-flight"
          icon={<Clock size={18} />}
          tone="#f59e0b"
        />
        <KpiCard
          label="Failed / Canceled"
          value={kpis.failed}
          subtext="Need attention"
          icon={<XCircle size={18} />}
          tone="#ef4444"
        />
      </KpiGrid>

      {/* Filters + actions */}
      <div style={s.filtersRow}>
        <div style={s.searchBox}>
          <Search size={16} color="var(--muted-foreground)" />
          <input
            style={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, email, reference, car…"
          />
        </div>

        {variant === "payments" ? (
          <select
            style={s.select}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target.value as PaymentStatus | "") || "")
            }
          >
            <option value="">All statuses</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="PROCESSING">Processing</option>
            <option value="REQUIRES_ACTION">Requires action</option>
            <option value="UNPAID">Unpaid</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELED">Canceled</option>
          </select>
        ) : null}

        <button
          type="button"
          className="hover-soft"
          style={s.iconBtn}
          onClick={() => void load()}
          title="Refresh"
        >
          <RotateCw size={15} />
        </button>
        <button
          type="button"
          className="hover-soft"
          style={s.outlineBtn}
          onClick={handleExportCsv}
        >
          Export CSV
        </button>
        <button
          type="button"
          className="hover-soft"
          style={s.outlineBtn}
          onClick={handleExportPdf}
        >
          Export PDF
        </button>
      </div>

      {/* Table */}
      <div style={s.card}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                <th style={s.th}>
                  {variant === "invoices" ? "Invoice #" : "Reference"}
                </th>
                <th style={s.th}>Customer</th>
                <th style={s.th}>Car</th>
                <th style={s.th}>Gateway</th>
                <th style={s.thRight}>Amount</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={s.empty}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={s.empty}>
                    {variant === "invoices"
                      ? "No paid bookings yet."
                      : "No transactions yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} style={s.tr}>
                    <td style={{ ...s.td, ...s.mono }}>
                      {r.paymentReference ?? r.id.slice(0, 10).toUpperCase()}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong>
                          {r.user?.firstName} {r.user?.lastName}
                        </strong>
                        <span style={s.muted}>{r.user?.email}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      {r.car ? `${r.car.brand} ${r.car.model}` : "—"}
                    </td>
                    <td style={s.td}>
                      <span style={s.gatewayChip}>
                        {(r.paymentProvider ?? r.paymentGatewayKey ?? "—").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...s.tdRight, fontWeight: 700 }}>
                      {fmtAmount(r.totalPrice, r.currency)}
                    </td>
                    <td style={s.td}>
                      <span style={statusPill(r.paymentStatus)}>
                        {r.paymentStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={s.td}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmtAmount(value: number | null | undefined, currency?: string | null) {
  if (value == null) return "—";
  const code = (currency ?? "NGN").toUpperCase();
  return `${code} ${Number(value).toLocaleString()}`;
}

function statusPill(status: PaymentStatus): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
  };
  switch (status) {
    case "SUCCEEDED":
      return {
        ...base,
        background: "rgba(34,197,94,0.16)",
        color: "#86EFAC",
        border: "1px solid rgba(34,197,94,0.35)",
      };
    case "PROCESSING":
    case "REQUIRES_ACTION":
    case "UNPAID":
      return {
        ...base,
        background: "rgba(250,204,21,0.16)",
        color: "#FDE68A",
        border: "1px solid rgba(250,204,21,0.35)",
      };
    case "FAILED":
    case "CANCELED":
      return {
        ...base,
        background: "rgba(239,68,68,0.16)",
        color: "#FCA5A5",
        border: "1px solid rgba(239,68,68,0.35)",
      };
  }
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1280 },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 750,
    letterSpacing: -0.4,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "var(--muted-foreground)",
    fontSize: 13,
    maxWidth: 720,
  },

  filtersRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    flex: "1 1 280px",
    minWidth: 240,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 14,
  },
  select: {
    height: 44,
    minWidth: 160,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    fontSize: 13,
    outline: "none",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtn: {
    height: 44,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    overflow: "hidden",
  },
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    minWidth: 960,
    borderCollapse: "collapse",
  },
  theadRow: { background: "var(--surface-2)" },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid var(--input-border)",
  },
  thRight: {
    textAlign: "right",
    padding: "14px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    borderBottom: "1px solid var(--input-border)",
  },
  tr: { borderBottom: "1px solid var(--input-border)" },
  td: { padding: "14px 16px", fontSize: 13, color: "var(--foreground)" },
  tdRight: {
    padding: "14px 16px",
    fontSize: 13,
    color: "var(--foreground)",
    textAlign: "right",
  },
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 },
  muted: { color: "var(--muted-foreground)", fontSize: 12 },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "var(--muted-foreground)",
    fontSize: 13,
  },
  gatewayChip: {
    padding: "3px 8px",
    borderRadius: 6,
    background: "var(--surface-2)",
    color: "var(--muted-foreground)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
};
