"use client";

import { useState } from "react";
import { RentalProvider } from "@/src/types/rentalProvider";
import ProviderStatusBadge from "./ProviderStatusBadge";
import ProvidersActions from "./ProvidersActions";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortKey =
  | "name"
  | "totalCars"
  | "activeCars"
  | "pendingCars"
  | "status"
  | "joinedOn"
  | null;

type SortOrder = "asc" | "desc";

const COLUMNS = [
  { key: "sn", label: "S/N" },
  { key: "select", label: "" },
  { key: "name", label: "Provider Name", sortable: true },
  { key: "contact", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "location", label: "Location" },
  { key: "totalCars", label: "Total Cars", sortable: true },
  { key: "activeCars", label: "Active Cars", sortable: true },
  { key: "pendingCars", label: "Pending Cars", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "joinedOn", label: "Joined On", sortable: true },
  { key: "actions", label: "Actions" },
];

export default function ProvidersTable({
  providers,
}: {
  providers: RentalProvider[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  /* ---------------- Sorting ---------------- */

  const sortedProviders = [...providers].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey as keyof RentalProvider];
    const bVal = b[sortKey as keyof RentalProvider];

    // Handle null/undefined values explicitly
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortOrder === "asc" ? 1 : -1;
    if (bVal == null) return sortOrder === "asc" ? -1 : 1;

    // Normalize to strings and use localeCompare to handle numeric and string comparisons
    const aStr = String(aVal);
    const bStr = String(bVal);
    const cmp = aStr.localeCompare(bStr, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return sortOrder === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortKey(null);
    }
  };

  /* ---------------- Bulk Select ---------------- */

  const toggleSelectAll = () => {
    if (selected.length === providers.length) {
      setSelected([]);
    } else {
      setSelected(providers.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ---------------- Render ---------------- */

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                style={styles.th}
                onClick={() => col.sortable && toggleSort(col.key as SortKey)}
              >
                <div style={styles.thInner}>
                  {col.key === "select" ? (
                    <input
                      type="checkbox"
                      checked={
                        selected.length === providers.length &&
                        providers.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  ) : (
                    col.label
                  )}

                  {col.sortable && (
                    <span style={styles.sortIcon}>
                      {sortKey === col.key ? (
                        sortOrder === "asc" ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronUp size={14} opacity={0.3} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedProviders.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} style={styles.emptyCell}>
                <div style={styles.emptyContent}>
                  <p>No rental providers yet.</p>
                  <a href="/rentals/providers/new">+ Add Provider</a>
                </div>
              </td>
            </tr>
          ) : (
            sortedProviders.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>

                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleSelectOne(p.id)}
                  />
                </td>

                <td>{p.name}</td>
                <td>{p.contactPerson}</td>
                <td>
                  {p.email}
                  <br />
                  {p.phone}
                </td>
                <td>{p.city}</td>
                <td>{p.totalCars}</td>
                <td>{p.activeCars}</td>
                <td>{p.pendingCars}</td>
                <td>
                  <ProviderStatusBadge status={p.status} />
                </td>
                <td>{new Date(p.joinedOn).toLocaleDateString()}</td>
                <td>
                  <ProvidersActions provider={p} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#020617",
    borderRadius: 12,
  },

  th: {
    padding: "12px 14px",
    textAlign: "left",
    fontSize: 13,
    color: "#9CA3AF",
    borderBottom: "1px solid #1F2937",
    cursor: "pointer",
    userSelect: "none",
  },

  thInner: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  sortIcon: {
    display: "flex",
    alignItems: "center",
  },

  emptyCell: {
    padding: 48,
    textAlign: "center",
    color: "#9CA3AF",
  },

  emptyContent: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
  },
};
