"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./styles";
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Search,
  Eye,
  XCircle,
} from "lucide-react";
import { listAdminBookings, cancelAdminBooking, type AdminBookingRow } from "@/src/lib/adminBookingsApi";

type BookingStatus =
  | "Upcoming"
  | "Active"
  | "Completed"
  | "Cancelled"
  | "Issue"
  | "Pending";

type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";

type BookingRow = {
  id: string;       // short display ID (first 8 chars)
  fullId: string;   // full UUID for API calls
  createdAt: string; // ISO
  customerName: string;
  customerPhone: string;
  carName: string;
  carMeta: string; // "Economy • Automatic"
  providerName: string;
  providerMeta: string; // "Lagos – Ikeja"
  pickupAt: string; // ISO
  returnAt: string; // ISO
  amount: number;
  currency: "NGN";
  paymentStatus: PaymentStatus;
  status: BookingStatus;
};

const STATUS_TABS: Array<{ key: "All" | BookingStatus; label: string }> = [
  { key: "All", label: "All" },
  { key: "Upcoming", label: "Upcoming" },
  { key: "Active", label: "Active" },
  { key: "Completed", label: "Completed" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "Issue", label: "Issues" },
];

function formatDate(d: Date) {
  // 23 Dec 2025
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  // 10:00 AM
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount: number, currency: "NGN") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusPillStyle(status: BookingStatus) {
  const base = styles.statusPill;
  const map: Record<BookingStatus, React.CSSProperties> = {
    Pending: styles.statusPending,
    Upcoming: styles.statusUpcoming,
    Active: styles.statusActive,
    Completed: styles.statusCompleted,
    Cancelled: styles.statusCancelled,
    Issue: styles.statusIssue,
  };
  return { ...base, ...map[status] };
}

function getPaymentStyle(p: PaymentStatus) {
  const base = styles.paymentText;
  const map: Record<PaymentStatus, React.CSSProperties> = {
    Paid: styles.paymentPaid,
    Pending: styles.paymentPending,
    Failed: styles.paymentFailed,
    Refunded: styles.paymentRefunded,
  };
  return { ...base, ...map[p] };
}

