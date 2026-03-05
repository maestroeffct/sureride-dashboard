"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Download, Flag, Search } from "lucide-react";
import toast from "react-hot-toast";
import { listCars } from "@/src/lib/carsApi";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";
import type { DashboardCarStatus, RentalCarRow } from "@/src/types/rentalCar";

type ViewMode = "all" | "pending" | "flagged";

export default function CarsManagementView({ mode }: { mode: ViewMode }) {
  const [cars, setCars] = useState<RentalCarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [city, setCity] = useState("");

  const title =
    mode === "all"
      ? "All Cars"
      : mode === "pending"
      ? "Pending Car Approval"
      : "Flagged Cars";

  const subtitle =
    mode === "all"
      ? "Monitor all cars across providers"
      : mode === "pending"
      ? "Cars awaiting moderation/approval"
      : "Cars that require review or action";

  const loadCars = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await listCars();
      setCars(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load cars";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCars();
  }, [loadCars]);

  const visibleCars = useMemo(() => {
    const modeStatus: DashboardCarStatus | "" =
      mode === "all" ? "" : mode === "pending" ? "pending" : "flagged";

    return cars.filter((car) => {
      if (modeStatus && car.dashboardStatus !== modeStatus) return false;
      if (status && car.dashboardStatus !== status) return false;

      const matchSearch = `${car.brand} ${car.model} ${car.providerName}`
        .toLowerCase()
        .includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (
        provider &&
        !car.providerName.toLowerCase().includes(provider.toLowerCase())
      ) {
        return false;
      }

      if (city && !car.city.toLowerCase().includes(city.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [cars, city, mode, provider, search, status]);

  const onAction = (label: string, carId: string) => {
    toast(
      `${label} for ${carId}. Backend action endpoint is still required for this operation.`,
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.subtitle}>{subtitle}</p>
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
                <button style={styles.exportItem}>Export CSV</button>
                <button style={styles.exportItem}>Export PDF</button>
              </div>
            )}
          </div>

          <Link href="/rentals/cars/new" style={styles.addCarButton}>
            + Add Car
          </Link>
        </div>
      </div>

      <div style={styles.filtersRow}>
        <div style={styles.searchBox}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cars / provider"
            style={styles.searchInput}
          />
          <div style={styles.searchIconWrap}>
            <Search size={18} />
          </div>
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>

        <input
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="Provider"
          style={styles.selectLikeInput}
        />

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          style={styles.selectLikeInput}
        />
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>S/N</th>
                <th style={styles.th}>Car</th>
                <th style={styles.th}>Provider</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Pricing</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    Loading cars...
                  </td>
                </tr>
              ) : visibleCars.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    No cars found for this view.
                  </td>
                </tr>
              ) : (
                visibleCars.map((car, index) => (
                  <tr key={car.id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>
                          {car.brand} {car.model}
                        </span>
                        <span style={styles.secondaryText}>
                          {car.category} {car.year ? `• ${car.year}` : ""}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>{car.providerName}</span>
                        <span style={styles.secondaryText}>{car.providerStatus}</span>
                      </div>
                    </td>

                    <td style={styles.td}>{car.locationName}</td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>
                          {car.dailyRate != null
                            ? `NGN ${car.dailyRate.toLocaleString()}/day`
                            : "-"}
                        </span>
                        <span style={styles.secondaryText}>
                          {car.hourlyRate != null
                            ? `NGN ${car.hourlyRate.toLocaleString()}/hour`
                            : "-"}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusPill,
                          ...(car.dashboardStatus === "active"
                            ? styles.statusActive
                            : car.dashboardStatus === "pending"
                            ? styles.statusPending
                            : styles.statusFlagged),
                        }}
                      >
                        {car.dashboardStatus}
                      </span>
                    </td>

                    <td style={styles.tdRight}>
                      <div style={styles.actions}>
                        {car.dashboardStatus !== "active" ? (
                          <button
                            style={styles.iconBtn}
                            onClick={() => onAction("Approve", car.id)}
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                        ) : (
                          <button
                            style={styles.iconBtn}
                            onClick={() => onAction("Flag", car.id)}
                            title="Flag"
                          >
                            <Flag size={16} />
                          </button>
                        )}
                      </div>
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1280,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "var(--foreground)",
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "var(--fg-60)",
  },
  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  exportWrap: {
    position: "relative",
  },
  exportButton: {
    height: 44,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontWeight: 600,
  },
  exportDropdown: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 180,
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "rgba(16,18,24,0.98)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
    overflow: "hidden",
    zIndex: 50,
  },
  exportItem: {
    width: "100%",
    padding: "12px 12px",
    textAlign: "left",
    border: "none",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
  },
  addCarButton: {
    padding: "10px 14px",
    background: "#2563EB",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 500,
    cursor: "pointer",
  },
  filtersRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  searchBox: {
    height: 48,
    width: 440,
    maxWidth: "100%",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--foreground)",
    padding: "0 14px",
    fontSize: 14,
  },
  searchIconWrap: {
    width: 52,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderLeft: "1px solid var(--glass-10)",
    color: "var(--fg-80)",
  },
  select: {
    height: 44,
    minWidth: 140,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },
  selectLikeInput: {
    height: 44,
    minWidth: 140,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },
  card: bookingsTableTheme.card,
  tableWrap: bookingsTableTheme.tableWrap,
  table: bookingsTableTheme.table,
  trHead: bookingsTableTheme.theadRow,
  th: bookingsTableTheme.th,
  thRight: bookingsTableTheme.thRight,
  tr: bookingsTableTheme.tr,
  td: bookingsTableTheme.td,
  tdRight: bookingsTableTheme.tdRight,
  twoLine: bookingsTableTheme.twoLine,
  primaryText: bookingsTableTheme.primaryText,
  secondaryText: bookingsTableTheme.secondaryText,
  iconBtn: bookingsTableTheme.iconBtn,
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  emptyCell: bookingsTableTheme.emptyCell,
  statusPill: bookingsTableTheme.statusPill,
  statusActive: {
    background: "rgba(34,197,94,0.14)",
    color: "#86EFAC",
    border: "1px solid rgba(34,197,94,0.22)",
  },
  statusPending: {
    background: "rgba(250,204,21,0.14)",
    color: "#FDE68A",
    border: "1px solid rgba(250,204,21,0.22)",
  },
  statusFlagged: {
    background: "rgba(239,68,68,0.14)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },
};
