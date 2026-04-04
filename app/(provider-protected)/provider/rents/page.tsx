"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import {
  listProviderBookings,
  type ProviderBookingRow,
} from "@/src/lib/providerApi";

export default function ProviderRentsPage() {
  const [rows, setRows] = useState<ProviderBookingRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const response = await listProviderBookings({
            q: query.trim() || undefined,
            status: status || undefined,
            page: 1,
            limit: 100,
          });
          setRows(response.items);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load provider rents",
          );
        } finally {
          setLoading(false);
        }
      })();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, status]);

  const totalRevenue = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + (row.paymentStatus === "SUCCEEDED" ? row.totalPrice : 0),
        0,
      ),
    [rows],
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rent Monitoring</h1>
          <p style={styles.subtitle}>
            {rows.length.toLocaleString()} bookings • NGN {totalRevenue.toLocaleString()} settled
          </p>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} />
          <input
            style={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by booking, renter, or car"
          />
        </div>

        <select
          style={styles.select}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Booking</th>
              <th style={styles.th}>Renter</th>
              <th style={styles.th}>Car</th>
              <th style={styles.th}>Schedule</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={styles.empty}>
                  Loading rents...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.empty}>
                  No bookings found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{row.id}</strong>
                      <span style={styles.muted}>
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{row.customerName}</strong>
                      <span style={styles.muted}>{row.customerEmail}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{row.carName}</strong>
                      <span style={styles.muted}>{row.carMeta}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{new Date(row.pickupAt).toLocaleString()}</strong>
                      <span style={styles.muted}>
                        Return {new Date(row.returnAt).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>NGN {row.totalPrice.toLocaleString()}</strong>
                      <span style={styles.muted}>{row.paymentStatus}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={statusPill(row.status)}>{row.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusPill(status: string): React.CSSProperties {
  if (status === "COMPLETED") {
    return { ...styles.pill, background: "rgba(34,197,94,0.14)", color: "#86EFAC" };
  }
  if (status === "CONFIRMED") {
    return { ...styles.pill, background: "rgba(59,130,246,0.14)", color: "#93C5FD" };
  }
  if (status === "CANCELLED") {
    return { ...styles.pill, background: "rgba(239,68,68,0.14)", color: "#FCA5A5" };
  }
  return { ...styles.pill, background: "rgba(250,204,21,0.14)", color: "#FDE68A" };
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1280 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: "6px 0 0", color: "var(--fg-60)", fontSize: 13 },
  filters: { display: "flex", gap: 12, flexWrap: "wrap" },
  searchBox: {
    flex: "1 1 320px",
    minWidth: 260,
    height: 46,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    color: "var(--fg-60)",
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 14,
  },
  select: {
    height: 46,
    minWidth: 220,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    padding: "0 14px",
    fontSize: 14,
  },
  card: {
    borderRadius: 18,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: 12,
    color: "var(--fg-60)",
    borderBottom: "1px solid var(--input-border)",
  },
  td: {
    padding: "16px",
    borderBottom: "1px solid var(--input-border)",
    verticalAlign: "top",
  },
  twoLine: { display: "flex", flexDirection: "column", gap: 6 },
  muted: { fontSize: 13, color: "var(--fg-60)" },
  pill: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  empty: { padding: 28, textAlign: "center", color: "var(--fg-60)" },
};
