"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Check,
  ChevronDown,
  Download,
  Flag,
  RotateCcw,
  Search,
  ShieldOff,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  activateAdminCar,
  approveAdminCar,
  deactivateAdminCar,
  flagAdminCar,
  listCars,
  rejectAdminCar,
  unflagAdminCar,
} from "@/src/lib/carsApi";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";
import type { DashboardCarStatus, RentalCarRow } from "@/src/types/rentalCar";

type ViewMode = "all" | "pending" | "flagged";

export default function CarsManagementView({ mode }: { mode: ViewMode }) {
  const [cars, setCars] = useState<RentalCarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

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
        ? "Cars awaiting moderation and approval"
        : "Cars that require review or corrective action";

  const effectiveStatus =
    mode === "pending"
      ? "pending"
      : mode === "flagged"
        ? "flagged"
        : status;

  const loadCars = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listCars({
        q: search.trim() || undefined,
        status: effectiveStatus as DashboardCarStatus | "",
        page: 1,
        limit: 100,
      });
      setCars(response.items);
      setTotal(response.meta.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load cars";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [effectiveStatus, search]);

  useEffect(() => {
    void loadCars();
  }, [loadCars]);

  const visibleCars = useMemo(() => cars, [cars]);

  const runAction = async (
    key: string,
    action: () => Promise<{ message: string } | { message?: string }>,
    successMessage: string,
  ) => {
    try {
      setProcessingId(key);
      const response = await action();
      toast.success(response.message || successMessage);
      await loadCars();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (car: RentalCarRow) => {
    const note = window.prompt("Approval note (optional):", car.moderationNote || "");
    if (note === null) return;

    void runAction(
      `${car.id}:approve`,
      () => approveAdminCar(car.id, note.trim() || undefined),
      "Car approved",
    );
  };

  const handleReject = (car: RentalCarRow) => {
    const reason = window.prompt(
      "Reason for rejection:",
      car.moderationNote || "Car details need review.",
    );
    if (!reason || reason.trim().length < 2) return;

    void runAction(
      `${car.id}:reject`,
      () => rejectAdminCar(car.id, reason.trim()),
      "Car rejected",
    );
  };

  const handleFlag = (car: RentalCarRow) => {
    const reason = window.prompt(
      "Reason for flagging:",
      car.flaggedReason || "This listing needs admin review.",
    );
    if (!reason || reason.trim().length < 2) return;

    void runAction(
      `${car.id}:flag`,
      () => flagAdminCar(car.id, reason.trim()),
      "Car flagged",
    );
  };

  const handleUnflag = (car: RentalCarRow) => {
    const note = window.prompt(
      "Unflag note (optional):",
      car.moderationNote || "Resolved and restored.",
    );
    if (note === null) return;

    void runAction(
      `${car.id}:unflag`,
      () => unflagAdminCar(car.id, note.trim() || undefined),
      "Car unflagged",
    );
  };

  const handleDeactivate = (car: RentalCarRow) => {
    const reason = window.prompt(
      "Reason for deactivation (optional):",
      car.moderationNote || "Temporarily removed from active listings.",
    );
    if (reason === null) return;

    void runAction(
      `${car.id}:deactivate`,
      () => deactivateAdminCar(car.id, reason.trim() || undefined),
      "Car deactivated",
    );
  };

  const handleActivate = (car: RentalCarRow) => {
    void runAction(
      `${car.id}:activate`,
      () => activateAdminCar(car.id),
      "Car activated",
    );
  };

  const renderActions = (car: RentalCarRow) => {
    const isBusy = processingId?.startsWith(car.id);

    if (car.dashboardStatus === "pending") {
      return (
        <div style={styles.actions}>
          <button
            type="button"
            style={{ ...styles.actionBtn, ...styles.approveBtn }}
            onClick={() => handleApprove(car)}
            disabled={Boolean(isBusy)}
            title="Approve"
          >
            <Check size={15} />
            <span>{isBusy ? "Working..." : "Approve"}</span>
          </button>
          <button
            type="button"
            style={{ ...styles.actionBtn, ...styles.rejectBtn }}
            onClick={() => handleReject(car)}
            disabled={Boolean(isBusy)}
            title="Reject"
          >
            <Ban size={15} />
            <span>Reject</span>
          </button>
        </div>
      );
    }

    if (car.dashboardStatus === "flagged") {
      return (
        <div style={styles.actions}>
          <button
            type="button"
            style={{ ...styles.actionBtn, ...styles.restoreBtn }}
            onClick={() => handleUnflag(car)}
            disabled={Boolean(isBusy)}
            title="Unflag"
          >
            <RotateCcw size={15} />
            <span>{isBusy ? "Working..." : "Unflag"}</span>
          </button>
        </div>
      );
    }

    return (
      <div style={styles.actions}>
        <button
          type="button"
          style={{ ...styles.actionBtn, ...styles.flagBtn }}
          onClick={() => handleFlag(car)}
          disabled={Boolean(isBusy)}
          title="Flag"
        >
          <Flag size={15} />
          <span>Flag</span>
        </button>
        {car.isActive ? (
          <button
            type="button"
            style={{ ...styles.actionBtn, ...styles.rejectBtn }}
            onClick={() => handleDeactivate(car)}
            disabled={Boolean(isBusy)}
            title="Deactivate"
          >
            <ShieldOff size={15} />
            <span>{isBusy ? "Working..." : "Deactivate"}</span>
          </button>
        ) : (
          <button
            type="button"
            style={{ ...styles.actionBtn, ...styles.approveBtn }}
            onClick={() => handleActivate(car)}
            disabled={Boolean(isBusy)}
            title="Activate"
          >
            <Check size={15} />
            <span>{isBusy ? "Working..." : "Activate"}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.subtitle}>{subtitle}</p>
          <p style={styles.metaText}>{total.toLocaleString()} cars</p>
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
            placeholder="Search brand / model"
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
                      <div style={styles.twoLine}>
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
                        <span style={styles.secondaryText}>{car.backendStatus}</span>
                      </div>
                    </td>

                    <td style={styles.tdRight}>{renderActions(car)}</td>
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
    gap: 16,
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
  metaText: {
    margin: "6px 0 0",
    fontSize: 12,
    color: "var(--fg-55)",
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
    fontWeight: 600,
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
  emptyCell: bookingsTableTheme.emptyCell,
  statusPill: bookingsTableTheme.statusPill,
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    border: "none",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  approveBtn: {
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
    border: "1px solid rgba(34,197,94,0.22)",
  },
  rejectBtn: {
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },
  flagBtn: {
    background: "rgba(245,158,11,0.16)",
    color: "#FCD34D",
    border: "1px solid rgba(245,158,11,0.22)",
  },
  restoreBtn: {
    background: "rgba(59,130,246,0.16)",
    color: "#93C5FD",
    border: "1px solid rgba(59,130,246,0.22)",
  },
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
