"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Edit2, Plus, Power, RefreshCw, Search } from "lucide-react";
import styles from "./styles";
import CarMetadataImportDrawer from "@/src/components/rentals/configuration/CarMetadataImportDrawer";
import {
  CarBrandConfig,
  CarCategoryConfig,
  CarModelConfig,
  CarModelInput,
  importCarMetaModels,
  listCarMetadataDraft,
  saveCarModelDraft,
  setCarModelStatusDraft,
} from "@/src/lib/carMetadataDraftApi";
import {
  ExternalCatalogItem,
  getExternalCatalogSourceName,
  listExternalCarModels,
} from "@/src/lib/externalCarCatalogApi";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CarModelsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [rows, setRows] = useState<CarModelConfig[]>([]);
  const [categories, setCategories] = useState<CarCategoryConfig[]>([]);
  const [brands, setBrands] = useState<CarBrandConfig[]>([]);
  const [source, setSource] = useState<"server" | "local">("local");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CarModelConfig | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importCategoryId, setImportCategoryId] = useState("");
  const [importBrandId, setImportBrandId] = useState("");
  const [importQuery, setImportQuery] = useState("");
  const [importItems, setImportItems] = useState<ExternalCatalogItem[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function hydrate() {
    setLoading(true);
    const snapshot = await listCarMetadataDraft();
    setRows(snapshot.models);
    setCategories(snapshot.categories);
    setBrands(snapshot.brands);
    setSource(snapshot.source);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void listCarMetadataDraft().then((snapshot) => {
      if (cancelled) return;
      startTransition(() => {
        setRows(snapshot.models);
        setCategories(snapshot.categories);
        setBrands(snapshot.brands);
        setSource(snapshot.source);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const brandOptions = useMemo(() => {
    return categoryId === "all" ? brands : brands.filter((brand) => brand.categoryId === categoryId);
  }, [brands, categoryId]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery = `${row.name} ${row.brandName} ${row.categoryName} ${row.slug}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ? true : status === "active" ? row.isActive : !row.isActive;
      const matchesCategory = categoryId === "all" ? true : row.categoryId === categoryId;
      const matchesBrand = brandId === "all" ? true : row.brandId === brandId;

      return matchesQuery && matchesStatus && matchesCategory && matchesBrand;
    });
  }, [brandId, categoryId, query, rows, status]);

  const activeCount = rows.filter((row) => row.isActive).length;
  const carsCovered = rows.reduce((sum, row) => sum + (row.carsCount ?? 0), 0);
  const assignedCategories = new Set(rows.map((row) => row.categoryId).filter(Boolean)).size;
  const importBrandOptions = useMemo(() => {
    return importCategoryId
      ? brands.filter((brand) => brand.categoryId === importCategoryId)
      : brands;
  }, [brands, importCategoryId]);

  async function handleSave(payload: CarModelInput) {
    setSaving(true);
    try {
      const snapshot = await saveCarModelDraft(payload);
      setRows(snapshot.models);
      setCategories(snapshot.categories);
      setBrands(snapshot.brands);
      setSource(snapshot.source);
      setOpen(false);
      setEditing(null);
      setMessage(payload.id ? "Model updated." : "Model created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save model.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(row: CarModelConfig) {
    setBusyId(row.id);
    try {
      const snapshot = await setCarModelStatusDraft(row.id, !row.isActive);
      setRows(snapshot.models);
      setCategories(snapshot.categories);
      setBrands(snapshot.brands);
      setSource(snapshot.source);
      setMessage(row.isActive ? "Model disabled." : "Model reactivated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update model status.");
    } finally {
      setBusyId(null);
    }
  }

  async function loadImportItems(nextCategoryId = importCategoryId, nextBrandId = importBrandId) {
    if (!nextBrandId) {
      setImportItems([]);
      setSelectedImportIds([]);
      setImportError("Select the backend brand that these models should map into.");
      return;
    }

    const targetCategory = categories.find((item) => item.id === nextCategoryId) ?? null;
    const targetBrand = brands.find((item) => item.id === nextBrandId) ?? null;

    setImportLoading(true);
    setImportError(null);

    try {
      const items = await listExternalCarModels({
        query: importQuery.trim(),
        categoryExternalId: targetCategory?.externalId ?? undefined,
        categoryName: targetCategory?.name ?? undefined,
        brandExternalId: targetBrand?.externalId ?? undefined,
        brandName: targetBrand?.name ?? undefined,
      });
      setImportItems(items);
      setSelectedImportIds([]);
    } catch (error) {
      setImportItems([]);
      setSelectedImportIds([]);
      setImportError(error instanceof Error ? error.message : "Unable to load external models.");
    } finally {
      setImportLoading(false);
    }
  }

  async function openImportDrawer() {
    const initialCategoryId =
      categoryId !== "all"
        ? categoryId
        : categories.find((item) => item.isActive)?.id ?? categories[0]?.id ?? "";
    const initialBrandId =
      brandId !== "all"
        ? brandId
        : brands.find((item) => item.categoryId === initialCategoryId && item.isActive)?.id ??
          brands.find((item) => item.categoryId === initialCategoryId)?.id ??
          "";

    setImportCategoryId(initialCategoryId);
    setImportBrandId(initialBrandId);
    setImportQuery("");
    setSelectedImportIds([]);
    setImportOpen(true);

    if (initialBrandId) {
      void loadImportItems(initialCategoryId, initialBrandId);
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
    if (!importBrandId) {
      setImportError("Select the backend brand first.");
      return;
    }

    const selectedItems = importItems.filter((item) => selectedImportIds.includes(item.externalId));
    if (selectedItems.length === 0) return;

    setImporting(true);
    setImportError(null);

    try {
      const snapshot = await importCarMetaModels({
        source: getExternalCatalogSourceName(),
        categoryId: importCategoryId || undefined,
        brandId: importBrandId,
        items: selectedItems,
      });
      setRows(snapshot.models);
      setCategories(snapshot.categories);
      setBrands(snapshot.brands);
      setSource(snapshot.source);
      setMessage(`${selectedItems.length} model${selectedItems.length === 1 ? "" : "s"} imported.`);
      setImportOpen(false);
      setSelectedImportIds([]);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to import models.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Car Models</h1>
          <p style={styles.subtitle}>
            Control the model layer used when cars are created. Brand selection is now linked to the
            category filter, and you can import external catalog models into a specific backend brand
            before they reach the backend car flow.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={() => void hydrate()} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button style={styles.secondaryBtn} onClick={() => void openImportDrawer()}>
            <ArrowDownToLine size={16} />
            Import Models
          </button>
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
      </div>

      <div style={styles.notice}>
        <div style={styles.noticeText}>
          <span style={styles.noticeTitle}>Model configuration source</span>
          <span style={styles.noticeSubtitle}>
            {source === "server"
              ? "Model data is loading from backend metadata endpoints."
              : "Model configuration is using local draft storage until the backend metadata endpoints are available."}
          </span>
        </div>
        <span style={styles.sourceBadge}>{source === "server" ? "Server" : "Local draft"}</span>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{rows.length}</span>
          <span style={styles.summaryLabel}>Total Models</span>
          <span style={styles.summaryHelper}>Configured model records across the metadata catalog.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{activeCount}</span>
          <span style={styles.summaryLabel}>Active</span>
          <span style={styles.summaryHelper}>Models currently available for admin or provider car creation.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{assignedCategories}</span>
          <span style={styles.summaryLabel}>Categories Covered</span>
          <span style={styles.summaryHelper}>Distinct categories represented by the approved model catalog.</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{carsCovered}</span>
          <span style={styles.summaryLabel}>Cars Linked</span>
          <span style={styles.summaryHelper}>Cars currently using the model catalog in the draft snapshot.</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <Search size={16} />
            <input
              placeholder="Search model, brand, category, or slug"
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

          <select value={brandId} onChange={(event) => setBrandId(event.target.value)} style={styles.select}>
            <option value="all">All brands</option>
            {brandOptions.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
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
          <span style={styles.helperText}>Choose a category first, then constrain brands and models beneath it.</span>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Model</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Category</th>
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
                    Loading models...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    No models found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.primaryText}>{row.name}</div>
                      <div style={styles.secondaryText}>slug: {row.slug}</div>
                      {typeof row.metadata?.yearRange === "string" ? (
                        <div style={styles.secondaryText}>years: {row.metadata.yearRange}</div>
                      ) : null}
                    </td>
                    <td style={styles.td}>{row.brandName}</td>
                    <td style={styles.td}>{row.categoryName}</td>
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
                          title="Edit model"
                          onClick={() => {
                            setEditing(row);
                            setOpen(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          style={styles.iconBtn}
                          title={row.isActive ? "Disable model" : "Enable model"}
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
        <ModelModal
          initial={editing}
          categories={categories}
          brands={brands}
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
        title="Import Models"
        subtitle="Pick the backend category and brand target, then load matching models from your external vehicle catalog and import the selected entries."
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
          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>Backend Category Target</span>
              <select
                value={importCategoryId}
                onChange={(event) => {
                  const nextCategoryId = event.target.value;
                  setImportCategoryId(nextCategoryId);
                  const nextBrandId =
                    brands.find((brand) => brand.categoryId === nextCategoryId && brand.isActive)?.id ??
                    brands.find((brand) => brand.categoryId === nextCategoryId)?.id ??
                    "";
                  setImportBrandId(nextBrandId);
                }}
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
                This keeps the imported models aligned with the category hierarchy in your backend.
              </span>
            </label>

            <label style={styles.field}>
              <span style={styles.fieldLabel}>Backend Brand Target</span>
              <select
                value={importBrandId}
                onChange={(event) => setImportBrandId(event.target.value)}
                style={styles.select}
              >
                <option value="">Select brand</option>
                {importBrandOptions.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <span style={styles.formHint}>
                The selected external models will be imported into this backend brand.
              </span>
            </label>
          </div>
        }
        emptyText="No external models found. Configure NEXT_PUBLIC_VEHICLE_CATALOG_BASE_URL, choose a backend brand, or refine your search."
      />
    </div>
  );
}

function ModelModal({
  initial,
  categories,
  brands,
  saving,
  onClose,
  onSave,
}: {
  initial: CarModelConfig | null;
  categories: CarCategoryConfig[];
  brands: CarBrandConfig[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: CarModelInput) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [yearRange, setYearRange] = useState(
    typeof initial?.metadata?.yearRange === "string" ? initial.metadata.yearRange : "",
  );
  const [externalId, setExternalId] = useState(initial?.externalId ?? "");
  const [source, setSource] = useState(initial?.source ?? "manual");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder?.toString() ?? "0");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const availableBrands = useMemo(() => {
    return categoryId ? brands.filter((brand) => brand.categoryId === categoryId) : brands;
  }, [brands, categoryId]);

  const resolvedBrandId =
    availableBrands.some((brand) => brand.id === brandId) ? brandId : availableBrands[0]?.id ?? "";

  return (
    <div style={styles.modalOverlay}>
      <form
        style={styles.modal}
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({
            id: initial?.id,
            categoryId: categoryId || undefined,
            brandId: resolvedBrandId,
            name: name.trim(),
            slug: slug.trim(),
            externalId: externalId.trim(),
            source: source.trim(),
            isActive,
            sortOrder: Number(sortOrder) || 0,
            metadata: yearRange.trim() ? { yearRange: yearRange.trim() } : undefined,
          });
        }}
      >
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{initial ? "Edit Model" : "Add Model"}</h3>
          <span style={styles.modalSubtitle}>
            The model layer depends on a brand record and can optionally retain category-aware
            metadata such as year range.
          </span>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Model Name</span>
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
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} style={styles.select}>
              <option value="">Unassigned</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>Brand</span>
            <select
              value={resolvedBrandId}
              onChange={(event) => setBrandId(event.target.value)}
              style={styles.select}
              required
            >
              <option value="">Select brand</option>
              {availableBrands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.fieldLabel}>Year Range</span>
            <input
              value={yearRange}
              onChange={(event) => setYearRange(event.target.value)}
              placeholder="e.g. 2018 - 2026"
              style={styles.input}
            />
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
              Active model
            </span>
          </label>
        </div>

        <div style={styles.modalActions}>
          <button type="button" style={styles.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" style={styles.primaryBtn} disabled={saving || !name.trim() || !resolvedBrandId}>
            {saving ? "Saving..." : initial ? "Save Changes" : "Create Model"}
          </button>
        </div>
      </form>
    </div>
  );
}
