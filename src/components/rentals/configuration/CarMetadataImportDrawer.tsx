"use client";

import { ReactNode } from "react";
import { Search, X } from "lucide-react";
import styles from "@/src/components/rentals/configuration/carMetadataStyles";
import { ExternalCatalogItem } from "@/src/lib/externalCarCatalogApi";

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onRefresh: () => void;
  onImport: () => void;
  loading: boolean;
  importing: boolean;
  error: string | null;
  items: ExternalCatalogItem[];
  selectedIds: string[];
  onToggleSelect: (externalId: string) => void;
  contextControls?: ReactNode;
  emptyText: string;
};

export default function CarMetadataImportDrawer({
  open,
  title,
  subtitle,
  query,
  onQueryChange,
  onClose,
  onRefresh,
  onImport,
  loading,
  importing,
  error,
  items,
  selectedIds,
  onToggleSelect,
  contextControls,
  emptyText,
}: Props) {
  if (!open) return null;

  return (
    <div style={styles.drawerOverlay}>
      <div style={styles.drawerPanel}>
        <div style={styles.drawerHeader}>
          <div style={styles.drawerTitleWrap}>
            <h2 style={styles.drawerTitle}>{title}</h2>
            <span style={styles.modalSubtitle}>{subtitle}</span>
          </div>

          <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Close import drawer">
            <X size={18} />
          </button>
        </div>

        {contextControls}

        <div style={styles.importToolbar}>
          <div style={styles.searchBox}>
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search external catalog"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.headerActions}>
            <span style={styles.importCountPill}>{selectedIds.length} selected</span>
            <button type="button" style={styles.secondaryBtn} onClick={onRefresh} disabled={loading}>
              Refresh Source
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={onImport}
              disabled={importing || selectedIds.length === 0}
            >
              {importing ? "Importing..." : "Import Selected"}
            </button>
          </div>
        </div>

        {error ? <span style={styles.helperText}>{error}</span> : null}

        <div style={styles.importList}>
          {loading ? (
            <div style={styles.card}>
              <div style={styles.empty}>Loading external catalog...</div>
            </div>
          ) : items.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.empty}>{emptyText}</div>
            </div>
          ) : (
            items.map((item) => {
              const selected = selectedIds.includes(item.externalId);
              return (
                <label key={item.externalId} style={styles.importCard}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(item.externalId)}
                    style={styles.checkbox}
                  />

                  <div style={styles.importCardBody}>
                    <span style={styles.primaryText}>{item.name}</span>
                    <span style={styles.secondaryText}>slug: {item.slug}</span>
                    <span style={styles.secondaryText}>external: {item.externalId}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
