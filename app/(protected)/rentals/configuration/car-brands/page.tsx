"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./styles";
import { Plus, Search, Edit2, Power } from "lucide-react";

type BrandStatus = "Active" | "Disabled";

type BrandRow = {
  id: string;
  name: string;
  logo?: string;
  carsCount: number;
  status: BrandStatus;
};

export default function CarBrandsPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrandRow | null>(null);

  const rows: BrandRow[] = useMemo(
    () => [
      {
        id: "1",
        name: "Toyota",
        logo: "/brands/toyota.svg",
        carsCount: 182,
        status: "Active",
      },
      {
        id: "2",
        name: "BMW",
        logo: "/brands/bmw.svg",
        carsCount: 44,
        status: "Active",
      },
      {
        id: "3",
        name: "Tesla",
        logo: "/brands/tesla.svg",
        carsCount: 12,
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
          <h1 style={styles.title}>Car Brands</h1>
          <p style={styles.subtitle}>
            Manage vehicle brands available across the platform
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
          Add Brand
        </button>
      </div>

      {/* SEARCH */}
      <div style={styles.searchRow}>
        <div style={styles.searchBox}>
          <Search size={16} />
          <input
            placeholder="Search brands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Cars Using</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={styles.tr}>
                  {/* BRAND */}
                  <td style={styles.td}>
                    <div style={styles.brandCell}>
                      <div style={styles.logoBox}>
                        {r.logo ? (
                          <Image
                            src={r.logo}
                            alt={r.name}
                            width={36}
                            height={36}
                            style={styles.logo}
                          />
                        ) : (
                          <span style={styles.logoFallback}>
                            {r.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span style={styles.primaryText}>{r.name}</span>
                    </div>
                  </td>

                  {/* COUNT */}
                  <td style={styles.td}>{r.carsCount}</td>

                  {/* STATUS */}
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

                  {/* ACTIONS */}
                  <td style={styles.tdRight}>
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
                  <td colSpan={4} style={styles.empty}>
                    No brands found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <BrandModal initial={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

/* ------------------------------------------------ */

function BrandModal({
  initial,
  onClose,
}: {
  initial: BrandRow | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [logo, setLogo] = useState<File | null>(null);

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>{initial ? "Edit Brand" : "Add Brand"}</h3>

        <label>
          Brand Name *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
          />
        </label>

        <label>
          Brand Logo
          <input
            type="file"
            accept="image/png,image/svg+xml,image/jpeg"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            style={styles.input}
          />
          {logo && <small style={{ color: "var(--fg-60)" }}>{logo.name}</small>}
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
