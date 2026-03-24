"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Edit2, Plus, Power, RefreshCw, Search } from "lucide-react";
import styles from "./styles";
import CarMetadataImportDrawer from "@/src/components/rentals/configuration/CarMetadataImportDrawer";
import {
  CarCategoryConfig,
  CarCategoryInput,
  importCarMetaCategories,
  listCarMetadataDraft,
  saveCarCategoryDraft,
  setCarCategoryStatusDraft,
} from "@/src/lib/carMetadataDraftApi";
import {
  ExternalCatalogItem,
  getExternalCatalogSourceName,
  listExternalCarCategories,
} from "@/src/lib/externalCarCatalogApi";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CarCategoriesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [rows, setRows] = useState<CarCategoryConfig[]>([]);
  const [source, setSource] = useState<"server" | "local">("local");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CarCategoryConfig | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importQuery, setImportQuery] = useState("");
  const [importItems, setImportItems] = useState<ExternalCatalogItem[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function hydrate() {
    setLoading(true);
    const snapshot = await listCarMetadataDraft();
    setRows(snapshot.categories);
    setSource(snapshot.source);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void listCarMetadataDraft().then((snapshot) => {
      if (cancelled) return;
      startTransition(() => {
        setRows(snapshot.categories);
        setSource(snapshot.source);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery = `${row.name} ${row.slug} ${row.source ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ? true : status === "active" ? row.isActive : !row.isActive;

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  const activeCount = rows.filter((row) => row.isActive).length;
  const brandsCovered = rows.reduce((sum, row) => sum + row.brandsCount, 0);
  const modelsCovered = rows.reduce((sum, row) => sum + row.modelsCount, 0);

  async function handleSave(payload: CarCategoryInput) {
    setSaving(true);
    try {
      const snapshot = await saveCarCategoryDraft(payload);
      setRows(snapshot.categories);
      setSource(snapshot.source);
      setOpen(false);
      setEditing(null);
      setMessage(payload.id ? "Category updated." : "Category created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(row: CarCategoryConfig) {
    setBusyId(row.id);
    try {
      const snapshot = await setCarCategoryStatusDraft(row.id, !row.isActive);
      setRows(snapshot.categories);
      setSource(snapshot.source);
      setMessage(row.isActive ? "Category disabled." : "Category reactivated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update category status.");
    } finally {
      setBusyId(null);
    }
  }

  async function loadImportItems() {
    setImportLoading(true);
    setImportError(null);
    try {
      const items = await listExternalCarCategories(importQuery.trim());
      setImportItems(items);
      setSelectedImportIds([]);
    } catch (error) {
      setImportItems([]);
      setSelectedImportIds([]);
      setImportError(
        error instanceof Error ? error.message : "Unable to load external categories.",
      );
    } finally {
      setImportLoading(false);
    }
  }

  async function openImportDrawer() {
    setImportOpen(true);
    setImportQuery("");
    setSelectedImportIds([]);
    await loadImportItems();
  }

  function toggleImportSelection(externalId: string) {
    setSelectedImportIds((current) =>
      current.includes(externalId)
        ? current.filter((item) => item !== externalId)
        : [...current, externalId],
    );
  }

  async function handleImportSelected() {
    const selectedItems = importItems.filter((item) => selectedImportIds.includes(item.externalId));
    if (selectedItems.length === 0) return;

    setImporting(true);
    setImportError(null);

    try {
      const snapshot = await importCarMetaCategories({
        source: getExternalCatalogSourceName(),
        items: selectedItems,
      });
      setRows(snapshot.categories);
      setSource(snapshot.source);
      setMessage(`${selectedItems.length} categor${selectedItems.length === 1 ? "y" : "ies"} imported.`);
      setImportOpen(false);
      setSelectedImportIds([]);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to import categories.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Car Categories</h1>
          <p style={styles.subtitle}>
            Define the approved category layer that brands and models depend on. This page now uses
            the backend metadata contract, and it can also import categories from an external vehicle
            catalog into your backend.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={() => void hydrate()} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button style={styles.secondaryBtn} onClick={() => void openImportDrawer()}>
            <ArrowDownToLine size={16} />
            Import Categories
          </button>
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
      </div>

      <div style={styles.notice}>
        <div style={styles.noticeText}>
          <span style={styles.noticeTitle}>Metadata source status</span>
          <span style={styles.noticeSubtitle}>
            {source === "server"
              ? "Loaded from backend metadata endpoints."
              : "Backend metadata endpoints are not available yet, so changes are being saved in local draft storage."}
          </span>
        </div>
        <span style={styles.sourceBadge}>{source === "server" ? "Server" : "Local draft"}</span>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{rows.length}</span>
          <span style={styles.summaryLabel}>Total Categories</span>
          <span style={styles.summaryHelper}>Approved category records in the current snapshot.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{activeCount}</span>
          <span style={styles.summaryLabel}>Active</span>
          <span style={styles.summaryHelper}>Categories available for brand and car assignment.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{brandsCovered}</span>
          <span style={styles.summaryLabel}>Linked Brands</span>
          <span style={styles.summaryHelper}>Brand records currently mapped into categories.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{modelsCovered}</span>
          <span style={styles.summaryLabel}>Linked Models</span>
          <span style={styles.summaryHelper}>Model records inheriting a category mapping.</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <Search size={16} />
            <input
              placeholder="Search category, slug, or source"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            style={styles.select}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {message ? (
          <span style={styles.helperText}>{message}</span>
        ) : (
          <span style={styles.helperText}>Manual add/edit now mirrors the draft contract.</span>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Linked Brands</th>
                <th style={styles.th}>Linked Models</th>
                <th style={styles.th}>Source</th>
                <th style={styles.th}>Updated</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    Loading categories...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.primaryText}>{row.name}</div>
                      <div style={styles.secondaryText}>slug: {row.slug}</div>
                      {row.externalId ? (
                        <div style={styles.secondaryText}>external: {row.externalId}</div>
                      ) : null}
                    </td>
                    <td style={styles.td}>{row.brandsCount}</td>
                    <td style={styles.td}>{row.modelsCount}</td>
                    <td style={styles.td}>{row.source ?? "manual"}</td>
                    <td style={styles.td}>{formatDate(row.updatedAt)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusPill,
                          ...(row.isActive ? styles.statusActive : styles.statusDisabled),
                        }}
                      >
                        {row.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={styles.tdRight}>
                      <div style={styles.actions}>
                        <button
                          style={styles.iconBtn}
                          title="Edit category"
                          onClick={() => {
                            setEditing(row);
                            setOpen(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          style={styles.iconBtn}
                          title={row.isActive ? "Disable category" : "Enable category"}
                          onClick={() => void handleToggle(row)}
                          disabled={busyId === row.id}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open ? (
        <CategoryModal
          initial={editing}
          saving={saving}
          onClose={() => {
            if (saving) return;
            setOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      <CarMetadataImportDrawer
        open={importOpen}
        title="Import Categories"
        subtitle="Load category records from your external vehicle catalog and push the selected entries into the backend metadata table."
        query={importQuery}
        onQueryChange={setImportQuery}
        onClose={() => setImportOpen(false)}
        onRefresh={() => void loadImportItems()}
        onImport={() => void handleImportSelected()}
        loading={importLoading}
        importing={importing}
        error={importError}
        items={importItems}
        selectedIds={selectedImportIds}
        onToggleSelect={toggleImportSelection}
        emptyText="No external categories found. Configure NEXT_PUBLIC_VEHICLE_CATALOG_BASE_URL or refine your search."
      />
    </div>
  );
}

function CategoryModal({
  initial,
  saving,
  onClose,
  onSave,
}: {
  initial: CarCategoryConfig | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: CarCategoryInput) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [externalId, setExternalId] = useState(initial?.externalId ?? "");
  const [source, setSource] = useState(initial?.source ?? "manual");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder?.toString() ?? "0");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  return (
    <div style={styles.modalOverlay}>
      <form
        style={styles.modal}
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({
            id: initial?.id,
            name: name.trim(),
            slug: slug.trim(),
            externalId: externalId.trim(),
            source: source.trim(),
            isActive,
            sortOrder: Number(sortOrder) || 0,
          });
        }}
      >
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{initial ? "Edit Category" : "Add Category"}</h3>
          <span style={styles.modalSubtitle}>
            This matches the backend payload for category configuration and import review.
          </span>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Category Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} style={styles.input} required />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>Slug</span>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="auto if empty"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>External ID</span>
            <input
              value={externalId}
              onChange={(event) => setExternalId(event.target.value)}
              placeholder="optional external reference"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>Source</span>
            <input value={source} onChange={(event) => setSource(event.target.value)} style={styles.input} />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>Sort Order</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={{ ...styles.field, justifyContent: "flex-end" }}>
            <span style={styles.fieldLabel}>Availability</span>
            <span style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                style={styles.checkbox}
              />
              Active category
            </span>
          </label>
        </div>

        <div style={styles.modalActions}>
          <button type="button" style={styles.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" style={styles.primaryBtn} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : initial ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
