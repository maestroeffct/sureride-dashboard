"use client";

import React, { useMemo, useState } from "react";
import styles from "./styles";
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Search,
  Eye,
  MoreHorizontal,
} from "lucide-react";

type BookingStatus =
  | "Upcoming"
  | "Active"
  | "Completed"
  | "Cancelled"
  | "Issue"
  | "Pending";

type PaymentStatus = "Paid" | "Pending" | "Failed" | "Refunded";

type BookingRow = {
  id: string;
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

export default function RentalBookingsPage() {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]["key"]>("All");
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  // Dummy data (replace later with API)
  const rows: BookingRow[] = useMemo(
    () => [
      {
        id: "RB-100031",
        createdAt: "2025-12-11T09:14:00.000Z",
        customerName: "Precious Omokhaiye",
        customerPhone: "+234 907 844 2536",
        carName: "Toyota Corolla",
        carMeta: "Economy • Automatic",
        providerName: "Sixt Rentals",
        providerMeta: "Lagos – Ikeja",
        pickupAt: "2025-12-23T09:00:00.000Z",
        returnAt: "2025-12-24T09:00:00.000Z",
        amount: 168000,
        currency: "NGN",
        paymentStatus: "Paid",
        status: "Completed",
      },
      {
        id: "RB-100032",
        createdAt: "2025-12-12T12:02:00.000Z",
        customerName: "Wole A.",
        customerPhone: "+234 901 234 5678",
        carName: "Ford Figo",
        carMeta: "Compact • Manual",
        providerName: "Hertz",
        providerMeta: "Lagos – VI",
        pickupAt: "2025-12-26T10:00:00.000Z",
        returnAt: "2025-12-28T10:00:00.000Z",
        amount: 117000,
        currency: "NGN",
        paymentStatus: "Pending",
        status: "Upcoming",
      },
      {
        id: "RB-100033",
        createdAt: "2025-12-12T16:44:00.000Z",
        customerName: "Darlene Roberts",
        customerPhone: "+234 809 555 1122",
        carName: "BMW 523",
        carMeta: "Luxury • Automatic",
        providerName: "Local Vendor",
        providerMeta: "Abuja – Garki",
        pickupAt: "2025-12-20T08:00:00.000Z",
        returnAt: "2025-12-22T08:00:00.000Z",
        amount: 420000,
        currency: "NGN",
        paymentStatus: "Paid",
        status: "Active",
      },
      {
        id: "RB-100034",
        createdAt: "2025-12-10T21:30:00.000Z",
        customerName: "Arlene McCoy",
        customerPhone: "+234 813 222 4567",
        carName: "MG 750",
        carMeta: "Standard • Automatic",
        providerName: "Sixt Rentals",
        providerMeta: "Lagos – Ikeja",
        pickupAt: "2025-12-18T10:00:00.000Z",
        returnAt: "2025-12-18T20:00:00.000Z",
        amount: 168000,
        currency: "NGN",
        paymentStatus: "Failed",
        status: "Issue",
      },
      {
        id: "RB-100035",
        createdAt: "2025-12-09T10:10:00.000Z",
        customerName: "John Doe",
        customerPhone: "+234 700 000 0000",
        carName: "Hyundai Tucson",
        carMeta: "SUV • Automatic",
        providerName: "Hertz",
        providerMeta: "Lagos – Lekki",
        pickupAt: "2025-12-15T10:00:00.000Z",
        returnAt: "2025-12-16T10:00:00.000Z",
        amount: 250000,
        currency: "NGN",
        paymentStatus: "Refunded",
        status: "Cancelled",
      },
    ],
    []
  );

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
                        <button style={styles.iconAction} title="More">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td style={styles.emptyCell} colSpan={11}>
                    No bookings found for this filter/search.
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
