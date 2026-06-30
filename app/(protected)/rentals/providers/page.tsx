"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  ShieldOff,
} from "lucide-react";
import toast from "react-hot-toast";
import ProvidersTable from "@/src/components/rentals/providers/ProvidersTable";
import ProvidersFilters from "@/src/components/rentals/providers/ProvidersFilters";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";
import { RentalProvider } from "@/src/types/rentalProvider";
import { listProviders } from "@/src/lib/providersApi";
import { downloadCsv, downloadPdf } from "@/src/lib/exportTable";

export default function RentalProvidersPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    city: "",
    rating: "",
  });
  const [providers, setProviders] = useState<RentalProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await listProviders({
        q: search.trim() || undefined,
        status:
          (filters.status as "" | "draft" | "pending" | "active" | "suspended") ||
          undefined,
        page: 1,
        limit: 100,
      });

      const cityFilter = filters.city.trim().toLowerCase();
      const items = cityFilter
        ? response.items.filter((provider) =>
            `${provider.city} ${provider.state || ""}`
              .toLowerCase()
              .includes(cityFilter),
          )
        : response.items;

      setProviders(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load providers";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.status, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProviders();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadProviders]);

  const exportHeaders = [
    "Name",
    "Contact",
    "Email",
    "Phone",
    "City",
    "Total Cars",
    "Active Cars",
    "Pending Cars",
    "Status",
    "Verified",
    "Joined On",
  ];

  const exportRows = () =>
    providers.map((p) => [
      p.name,
      p.contactPerson,
      p.email,
      p.phone,
      [p.city, p.state].filter(Boolean).join(", "),
      p.totalCars,
      p.activeCars,
      p.pendingCars,
      p.status,
      p.isVerified ? "Yes" : "No",
      new Date(p.joinedOn).toISOString().slice(0, 10),
    ]);

  const handleExportCsv = () => {
    if (providers.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv("sureride-providers", exportHeaders, exportRows());
    setExportOpen(false);
  };

  // KPI counts derived from the loaded set so they reconcile with what's
  // on screen. If you flip a status filter the tiles still show the
  // unfiltered totals — that's intentional, the filter is for the table.
  const kpiCounts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let suspended = 0;
    for (const p of providers) {
      if (p.status === "active") active += 1;
      else if (p.status === "pending") pending += 1;
      else if (p.status === "suspended") suspended += 1;
    }
    return { total: providers.length, active, pending, suspended };
  }, [providers]);

  const handleExportPdf = () => {
    if (providers.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    downloadPdf(
      "sureride-providers",
      "Rental Providers",
      exportHeaders,
      exportRows(),
    );
    setExportOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Rental Providers</h1>

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
                <button style={styles.exportItem} onClick={handleExportCsv}>
                  Export CSV
                </button>
                <button style={styles.exportItem} onClick={handleExportPdf}>
                  Export PDF
                </button>
              </div>
            )}
          </div>

          <a href="/rentals/providers/new" style={styles.btnPrimary}>
            + Add Provider
          </a>
        </div>
      </div>

      <KpiGrid>
        <KpiCard
          label="Total Providers"
          value={kpiCounts.total}
          subtext="All providers on the platform"
          icon={<Building2 size={18} />}
          tone="var(--brand-primary)"
        />
        <KpiCard
          label="Active"
          value={kpiCounts.active}
          subtext="Live, accepting bookings"
          icon={<CheckCircle2 size={18} />}
          tone="#22c55e"
        />
        <KpiCard
          label="Pending Approval"
          value={kpiCounts.pending}
          subtext="Awaiting your review"
          icon={<Clock size={18} />}
          tone="#f59e0b"
        />
        <KpiCard
          label="Suspended"
          value={kpiCounts.suspended}
          subtext="Hidden from customers"
          icon={<ShieldOff size={18} />}
          tone="#ef4444"
        />
      </KpiGrid>

      <ProvidersFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ProvidersTable
        providers={providers}
        loading={loading}
        onMutated={loadProviders}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  btnPrimary: {
    padding: "10px 14px",
    background: "var(--brand-primary)",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 500,
  },
};
