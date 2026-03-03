"use client";

import Link from "next/link";
import { useState } from "react";
import { RentalProvider } from "@/src/types/rentalProvider";
import ProviderStatusBadge from "./ProviderStatusBadge";
import ProvidersActions from "./ProvidersActions";
import { ChevronUp, ChevronDown } from "lucide-react";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";

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

  const sortedProviders = [...providers].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey as keyof RentalProvider];
    const bVal = b[sortKey as keyof RentalProvider];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortOrder === "asc" ? 1 : -1;
    if (bVal == null) return sortOrder === "asc" ? -1 : 1;

    const cmp = String(aVal).localeCompare(String(bVal), undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return sortOrder === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortOrder("asc");
      return;
    }

    if (sortOrder === "asc") {
      setSortOrder("desc");
      return;
    }

    setSortKey(null);
  };

  const toggleSelectAll = () => {
    if (selected.length === providers.length) {
      setSelected([]);
      return;
    }
    setSelected(providers.map((p) => p.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              {COLUMNS.map((col) => {
                const isActions = col.key === "actions";
                const thStyle = isActions ? styles.thRight : styles.th;
                return (
                  <th
                    key={col.key}
                    style={{
                      ...thStyle,
                      ...(col.sortable ? styles.thSortable : {}),
                    }}
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
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sortedProviders.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} style={styles.emptyCell}>
                  <div style={styles.emptyContent}>
                    <p>No rental providers yet.</p>
                    <Link href="/rentals/providers/new">+ Add Provider</Link>
                  </div>
                </td>
              </tr>
            ) : (
              sortedProviders.map((p, index) => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>{index + 1}</td>

                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelectOne(p.id)}
                    />
                  </td>

                  <td style={styles.tdStrong}>{p.name}</td>
                  <td style={styles.td}>{p.contactPerson}</td>

                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <span style={styles.primaryText}>{p.email}</span>
                      <span style={styles.secondaryText}>{p.phone}</span>
                    </div>
                  </td>

                  <td style={styles.td}>{p.city}</td>
                  <td style={styles.td}>{p.totalCars}</td>
                  <td style={styles.td}>{p.activeCars}</td>
                  <td style={styles.td}>{p.pendingCars}</td>

                  <td style={styles.td}>
                    <ProviderStatusBadge status={p.status} />
                  </td>

                  <td style={styles.td}>
                    {new Date(p.joinedOn).toLocaleDateString()}
                  </td>

                  <td style={styles.tdRight}>
                    <ProvidersActions provider={p} />
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

const styles: Record<string, React.CSSProperties> = {
  card: bookingsTableTheme.card,
  tableWrap: bookingsTableTheme.tableWrap,
  table: {
    ...bookingsTableTheme.table,
    minWidth: 1200,
  },
  trHead: bookingsTableTheme.theadRow,
  th: bookingsTableTheme.th,
  thRight: bookingsTableTheme.thRight,
  thSortable: {
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
  tr: bookingsTableTheme.tr,
  td: bookingsTableTheme.td,
  tdRight: bookingsTableTheme.tdRight,
  tdStrong: bookingsTableTheme.tdStrong,
  twoLine: bookingsTableTheme.twoLine,
  primaryText: bookingsTableTheme.primaryText,
  secondaryText: bookingsTableTheme.secondaryText,
  emptyCell: {
    ...bookingsTableTheme.emptyCell,
    padding: 48,
  },
  emptyContent: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
  },
};
