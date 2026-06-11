"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  adminCreateInsurance,
  adminDeleteInsurance,
  adminListInsurance,
  adminUpdateInsurance,
  type AdminInsurancePackage,
  type ListAdminInsuranceParams,
} from "@/src/lib/adminInsuranceApi";
import { listProviders } from "@/src/lib/providersApi";

type FormState = {
  name: string;
  description: string;
  dailyPrice: string;
  providerId: string;
  carId: string;
  isActive: boolean;
};

const initialForm: FormState = {
  name: "",
  description: "",
  dailyPrice: "",
  providerId: "",
  carId: "",
  isActive: true,
};

type ScopeFilter = "all" | "global" | "provider";

export default function AdminInsurancePage() {
  const [items, setItems] = useState<AdminInsurancePackage[]>([]);
  const [providers, setProviders] = useState<Array<{ id: string; label: string }>>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const load = async (overrides?: ListAdminInsuranceParams) => {
    try {
      setLoading(true);
      const params: ListAdminInsuranceParams = {
        scope: scopeFilter === "all" ? undefined : scopeFilter,
        providerId:
          scopeFilter === "provider" && providerFilter
            ? providerFilter
            : undefined,
        search: search.trim() || undefined,
        ...overrides,
      };
      const response = await adminListInsurance(params);
      setItems(response.items ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load insurance packages",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await listProviders({ limit: 200 });
        setProviders(
          response.items.map((p) => ({
            id: p.id,
            label: p.name ?? `Provider ${p.id.slice(0, 6)}`,
          })),
        );
      } catch {
        // Non-fatal — providers list is for the dropdown
      }
    };
    void loadProviders();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeFilter, providerFilter]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((i) => i.isActive).length,
      global: items.filter((i) => i.isGlobal).length,
    };
  }, [items]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const startEdit = (item: AdminInsurancePackage) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      dailyPrice: String(item.dailyPrice),
      providerId: item.providerId ?? "",
      carId: item.carId ?? "",
      isActive: item.isActive,
    });
    // scroll to top so admin sees the form they're editing
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.dailyPrice.trim()) {
      toast.error("Complete the insurance form");
      return;
    }

    const dailyPrice = Number(form.dailyPrice);
    if (Number.isNaN(dailyPrice) || dailyPrice <= 0) {
      toast.error("Daily price must be greater than zero");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        dailyPrice,
        providerId: form.providerId || null,
        // carId management belongs to the provider portal; admins set scope only
        carId: form.carId || null,
        isActive: form.isActive,
      };

      if (editingId) {
        const response = await adminUpdateInsurance(editingId, payload);
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? response.insurance : item)),
        );
        toast.success(response.message);
      } else {
        const response = await adminCreateInsurance(payload);
        setItems((prev) => [response.insurance, ...prev]);
        toast.success(response.message);
      }

      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save insurance package",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (insuranceId: string) => {
    if (!confirm("Delete this insurance package? This cannot be undone.")) {
      return;
    }
    try {
      setDeletingId(insuranceId);
      const response = await adminDeleteInsurance(insuranceId);
      setItems((prev) => prev.filter((item) => item.id !== insuranceId));
      toast.success(response.message);
      if (editingId === insuranceId) resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete insurance package",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (item: AdminInsurancePackage) => {
    try {
      const response = await adminUpdateInsurance(item.id, {
        isActive: !item.isActive,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? response.insurance : i)),
      );
      toast.success(
        response.insurance.isActive ? "Package activated" : "Package deactivated",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update package",
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Admin · Rentals</p>
          <h1 style={styles.title}>Insurance Packages</h1>
          <p style={styles.subtitle}>
            View and manage every insurance package across all providers. Create
            global packages that apply across the marketplace, or moderate
            provider-owned packages.
          </p>
        </div>
        <div style={styles.statsRow}>
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Active" value={counts.active} />
          <StatCard label="Global (admin)" value={counts.global} />
        </div>
      </div>

      <div style={styles.layout}>
        {/* ── FORM ── */}
        <section style={styles.formCard}>
          <h2 style={styles.cardTitle}>
            {editingId ? "Edit Insurance Package" : "New Insurance Package"}
          </h2>
          <p style={styles.cardText}>
            Leave <strong>Provider</strong> empty to create a global package
            available across the marketplace. Pick a provider to attach the
            package to a specific provider&apos;s fleet.
          </p>

          <div style={styles.formGrid}>
            <Field label="Package Name">
              <input
                style={styles.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </Field>

            <Field label="Daily Price (NGN)">
              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.dailyPrice}
                onChange={(e) => setField("dailyPrice", e.target.value)}
              />
            </Field>

            <Field label="Provider (Scope)">
              <select
                style={styles.input}
                value={form.providerId}
                onChange={(e) => {
                  setField("providerId", e.target.value);
                  // Clear carId when provider changes — car must belong to provider
                  setField("carId", "");
                }}
              >
                <option value="">Global (admin-owned)</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                style={styles.input}
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setField("isActive", e.target.value === "active")
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <Field label="Description">
              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </Field>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.primaryButton}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving..." : editingId ? "Update Package" : "Create Package"}
            </button>
            <button type="button" style={styles.secondaryButton} onClick={resetForm}>
              Clear Form
            </button>
          </div>
        </section>

        {/* ── LIST ── */}
        <section style={styles.listCard}>
          <h2 style={styles.cardTitle}>All Packages</h2>

          {/* Filters */}
          <div style={styles.filtersRow}>
            <select
              style={styles.filterInput}
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
            >
              <option value="all">All scopes</option>
              <option value="global">Global only</option>
              <option value="provider">By provider</option>
            </select>

            {scopeFilter === "provider" && (
              <select
                style={styles.filterInput}
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">Select a provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              style={styles.filterInput}
              placeholder="Search name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
            />
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => void load()}
            >
              Apply
            </button>
          </div>

          {loading ? (
            <div style={styles.empty}>Loading insurance packages...</div>
          ) : items.length === 0 ? (
            <div style={styles.empty}>No insurance packages match the filters.</div>
          ) : (
            <div style={styles.packageList}>
              {items.map((item) => (
                <article key={item.id} style={styles.packageCard}>
                  <div style={styles.packageHeader}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.packageTitleRow}>
                        <h3 style={styles.packageTitle}>{item.name}</h3>
                        <span
                          style={{
                            ...styles.statusPill,
                            ...(item.isActive
                              ? styles.statusPillActive
                              : styles.statusPillInactive),
                          }}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                        {item.isGlobal ? (
                          <span style={{ ...styles.statusPill, ...styles.statusPillGlobal }}>
                            Global
                          </span>
                        ) : null}
                      </div>
                      <p style={styles.packageText}>{item.description}</p>
                    </div>
                    <strong style={styles.packagePrice}>
                      NGN {item.dailyPrice.toLocaleString()}
                      <span style={styles.packagePriceMeta}> / day</span>
                    </strong>
                  </div>

                  <div style={styles.metaRow}>
                    <span style={styles.metaPill}>
                      {item.provider?.name ?? "Admin (global)"}
                    </span>
                    <span style={styles.metaPill}>
                      {item.car?.label ?? "All cars in scope"}
                    </span>
                    <span style={styles.metaPillNeutral}>
                      Created {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={styles.packageActions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => void handleToggleActive(item)}
                    >
                      {item.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      style={styles.dangerButton}
                      disabled={deletingId === item.id}
                      onClick={() => void handleDelete(item.id)}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1360 },
  hero: {
    borderRadius: 28,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(14,116,144,0.26))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 18,
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--fg-60)",
  },
  title: { margin: "8px 0 10px", fontSize: 34, fontWeight: 700 },
  subtitle: { margin: 0, maxWidth: 720, color: "var(--fg-75)", lineHeight: 1.6 },
  statsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  statCard: {
    minWidth: 140,
    borderRadius: 16,
    padding: "14px 16px",
    background: "rgba(15,23,42,0.34)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 24, color: "#fff" },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 0.95fr) minmax(0, 1.05fr)",
    gap: 18,
  },
  formCard: {
    borderRadius: 20,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    alignSelf: "flex-start",
    position: "sticky",
    top: 18,
  },
  listCard: {
    borderRadius: 20,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardTitle: { margin: 0, fontSize: 20, fontWeight: 700 },
  cardText: { margin: 0, color: "var(--fg-60)", fontSize: 14, lineHeight: 1.5 },
  formGrid: { display: "grid", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 12, fontWeight: 700, color: "var(--fg-70)" },
  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  textarea: {
    minHeight: 110,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: 14,
    fontSize: 14,
    resize: "vertical",
    outline: "none",
  },
  actions: { display: "flex", gap: 12, flexWrap: "wrap" },
  primaryButton: {
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerButton: {
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(239,68,68,0.08)",
    color: "#ef4444",
    fontWeight: 700,
    cursor: "pointer",
  },
  empty: {
    padding: 18,
    borderRadius: 14,
    border: "1px dashed var(--input-border)",
    color: "var(--fg-60)",
  },
  filtersRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    paddingBottom: 4,
  },
  filterInput: {
    height: 40,
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 12px",
    fontSize: 13,
    outline: "none",
    minWidth: 160,
  },
  packageList: { display: "flex", flexDirection: "column", gap: 14 },
  packageCard: {
    borderRadius: 16,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  packageHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  packageTitleRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  packageTitle: { margin: 0, fontSize: 18, fontWeight: 700 },
  packageText: { margin: "8px 0 0", color: "var(--fg-60)", lineHeight: 1.5 },
  packagePrice: { fontSize: 20, fontWeight: 700 },
  packagePriceMeta: { color: "var(--fg-60)", fontSize: 12, fontWeight: 600 },
  metaRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  metaPill: {
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(15,118,110,0.12)",
    color: "#0f766e",
    fontSize: 12,
    fontWeight: 700,
  },
  metaPillNeutral: {
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(148,163,184,0.12)",
    color: "var(--fg-60)",
    fontSize: 12,
    fontWeight: 600,
  },
  statusPill: {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statusPillActive: {
    background: "rgba(16,185,129,0.16)",
    color: "#10b981",
  },
  statusPillInactive: {
    background: "rgba(148,163,184,0.16)",
    color: "var(--fg-60)",
  },
  statusPillGlobal: {
    background: "rgba(99,102,241,0.16)",
    color: "#818cf8",
  },
  packageActions: { display: "flex", gap: 10, flexWrap: "wrap" },
};
