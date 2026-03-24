"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Edit2, Plus, Power, RefreshCw, Search } from "lucide-react";
import styles from "./styles";
import CarMetadataImportDrawer from "@/src/components/rentals/configuration/CarMetadataImportDrawer";
import {
  CarBrandConfig,
  CarBrandInput,
  CarCategoryConfig,
  importCarMetaBrands,
  listCarMetadataDraft,
  saveCarBrandDraft,
  setCarBrandStatusDraft,
} from "@/src/lib/carMetadataDraftApi";
import {
  ExternalCatalogItem,
  getExternalCatalogSourceName,
  listExternalCarBrands,
} from "@/src/lib/externalCarCatalogApi";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CarBrandsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [rows, setRows] = useState<CarBrandConfig[]>([]);
  const [categories, setCategories] = useState<CarCategoryConfig[]>([]);
  const [source, setSource] = useState<"server" | "local">("local");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CarBrandConfig | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importCategoryId, setImportCategoryId] = useState("");
  const [importQuery, setImportQuery] = useState("");
  const [importItems, setImportItems] = useState<ExternalCatalogItem[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function hydrate() {
    setLoading(true);
    const snapshot = await listCarMetadataDraft();
    setRows(snapshot.brands);
    setCategories(snapshot.categories);
    setSource(snapshot.source);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void listCarMetadataDraft().then((snapshot) => {
      if (cancelled) return;
      startTransition(() => {
        setRows(snapshot.brands);
        setCategories(snapshot.categories);
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
      const matchesQuery = `${row.name} ${row.slug} ${row.categoryName} ${row.source ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ? true : status === "active" ? row.isActive : !row.isActive;
      const matchesCategory = categoryId === "all" ? true : row.categoryId === categoryId;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoryId, query, rows, status]);

  const activeCount = rows.filter((row) => row.isActive).length;
  const modelsCovered = rows.reduce((sum, row) => sum + row.modelsCount, 0);
  const assignedCount = rows.filter((row) => row.categoryId).length;

  async function handleSave(payload: CarBrandInput) {
    setSaving(true);
    try {
      const snapshot = await saveCarBrandDraft(payload);
      setRows(snapshot.brands);
      setCategories(snapshot.categories);
      setSource(snapshot.source);
      setOpen(false);
      setEditing(null);
      setMessage(payload.id ? "Brand updated." : "Brand created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save brand.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(row: CarBrandConfig) {
    setBusyId(row.id);
    try {
      const snapshot = await setCarBrandStatusDraft(row.id, !row.isActive);
      setRows(snapshot.brands);
      setCategories(snapshot.categories);
      setSource(snapshot.source);
      setMessage(row.isActive ? "Brand disabled." : "Brand reactivated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update brand status.");
    } finally {
      setBusyId(null);
    }
  }

  async function loadImportItems(nextCategoryId = importCategoryId) {
    if (!nextCategoryId) {
      setImportItems([]);
      setSelectedImportIds([]);
      setImportError("Select the backend category that these brands should map into.");
      return;
    }

    const targetCategory = categories.find((item) => item.id === nextCategoryId) ?? null;

    setImportLoading(true);
    setImportError(null);

    try {
      const items = await listExternalCarBrands({
        query: importQuery.trim(),
        categoryExternalId: targetCategory?.externalId ?? undefined,
        categoryName: targetCategory?.name ?? undefined,
      });
      setImportItems(items);
      setSelectedImportIds([]);
    } catch (error) {
      setImportItems([]);
      setSelectedImportIds([]);
      setImportError(error instanceof Error ? error.message : "Unable to load external brands.");
    } finally {
      setImportLoading(false);
    }
  }

  async function openImportDrawer() {
    const initialCategoryId =
      categoryId !== "all" ? categoryId : categories.find((item) => item.isActive)?.id ?? categories[0]?.id ?? "";
    setImportCategoryId(initialCategoryId);
    setImportQuery("");
    setSelectedImportIds([]);
    setImportOpen(true);

    if (initialCategoryId) {
      void loadImportItems(initialCategoryId);
    }
  }

  function toggleImportSelection(externalId: string) {
    setSelectedImportIds((current) =>
      current.includes(externalId)
        ? current.filter((item) => item !== externalId)
        : [...current, externalId],
    );
  }

  async function handleImportSelected() {
    if (!importCategoryId) {
      setImportError("Select the backend category first.");
      return;
    }

    const selectedItems = importItems.filter((item) => selectedImportIds.includes(item.externalId));
    if (selectedItems.length === 0) return;

    setImporting(true);
    setImportError(null);

    try {
      const snapshot = await importCarMetaBrands({
        source: getExternalCatalogSourceName(),
        categoryId: importCategoryId,
        items: selectedItems,
      });
      setRows(snapshot.brands);
      setCategories(snapshot.categories);
      setSource(snapshot.source);
      setMessage(`${selectedItems.length} brand${selectedItems.length === 1 ? "" : "s"} imported.`);
      setImportOpen(false);
      setSelectedImportIds([]);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to import brands.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Car Brands</h1>
          <p style={styles.subtitle}>
            Manage the approved brand catalog that sits inside categories. You can also import brands
            from an external vehicle catalog into the selected backend category.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={() => void hydrate()} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button style={styles.secondaryBtn} onClick={() => void openImportDrawer()}>
            <ArrowDownToLine size={16} />
            Import Brands
          </button>
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
      </div>

      <div style={styles.notice}>
        <div style={styles.noticeText}>
          <span style={styles.noticeTitle}>Brand configuration source</span>
          <span style={styles.noticeSubtitle}>
            {source === "server"
              ? "Brand data is being served by backend metadata endpoints."
              : "Brand configuration is currently using local draft persistence until backend metadata endpoints are mounted."}
          </span>
        </div>
        <span style={styles.sourceBadge}>{source === "server" ? "Server" : "Local draft"}</span>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{rows.length}</span>
          <span style={styles.summaryLabel}>Total Brands</span>
          <span style={styles.summaryHelper}>All configured brand records in the current snapshot.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{activeCount}</span>
          <span style={styles.summaryLabel}>Active</span>
          <span style={styles.summaryHelper}>Brands available for model definition and car entry.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{assignedCount}</span>
          <span style={styles.summaryLabel}>Category Linked</span>
          <span style={styles.summaryHelper}>Brands already attached to a parent category.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{modelsCovered}</span>
          <span style={styles.summaryLabel}>Linked Models</span>
          <span style={styles.summaryHelper}>Model records currently hanging off the brand layer.</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <Search size={16} />
            <input
              placeholder="Search brand, category, or slug"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} style={styles.select}>
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

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
          <span style={styles.helperText}>Assign each brand to the category layer before adding models.</span>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Category</th>
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
                    Loading brands...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    No brands found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.primaryText}>{row.name}</div>
                      <div style={styles.secondaryText}>slug: {row.slug}</div>
                      {row.externalId ? <div style={styles.secondaryText}>external: {row.externalId}</div> : null}
                    </td>
                    <td style={styles.td}>{row.categoryName}</td>
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
                          title="Edit brand"
                          onClick={() => {
                            setEditing(row);
                            setOpen(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          style={styles.iconBtn}
                          title={row.isActive ? "Disable brand" : "Enable brand"}
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
        <BrandModal
          initial={editing}
          categories={categories}
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
        title="Import Brands"
        subtitle="Pick the backend category first, then load matching brands from your external vehicle catalog and import the selected entries."
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
        contextControls={
          <div style={styles.field}>
            <span style={styles.fieldLabel}>Backend Category Target</span>
            <select
              value={importCategoryId}
              onChange={(event) => setImportCategoryId(event.target.value)}
              style={styles.select}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <span style={styles.formHint}>
              The selected external brands will be imported into this backend category.
            </span>
          </div>
        }
        emptyText="No external brands found. Configure NEXT_PUBLIC_VEHICLE_CATALOG_BASE_URL, select a backend category, or refine your search."
      />
    </div>
  );
}

function BrandModal({
  initial,
  categories,
  saving,
  onClose,
  onSave,
}: {
  initial: CarBrandConfig | null;
  categories: CarCategoryConfig[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: CarBrandInput) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
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
            categoryId: categoryId || undefined,
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
          <h3 style={styles.modalTitle}>{initial ? "Edit Brand" : "Add Brand"}</h3>
          <span style={styles.modalSubtitle}>
            Brand records should be mapped into categories now so models can inherit the structure later.
          </span>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Brand Name</span>
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
            <span style={styles.fieldLabel}>Category</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              style={styles.select}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>Source</span>
            <input value={source} onChange={(event) => setSource(event.target.value)} style={styles.input} />
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
            <span style={styles.fieldLabel}>Sort Order</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              style={styles.input}
            />
          </label>

          <label style={{ ...styles.field, ...styles.fieldSpan2 }}>
            <span style={styles.fieldLabel}>Availability</span>
            <span style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                style={styles.checkbox}
              />
              Active brand
            </span>
          </label>
        </div>

        <div style={styles.modalActions}>
          <button type="button" style={styles.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            style={styles.primaryBtn}
            disabled={saving || !name.trim() || !categoryId}
          >
            {saving ? "Saving..." : initial ? "Save Changes" : "Create Brand"}
          </button>
        </div>
      </form>
    </div>
  );
}