function mapApiRow(r: AdminBookingRow): BookingRow {
  const firstName = r.user?.firstName?.trim() || "";
  const lastName = r.user?.lastName?.trim() || "";
  const customerName = `${firstName} ${lastName}`.trim() || r.user?.email || "Unknown";
  const customerPhone =
    `${r.user?.phoneCountry || ""} ${r.user?.phoneNumber || ""}`.trim() || "-";
  const carName = r.car ? `${r.car.brand} ${r.car.model}` : "—";
  const carMeta = [r.car?.category, r.car?.transmission].filter(Boolean).join(" • ") || "—";
  const providerName = r.car?.provider?.name || "—";
  const providerMeta = r.car?.location?.name || r.car?.location?.address || "—";

  const paymentStatusMap: Record<string, PaymentStatus> = {
    SUCCEEDED: "Paid",
    UNPAID: "Pending",
    PROCESSING: "Pending",
    REQUIRES_ACTION: "Pending",
    FAILED: "Failed",
    CANCELED: "Refunded",
  };
  const paymentStatus: PaymentStatus = paymentStatusMap[r.paymentStatus] ?? "Pending";

  const statusMap: Record<string, BookingStatus> = {
    PENDING: "Pending",
    CONFIRMED: "Upcoming",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  const status: BookingStatus = statusMap[r.status] ?? "Pending";

  return {
    id: r.id.slice(0, 8).toUpperCase(),
    fullId: r.id,
    createdAt: r.createdAt,
    customerName,
    customerPhone,
    carName,
    carMeta,
    providerName,
    providerMeta,
    pickupAt: r.pickupAt,
    returnAt: r.returnAt,
    amount: r.totalPrice,
    currency: "NGN",
    paymentStatus,
    status,
  };
}

export default function RentalBookingsPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]["key"]>("All");
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [apiRows, setApiRows] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = React.useCallback(() => {
    void (async () => {
      try {
        setLoading(true);
        const res = await listAdminBookings({ q: query || undefined, limit: 200 });
        setApiRows(res.items);
      } catch {
        // silently keep previous data
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  useEffect(() => {
    const t = window.setTimeout(loadBookings, 300);
    return () => window.clearTimeout(t);
  }, [loadBookings]);

  const handleCancelBooking = async (fullId: string, shortId: string) => {
    if (!window.confirm(`Cancel booking ${shortId}? This cannot be undone.`)) return;
    setCancellingId(fullId);
    try {
      await cancelAdminBooking(fullId);
      loadBookings();
    } catch (err: any) {
      window.alert(err?.message ?? "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const rows: BookingRow[] = useMemo(() => apiRows.map(mapApiRow), [apiRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesTab =
        tab === "All" ? true : (r.status as BookingStatus) === tab;

      const matchesQuery =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.carName.toLowerCase().includes(q) ||
        r.providerName.toLowerCase().includes(q);

      return matchesTab && matchesQuery;
    });
  }, [rows, tab, query]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { All: rows.length };
    for (const t of STATUS_TABS) {
      if (t.key !== "All")
        base[t.key] = rows.filter((r) => r.status === t.key).length;
    }
    return base;
  }, [rows]);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <div style={styles.pageTitleRow}>
            <Calendar size={18} style={styles.pageTitleIcon} />
            <h1 style={styles.pageTitle}>Rental Bookings</h1>
            <span style={styles.countBadge}>{filtered.length}</span>
          </div>
          <p style={styles.pageSubtitle}>Manage all rental reservations</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.exportWrap}>
            <button
              type="button"
              style={styles.exportButton}
              onClick={() => setExportOpen((v) => !v)}
            >
              <Download size={16} />
              <span>Export</span>
              <ChevronDown size={16} />
            </button>

            {exportOpen && (
              <div style={styles.exportDropdown}>
                <button
                  style={styles.exportItem}
                  onClick={() => setExportOpen(false)}
                >
                  Export CSV
                </button>
                <button
                  style={styles.exportItem}
                  onClick={() => setExportOpen(false)}
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>

          <button type="button" style={styles.filtersButton}>
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* STATUS TABS */}
      <div style={styles.tabsRow}>
        {STATUS_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                ...styles.tab,
                ...(active ? styles.tabActive : {}),
              }}
            >
              <span style={styles.tabLabel}>{t.label}</span>
              <span
                style={{
                  ...styles.tabCount,
                  ...(active ? styles.tabCountActive : {}),
                }}
              >
                {counts[t.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* CARD */}
      <div style={styles.card}>
        {/* SEARCH ROW */}
        <div style={styles.searchRow}>
          <div style={styles.searchBox}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bookings..."
              style={styles.searchInput}
            />
            <div style={styles.searchIconWrap}>
              <Search size={18} />
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* TABLE */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>SL</th>
                <th style={styles.th}>Booking ID</th>
                <th style={styles.th}>Booking Date</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Car</th>
                <th style={styles.th}>Rental Provider</th>
                <th style={styles.th}>Pickup</th>
                <th style={styles.th}>Return</th>
                <th style={styles.thRight}>Total Amount</th>
                <th style={styles.th}>Booking Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r, idx) => {
                const created = new Date(r.createdAt);
                const pickup = new Date(r.pickupAt);
                const ret = new Date(r.returnAt);

                return (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{idx + 1}</td>

                    <td style={styles.tdStrong}>{r.id}</td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>
                          {formatDate(created)}
                        </span>
                        <span style={styles.secondaryText}>
                          {formatTime(created)}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>{r.customerName}</span>
                        <span style={styles.secondaryText}>
                          {r.customerPhone}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>{r.carName}</span>
                        <span style={styles.secondaryText}>{r.carMeta}</span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>{r.providerName}</span>
                        <span style={styles.secondaryText}>
                          {r.providerMeta}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>
                          {formatDate(pickup)}
                        </span>
                        <span style={styles.secondaryText}>
                          {formatTime(pickup)}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>
                          {formatDate(ret)}
                        </span>
                        <span style={styles.secondaryText}>
                          {formatTime(ret)}
                        </span>
                      </div>
                    </td>

                    <td style={styles.tdRight}>
                      <div style={styles.amountBox}>
                        <span style={styles.amountValue}>
                          {formatMoney(r.amount, r.currency)}
                        </span>
                        <span style={getPaymentStyle(r.paymentStatus)}>
                          {r.paymentStatus}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span style={getStatusPillStyle(r.status)}>
                        {r.status}
                      </span>
                    </td>

                    <td style={styles.tdRight}>
                      <div style={styles.actionsRow}>
                        <button style={styles.iconAction} title="View">
                          <Eye size={18} />
                        </button>
                        {r.status !== "Cancelled" && r.status !== "Completed" && (
                          <button
                            style={{
                              ...styles.iconAction,
                              color: cancellingId === r.fullId ? "#9CA3AF" : "#EF4444",
                              cursor: cancellingId === r.fullId ? "not-allowed" : "pointer",
                            }}
                            title="Cancel Booking"
                            disabled={cancellingId === r.fullId}
                            onClick={() => handleCancelBooking(r.fullId, r.id)}
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td style={styles.emptyCell} colSpan={11}>
                    Loading bookings...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td style={styles.emptyCell} colSpan={11}>
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
