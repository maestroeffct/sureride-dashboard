"use client";

import { useMemo, useState } from "react";
import styles from "./styles";
import { Plus, Search, Edit2, Power } from "lucide-react";

type ModelStatus = "Active" | "Disabled";

type CarModelRow = {
  id: string;
  brand: string;
  model: string;
  category: string;
  yearRange: string;
  carsCount: number;
  status: ModelStatus;
};

export default function CarModelsPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CarModelRow | null>(null);

  const rows: CarModelRow[] = useMemo(
    () => [
      {
        id: "1",
        brand: "Toyota",
        model: "Corolla",
        category: "Sedan",
        yearRange: "2015 – 2025",
        carsCount: 96,
        status: "Active",
      },
      {
        id: "2",
        brand: "BMW",
        model: "X5",
        category: "SUV",
        yearRange: "2017 – 2025",
        carsCount: 21,
        status: "Active",
      },
      {
        id: "3",
        brand: "Tesla",
        model: "Model 3",
        category: "Electric",
        yearRange: "2020 – 2025",
        carsCount: 7,
        status: "Disabled",
      },
    ],
    []
  );

  const filtered = rows.filter((r) =>
    `${r.brand} ${r.model}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Car Models</h1>
          <p style={styles.subtitle}>
            Admin-approved vehicle models used across the platform
          </p>
        </div>

        <button
          style={styles.primaryBtn}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={16} />
          Add Model
        </button>
      </div>

      {/* SEARCH */}
      <div style={styles.searchRow}>
        <div style={styles.searchBox}>
          <Search size={16} />
          <input
            placeholder="Search models..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Model</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Year Range</th>
              <th style={styles.th}>Cars Using</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, ...styles.actionsCol }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={styles.tr}>
                <td style={styles.td}>
                  <strong>{r.brand}</strong> {r.model}
                </td>
                <td style={styles.td}>{r.category}</td>
                <td style={styles.td}>{r.yearRange}</td>
                <td style={styles.td}>{r.carsCount}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusPill,
                      ...(r.status === "Active"
                        ? styles.statusActive
                        : styles.statusDisabled),
                    }}
                  >
                    {r.status}
                  </span>
                </td>
                <td style={{ ...styles.td, ...styles.actionsCol }}>
                  <div style={styles.actions}>
                    <button
                      style={styles.iconBtn}
                      title="Edit"
                      onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      style={styles.iconBtn}
                      title="Disable"
                      disabled={r.carsCount > 0}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={styles.empty}>
                  No models found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <ModelModal initial={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}
