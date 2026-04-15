"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Pencil, Search } from "lucide-react";
import { listProviderCars } from "@/src/lib/providerApi";
import type { RentalCarRow } from "@/src/types/rentalCar";

export default function ProviderCarsPage() {
  const [cars, setCars] = useState<RentalCarRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const response = await listProviderCars({
            q: query.trim() || undefined,
            status: status || undefined,
            page: 1,
            limit: 100,
          });
          setCars(response.items);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load provider cars",
          );
        } finally {
          setLoading(false);
        }
      })();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, status]);

  const totalDailyValue = useMemo(
    () =>
      cars.reduce((sum, car) => sum + (typeof car.dailyRate === "number" ? car.dailyRate : 0), 0),
    [cars],
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Fleet Inventory</h1>
          <p style={styles.subtitle}>
            {cars.length.toLocaleString()} cars loaded • NGN {totalDailyValue.toLocaleString()} daily rate value
          </p>
        </div>

        <Link href="/provider/cars/new" style={styles.addButton}>
          Add Car
        </Link>
      </div>

      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} />
          <input
            style={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by brand or model"
          />
        </div>

        <select
          style={styles.select}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="REJECTED">Rejected</option>
          <option value="FLAGGED">Flagged</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Car</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Pricing</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={styles.empty}>
                  Loading cars...
                </td>
              </tr>
            ) : cars.length === 0 ? (
              <tr>
                <td colSpan={4} style={styles.empty}>
                  No cars found.
                </td>
              </tr>
            ) : (
              cars.map((car) => (
                <tr key={car.id}>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{car.brand} {car.model}</strong>
                      <span style={styles.muted}>
                        {car.category} {car.year ? `• ${car.year}` : ""} • {car.transmission}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{car.locationName}</strong>
                      <span style={styles.muted}>{car.city}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>
                        {typeof car.dailyRate === "number"
                          ? `NGN ${car.dailyRate.toLocaleString()}/day`
                          : "-"}
                      </strong>
                      <span style={styles.muted}>
                        {typeof car.hourlyRate === "number"
                          ? `NGN ${car.hourlyRate.toLocaleString()}/hour`
                          : "No hourly rate"}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={statusPill(car.backendStatus)}>{car.backendStatus}</span>
                    {car.moderationNote ? (
                      <p style={styles.note}>{car.moderationNote}</p>
                    ) : null}
                  </td>
                  <td style={{ ...styles.td, width: 52 }}>
                    <Link
                      href={`/provider/cars/${car.id}/edit`}
                      style={styles.editBtn}
                      title="Edit car"
                    >
                      <Pencil size={14} />
                    </Link>
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
  if (status === "APPROVED") {
    return { ...styles.pill, background: "rgba(34,197,94,0.14)", color: "#86EFAC" };
  }
  if (status === "PENDING_APPROVAL") {
    return { ...styles.pill, background: "rgba(250,204,21,0.14)", color: "#FDE68A" };
  }
  if (status === "FLAGGED") {
    return { ...styles.pill, background: "rgba(239,68,68,0.14)", color: "#FCA5A5" };
  }
  if (status === "REJECTED") {
    return { ...styles.pill, background: "rgba(244,63,94,0.14)", color: "#FDA4AF" };
  }
  return { ...styles.pill, background: "rgba(148,163,184,0.14)", color: "#CBD5E1" };
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1280 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: "6px 0 0", color: "var(--fg-60)", fontSize: 13 },
  addButton: {
    padding: "10px 14px",
    background: "var(--brand-primary)",
    color: "#fff",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 700,
  },
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
  note: { margin: "8px 0 0", fontSize: 12, color: "var(--fg-60)" },
  empty: { padding: 28, textAlign: "center", color: "var(--fg-60)" },
  editBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--fg-60)",
    textDecoration: "none",
  },
};
