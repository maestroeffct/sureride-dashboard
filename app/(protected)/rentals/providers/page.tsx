"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import toast from "react-hot-toast";
import ProvidersTable from "@/src/components/rentals/providers/ProvidersTable";
import ProvidersFilters from "@/src/components/rentals/providers/ProvidersFilters";
import { RentalProvider } from "@/src/types/rentalProvider";
import { listProviders } from "@/src/lib/providersApi";

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

          <a href="/rentals/providers/new" style={styles.btnPrimary}>
            + Add Provider
          </a>
        </div>
      </div>

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
    background: "#2563EB",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 500,
  },
};
