"use client";

import { useMemo, useState } from "react";
import styles from "./styles";
import { Plus, Search, Edit2, Power } from "lucide-react";

type CategoryStatus = "Active" | "Disabled";

type CategoryRow = {
  id: string;
  name: string;
  multiplier?: number;
  carsCount: number;
  status: CategoryStatus;
};

export default function CarCategoriesPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  const rows: CategoryRow[] = useMemo(
    () => [
      {
        id: "1",
        name: "SUV",
        multiplier: 1.2,
        carsCount: 124,
        status: "Active",
      },
      {
        id: "2",
        name: "Sedan",
        multiplier: 1.0,
        carsCount: 98,
        status: "Active",
      },
      {
        id: "3",
        name: "Luxury",
        multiplier: 1.6,
        carsCount: 22,
        status: "Disabled",
      },
    ],
    []
  );

  const filtered = rows.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Car Categories</h1>
          <p style={styles.subtitle}>
            Manage vehicle categories used across the rental platform
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
          Add Category
        </button>
      </div>

      {/* SEARCH */}
      <div style={styles.searchRow}>
        <div style={styles.searchBox}>
          <Search size={16} />
          <input
            placeholder="Search categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* TABLE CARD */}
      <div style={styles.card}>
        <div style={styles.tableInner}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Pricing Multiplier</th>
                <th style={styles.th}>Cars Using</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, ...styles.actionsCol }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  style={styles.tr}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.035)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.015)")
                  }
                >
                  <td style={styles.tdStrong}>{r.name}</td>
                  <td style={styles.td}>
                    {r.multiplier ? `${r.multiplier}×` : "—"}
                  </td>
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
                  <td colSpan={5} style={styles.empty}>
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <CategoryModal initial={editing} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

/* ------------------------------------------------ */

function CategoryModal({
  initial,
  onClose,
}: {
  initial: CategoryRow | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [multiplier, setMultiplier] = useState(
    initial?.multiplier?.toString() ?? ""
  );

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>{initial ? "Edit Category" : "Add Category"}</h3>

        <label>
          Category Name *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
        </label>

        <label>
          Default Pricing Multiplier
          <input
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            placeholder="e.g. 1.2"
            style={styles.input}
          />
        </label>

        <div style={styles.modalActions}>
          <button style={styles.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            style={styles.primaryBtn}
            disabled={!name.trim()}
            onClick={onClose}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
