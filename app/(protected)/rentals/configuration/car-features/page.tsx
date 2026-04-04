"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Power, RefreshCw, Search } from "lucide-react";
import {
  createAdminFeature,
  listAdminFeatures,
  updateAdminFeature,
  type AdminFeature,
  type FeatureCategory,
} from "@/src/lib/featuresApi";

const FEATURE_CATEGORIES: FeatureCategory[] = [
  "SAFETY",
  "PROTECTION",
  "RENTAL_POLICY",
  "COMFORT",
  "OTHER",
];

type FeatureFormState = {
  name: string;
  category: FeatureCategory;
  icon: string;
};

const INITIAL_FORM: FeatureFormState = {
  name: "",
  category: "SAFETY",
  icon: "",
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CarFeaturesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [category, setCategory] = useState<FeatureCategory | "all">("all");
  const [rows, setRows] = useState<AdminFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFeature | null>(null);
  const [form, setForm] = useState<FeatureFormState>(INITIAL_FORM);

  async function hydrate() {
    setLoading(true);
    try {
      const result = await listAdminFeatures({
        q: query.trim() || undefined,
        category: category === "all" ? "" : category,
        isActive:
          status === "all" ? undefined : status === "active" ? true : false,
      });
      setRows(result.items ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load features.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void hydrate();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery = `${row.name} ${row.icon ?? ""} ${row.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ? true : status === "active" ? row.isActive : !row.isActive;
      const matchesCategory = category === "all" ? true : row.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [category, query, rows, status]);

  const activeCount = rows.filter((item) => item.isActive).length;

  function openCreate() {
    setEditing(null);
    setForm(INITIAL_FORM);
    setOpen(true);
  }

  function openEdit(feature: AdminFeature) {
    setEditing(feature);
    setForm({
      name: feature.name,
      category: feature.category,
      icon: feature.icon ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setMessage("Feature name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const result = await updateAdminFeature(editing.id, {
          name: form.name.trim(),
          category: form.category,
          icon: form.icon.trim() || null,
        });
        setRows((prev) =>
          prev.map((item) => (item.id === editing.id ? result.feature : item)),
        );
        setMessage("Feature updated.");
      } else {
        const result = await createAdminFeature({
          name: form.name.trim(),
          category: form.category,
          icon: form.icon.trim() || null,
        });
        setRows((prev) => [result.feature, ...prev]);
        setMessage("Feature created.");
      }

      setOpen(false);
      setEditing(null);
      setForm(INITIAL_FORM);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save feature.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(feature: AdminFeature) {
    setBusyId(feature.id);
    try {
      const result = await updateAdminFeature(feature.id, {
        isActive: !feature.isActive,
      });
      setRows((prev) =>
        prev.map((item) => (item.id === feature.id ? result.feature : item)),
      );
      setMessage(feature.isActive ? "Feature disabled." : "Feature reactivated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update feature.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Car Features</h1>
          <p style={styles.subtitle}>
            Create and manage the reusable global feature library used by admin and
            provider car setup.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.secondaryBtn} onClick={() => void hydrate()} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button style={styles.primaryBtn} onClick={openCreate}>
            <Plus size={16} />
            Add Feature
          </button>
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{rows.length}</span>
          <span style={styles.summaryLabel}>Total Features</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryValue}>{activeCount}</span>
          <span style={styles.summaryLabel}>Active Features</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <Search size={16} />
            <input
              placeholder="Search feature name or icon"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={styles.searchInput}
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as FeatureCategory | "all")}
            style={styles.select}
          >
            <option value="all">All categories</option>
            {FEATURE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
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

        <span style={styles.helperText}>
          {message || "Global features created here become selectable in Add Car."}
        </span>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Feature</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Icon</th>
              <th style={styles.th}>Status</th>
              <th style={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={styles.empty}>Loading features...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={styles.empty}>No features found.</td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>
                    <div style={styles.primaryText}>{row.name}</div>
                  </td>
                  <td style={styles.td}>{formatLabel(row.category)}</td>
                  <td style={styles.td}>{row.icon || "None"}</td>
                  <td style={styles.td}>
                    <span style={row.isActive ? styles.statusActive : styles.statusDisabled}>
                      {row.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={styles.tdRight}>
                    <button style={styles.iconBtn} onClick={() => openEdit(row)}>
                      <Edit2 size={15} />
                    </button>
                    <button
                      style={styles.iconBtn}
                      onClick={() => void handleToggle(row)}
                      disabled={busyId === row.id}
                    >
                      <Power size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div style={styles.overlay} onClick={() => setOpen(false)}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editing ? "Edit Feature" : "Add Feature"}</h3>
            <div style={styles.formStack}>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Feature Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  style={styles.input}
                />
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Category</span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value as FeatureCategory,
                    }))
                  }
                  style={styles.input}
                >
                  {FEATURE_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {formatLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Icon</span>
                <input
                  value={form.icon}
                  onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
                  style={styles.input}
                  placeholder="camera, shield, snowflake"
                />
              </label>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button style={styles.primaryBtn} onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Feature" : "Create Feature"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1180 },
  header: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "var(--foreground)" },
  subtitle: { margin: "6px 0 0", color: "var(--fg-60)", fontSize: 13, maxWidth: 720 },
  headerActions: { display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  primaryBtn: { height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "#2563EB", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 },
  secondaryBtn: { height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  summaryCard: { border: "1px solid var(--input-border)", borderRadius: 12, background: "var(--surface-2)", padding: 14, display: "flex", flexDirection: "column", gap: 4 },
  summaryValue: { fontSize: 24, fontWeight: 800, color: "var(--foreground)" },
  summaryLabel: { fontSize: 12, color: "var(--fg-60)", textTransform: "uppercase", letterSpacing: 0.5 },
  toolbar: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" },
  filters: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  searchBox: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, minWidth: 280, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--fg-60)" },
  searchInput: { border: "none", outline: "none", background: "transparent", color: "var(--foreground)", width: "100%", fontSize: 14 },
  select: { height: 42, borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", padding: "0 12px", fontSize: 14 },
  helperText: { fontSize: 13, color: "var(--fg-60)" },
  card: { border: "1px solid var(--input-border)", borderRadius: 12, background: "var(--surface-1)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 12, color: "var(--fg-60)", padding: "14px 16px", borderBottom: "1px solid var(--input-border)" },
  thRight: { textAlign: "right", fontSize: 12, color: "var(--fg-60)", padding: "14px 16px", borderBottom: "1px solid var(--input-border)" },
  td: { padding: "14px 16px", borderBottom: "1px solid var(--input-border)", color: "var(--foreground)", fontSize: 14 },
  tdRight: { padding: "14px 16px", borderBottom: "1px solid var(--input-border)", textAlign: "right" },
  empty: { padding: 24, textAlign: "center", color: "var(--fg-60)" },
  primaryText: { fontWeight: 600 },
  statusActive: { display: "inline-flex", padding: "4px 10px", borderRadius: 999, background: "rgba(34,197,94,0.12)", color: "#86efac", fontSize: 12, fontWeight: 700 },
  statusDisabled: { display: "inline-flex", padding: "4px 10px", borderRadius: 999, background: "rgba(239,68,68,0.12)", color: "#fca5a5", fontSize: 12, fontWeight: 700 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", cursor: "pointer", marginLeft: 8 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", padding: 20, zIndex: 1000 },
  modal: { width: "100%", maxWidth: 520, borderRadius: 14, border: "1px solid var(--input-border)", background: "var(--surface-1)", padding: 18, display: "flex", flexDirection: "column", gap: 16 },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "var(--foreground)" },
  formStack: { display: "flex", flexDirection: "column", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, color: "var(--fg-70)", fontWeight: 600 },
  input: { height: 44, borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", padding: "0 12px", outline: "none", fontSize: 14 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10 },
};
