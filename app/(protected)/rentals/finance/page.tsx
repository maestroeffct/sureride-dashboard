"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  Users,
  Clock,
  XCircle,
} from "lucide-react";
import {
  getAdminFinanceOverview,
  type AdminFinanceOverview,
  type AdminFinanceTrendPoint,
} from "@/src/lib/adminFinanceApi";
import type { CSSProperties } from "react";

/* ─── Helpers ─────────────────────────────────────────────── */

function fmtMoney(v: number) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

/* ─── Stat Card ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, background: accent + "22", color: accent }}>
        {icon}
      </div>
      <div style={s.statBody}>
        <span style={s.statLabel}>{label}</span>
        <span style={s.statValue}>{value}</span>
        {sub && <span style={s.statSub}>{sub}</span>}
      </div>
    </div>
  );
}

/* ─── Mini bar chart ─────────────────────────────────────── */

function TrendChart({ data }: { data: AdminFinanceTrendPoint[] }) {
  if (!data.length) {
    return <div style={s.chartEmpty}>No trend data yet</div>;
  }

  const maxRev = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div style={s.chartWrap}>
      {data.map((d, i) => {
        const height = Math.max(4, (d.revenue / maxRev) * 100);
        return (
          <div key={i} style={s.chartBarCol} title={`${d.date}: ${fmtMoney(d.revenue)}`}>
            <div
              style={{
                ...s.chartBar,
                height: `${height}%`,
                background:
                  i === data.length - 1
                    ? "#3AEDE1"
                    : "rgba(58,237,225,0.35)",
              }}
            />
            {i % 5 === 0 && (
              <span style={s.chartLabel}>{d.date.slice(5)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function FinanceOverviewPage() {
  const [data, setData] = useState<AdminFinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminFinanceOverview()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <span style={{ color: "var(--fg-65)", fontSize: 14 }}>Loading finance data…</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={s.page}>
        <div style={s.loadingWrap}>
          <span style={{ color: "#EF4444", fontSize: 14 }}>Failed to load finance overview.</span>
        </div>
      </div>
    );
  }

  const { summary, recentTrend, topProviders } = data;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <div style={s.titleRow}>
            <TrendingUp size={18} style={{ color: "var(--fg-85)" }} />
            <h1 style={s.pageTitle}>Finance Overview</h1>
          </div>
          <p style={s.pageSub}>
            Platform earnings, provider payouts, and booking revenue
          </p>
        </div>
        <div style={s.commBadge}>
          Commission Rate: {fmtPct(summary.commissionRate)}
        </div>
      </div>

      {/* KPI Grid */}
      <div style={s.statsGrid}>
        <StatCard
          label="Gross Booking Volume"
          value={fmtMoney(summary.grossVolume)}
          sub={`${summary.paidBookings} paid bookings`}
          icon={<DollarSign size={20} />}
          accent="#3AEDE1"
        />
        <StatCard
          label="Platform Fees Collected"
          value={fmtMoney(summary.platformFees)}
          sub={`${fmtPct(summary.commissionRate)} of gross`}
          icon={<ArrowUpRight size={20} />}
          accent="#A78BFA"
        />
        <StatCard
          label="Provider Earnings"
          value={fmtMoney(summary.providerEarnings)}
          sub="After platform fee"
          icon={<Users size={20} />}
          accent="#34D399"
        />
        <StatCard
          label="Pending Payment"
          value={fmtMoney(summary.pendingPaymentAmount)}
          sub={`${summary.pendingBookings + summary.confirmedBookings} unpaid bookings`}
          icon={<Clock size={20} />}
          accent="#FBBF24"
        />
        <StatCard
          label="Cancelled / Refunded"
          value={fmtMoney(summary.refundedAmount)}
          sub={`${summary.cancelledBookings} cancelled bookings`}
          icon={<XCircle size={20} />}
          accent="#F87171"
        />
        <StatCard
          label="Pending Provider Payouts"
          value={fmtMoney(summary.pendingPayouts.amount)}
          sub={`${summary.pendingPayouts.count} payout requests`}
          icon={<AlertCircle size={20} />}
          accent="#FB923C"
        />
      </div>

      {/* Booking status breakdown */}
      <div style={s.row}>
        <div style={{ ...s.card, flex: 1 }}>
          <div style={s.cardHeader}>
            <CreditCard size={16} style={{ color: "var(--fg-65)" }} />
            <span style={s.cardTitle}>Booking Status Breakdown</span>
          </div>
          <div style={s.cardBody}>
            {[
              { label: "Completed", count: summary.completedBookings, color: "#34D399" },
              { label: "Confirmed / Upcoming", count: summary.confirmedBookings, color: "#93C5FD" },
              { label: "Pending", count: summary.pendingBookings, color: "#FDE68A" },
              { label: "Cancelled", count: summary.cancelledBookings, color: "#FCA5A5" },
            ].map((row) => {
              const pct =
                summary.totalBookings > 0
                  ? (row.count / summary.totalBookings) * 100
                  : 0;
              return (
                <div key={row.label} style={s.breakdownRow}>
                  <div style={s.breakdownLeft}>
                    <span
                      style={{
                        ...s.breakdownDot,
                        background: row.color,
                      }}
                    />
                    <span style={s.breakdownLabel}>{row.label}</span>
                  </div>
                  <div style={s.breakdownRight}>
                    <span style={s.breakdownCount}>{row.count}</span>
                    <div style={s.breakdownBar}>
                      <div
                        style={{
                          ...s.breakdownFill,
                          width: `${pct}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                    <span style={s.breakdownPct}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Trend */}
        <div style={{ ...s.card, flex: 2 }}>
          <div style={s.cardHeader}>
            <TrendingUp size={16} style={{ color: "var(--fg-65)" }} />
            <span style={s.cardTitle}>Revenue Trend — Last 30 Days</span>
          </div>
          <div style={{ ...s.cardBody, height: 200 }}>
            <TrendChart data={recentTrend} />
          </div>
        </div>
      </div>

      {/* Top Providers */}
      {topProviders.length > 0 && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <Users size={16} style={{ color: "var(--fg-65)" }} />
            <span style={s.cardTitle}>Top Providers by Revenue</span>
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.trHead}>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Provider</th>
                  <th style={s.thRight}>Bookings</th>
                  <th style={s.thRight}>Gross Revenue</th>
                  <th style={s.thRight}>Platform Fee ({fmtPct(summary.commissionRate)})</th>
                  <th style={s.thRight}>Provider Earnings</th>
                </tr>
              </thead>
              <tbody>
                {topProviders.map((p, i) => {
                  const fee = p.gross * summary.commissionRate;
                  const earnings = p.gross - fee;
                  return (
                    <tr key={p.providerId} style={s.tr}>
                      <td style={s.td}>{i + 1}</td>
                      <td style={s.tdStrong}>{p.providerName}</td>
                      <td style={s.tdRight}>{p.bookingCount}</td>
                      <td style={s.tdRight}>{fmtMoney(p.gross)}</td>
                      <td style={{ ...s.tdRight, color: "#A78BFA" }}>{fmtMoney(fee)}</td>
                      <td style={{ ...s.tdRight, color: "#34D399" }}>{fmtMoney(earnings)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const s: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 60,
  },
  spinner: {
    width: 24,
    height: 24,
    border: "3px solid var(--glass-10)",
    borderTopColor: "#3AEDE1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  /* header */
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  pageSub: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "var(--fg-65)",
  },
  commBadge: {
    padding: "8px 14px",
    borderRadius: 10,
    background: "rgba(167,139,250,0.1)",
    border: "1px solid rgba(167,139,250,0.22)",
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: 700,
    marginTop: 4,
  },

  /* stat grid */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "18px 20px",
    borderRadius: 16,
    background: "var(--glass-04)",
    border: "1px solid var(--glass-08)",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statBody: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
    fontWeight: 500,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "var(--foreground)",
    fontVariantNumeric: "tabular-nums",
  },
  statSub: {
    fontSize: 11,
    color: "var(--fg-55)",
  },

  /* card */
  row: {
    display: "flex",
    gap: 18,
    alignItems: "stretch",
  },
  card: {
    borderRadius: 16,
    background: "var(--glass-04)",
    border: "1px solid var(--glass-08)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 20px",
    borderBottom: "1px solid var(--glass-08)",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  cardBody: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  /* breakdown */
  breakdownRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  breakdownLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 160,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "var(--fg-80)",
  },
  breakdownRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  breakdownCount: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--foreground)",
    minWidth: 30,
    textAlign: "right",
  },
  breakdownBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: "var(--glass-08)",
    overflow: "hidden",
  },
  breakdownFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.4s ease",
  },
  breakdownPct: {
    fontSize: 12,
    color: "var(--fg-55)",
    minWidth: 32,
    textAlign: "right",
  },

  /* chart */
  chartWrap: {
    display: "flex",
    alignItems: "flex-end",
    gap: 3,
    height: "100%",
    paddingBottom: 20,
  },
  chartBarCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    position: "relative",
    gap: 4,
  },
  chartBar: {
    width: "100%",
    minHeight: 4,
    borderRadius: "3px 3px 0 0",
    transition: "height 0.3s ease",
  },
  chartLabel: {
    position: "absolute",
    bottom: -18,
    fontSize: 10,
    color: "var(--fg-45)",
    whiteSpace: "nowrap",
  },
  chartEmpty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    fontSize: 13,
    color: "var(--fg-55)",
  },

  /* table */
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  trHead: {
    background: "var(--glass-03)",
  },
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-65)",
    padding: "12px 16px",
    borderBottom: "1px solid var(--glass-08)",
    whiteSpace: "nowrap",
  },
  thRight: {
    textAlign: "right",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-65)",
    padding: "12px 16px",
    borderBottom: "1px solid var(--glass-08)",
    whiteSpace: "nowrap",
  },
  tr: {},
  td: {
    padding: "14px 16px",
    fontSize: 13,
    color: "var(--fg-85)",
    borderBottom: "1px solid var(--glass-06)",
  },
  tdStrong: {
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--foreground)",
    borderBottom: "1px solid var(--glass-06)",
  },
  tdRight: {
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--foreground)",
    textAlign: "right",
    borderBottom: "1px solid var(--glass-06)",
    fontVariantNumeric: "tabular-nums",
  },
};
