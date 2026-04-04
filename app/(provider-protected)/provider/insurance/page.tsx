"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  createProviderInsurancePackage,
  deleteProviderInsurancePackage,
  listProviderCars,
  listProviderInsurancePackages,
  updateProviderInsurancePackage,
  type ProviderInsurancePackage,
} from "@/src/lib/providerApi";

type FormState = {
  name: string;
  description: string;
  dailyPrice: string;
  carId: string;
  isActive: boolean;
};

const initialForm: FormState = {
  name: "",
  description: "",
  dailyPrice: "",
  carId: "",
  isActive: true,
};

export default function ProviderInsurancePage() {
  const [items, setItems] = useState<ProviderInsurancePackage[]>([]);
  const [cars, setCars] = useState<Array<{ id: string; label: string }>>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [insuranceResponse, carsResponse] = await Promise.all([
          listProviderInsurancePackages(),
          listProviderCars({ page: 1, limit: 200 }),
        ]);

        setItems(insuranceResponse.items ?? []);
        setCars(
          carsResponse.items.map((car) => ({
            id: car.id,
            label: `${car.brand} ${car.model}`.trim(),
          })),
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load insurance packages",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const startEdit = (item: ProviderInsurancePackage) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      dailyPrice: String(item.dailyPrice),
      carId: item.carId || "",
      isActive: item.isActive,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.dailyPrice.trim()) {
      toast.error("Complete the insurance form");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        dailyPrice: Number(form.dailyPrice),
        carId: form.carId || null,
        isActive: form.isActive,
      };

      if (Number.isNaN(payload.dailyPrice) || payload.dailyPrice <= 0) {
        toast.error("Daily price must be greater than zero");
        return;
      }

      if (editingId) {
        const response = await updateProviderInsurancePackage(editingId, payload);
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingId ? response.insurance : item,
          ),
        );
        toast.success(response.message);
      } else {
        const response = await createProviderInsurancePackage(payload);
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
    try {
      setDeletingId(insuranceId);
      const response = await deleteProviderInsurancePackage(insuranceId);
      setItems((prev) => prev.filter((item) => item.id !== insuranceId));
      toast.success(response.message);
      if (editingId === insuranceId) {
        resetForm();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete insurance package",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Provider Portal</p>
          <h1 style={styles.title}>Insurance Packages</h1>
          <p style={styles.subtitle}>
            Create daily insurance options for your fleet and assign them to every
            car or a specific uploaded vehicle.
          </p>
        </div>

        <div style={styles.statsRow}>
          <StatCard label="Packages" value={items.length} />
          <StatCard label="Active" value={activeCount} />
        </div>
      </div>

      <div style={styles.layout}>
        <section style={styles.formCard}>
          <h2 style={styles.cardTitle}>
            {editingId ? "Edit Insurance Package" : "New Insurance Package"}
          </h2>
          <p style={styles.cardText}>
            If no car is selected, the package becomes available across all of your
            cars.
          </p>

          <div style={styles.formGrid}>
            <Field label="Package Name">
              <input
                style={styles.input}
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
              />
            </Field>

            <Field label="Daily Price">
              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.dailyPrice}
                onChange={(event) => setField("dailyPrice", event.target.value)}
              />
            </Field>

            <Field label="Applies To">
              <select
                style={styles.input}
                value={form.carId}
                onChange={(event) => setField("carId", event.target.value)}
              >
                <option value="">All provider cars</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                style={styles.input}
                value={form.isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setField("isActive", event.target.value === "active")
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
                onChange={(event) => setField("description", event.target.value)}
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
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={resetForm}
            >
              Clear Form
            </button>
          </div>
        </section>

        <section style={styles.listCard}>
          <h2 style={styles.cardTitle}>Saved Packages</h2>

          {loading ? (
            <div style={styles.empty}>Loading insurance packages...</div>
          ) : items.length === 0 ? (
            <div style={styles.empty}>
              No insurance packages yet. Create your first provider coverage option.
            </div>
          ) : (
            <div style={styles.packageList}>
              {items.map((item) => (
                <article key={item.id} style={styles.packageCard}>
                  <div style={styles.packageHeader}>
                    <div>
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
                      {item.car?.label || "All provider cars"}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
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
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
    maxWidth: 1360,
  },
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
  title: {
    margin: "8px 0 10px",
    fontSize: 34,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    maxWidth: 720,
    color: "var(--fg-75)",
    lineHeight: 1.6,
  },
  statsRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
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
  statValue: {
    fontSize: 24,
    color: "#fff",
  },
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
  cardTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },
  cardText: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 14,
    lineHeight: 1.5,
  },
  formGrid: {
    display: "grid",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-70)",
  },
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
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
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
  packageList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
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
  packageTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  packageText: {
    margin: "8px 0 0",
    color: "var(--fg-60)",
    lineHeight: 1.5,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 700,
  },
  packagePriceMeta: {
    color: "var(--fg-60)",
    fontSize: 12,
    fontWeight: 600,
  },
  metaRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  metaPill: {
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(15,118,110,0.12)",
    color: "#0f766e",
    fontSize: 12,
    fontWeight: 700,
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
  packageActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
};
