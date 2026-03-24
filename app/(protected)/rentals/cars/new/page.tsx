"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createAdminCar, listRentalLocations } from "@/src/lib/carsApi";
import { listProviders, type ProviderSummaryApi } from "@/src/lib/providersApi";

type FormState = {
  providerId: string;
  locationId: string;
  brand: string;
  model: string;
  category: "COMPACT" | "ECONOMY" | "LUXURY";
  year: string;
  seats: string;
  bags: string;
  transmission: "AUTOMATIC" | "MANUAL";
  mileagePolicy: "UNLIMITED" | "LIMITED";
  dailyRate: string;
  hourlyRate: string;
  hasAC: boolean;
  autoApprove: boolean;
  note: string;
};

type RentalLocationOption = {
  id: string;
  name: string;
  address: string;
  providerId: string;
  providerName: string;
};

const initialForm: FormState = {
  providerId: "",
  locationId: "",
  brand: "",
  model: "",
  category: "ECONOMY",
  year: "",
  seats: "",
  bags: "",
  transmission: "AUTOMATIC",
  mileagePolicy: "UNLIMITED",
  dailyRate: "",
  hourlyRate: "",
  hasAC: true,
  autoApprove: false,
  note: "",
};

export default function AddCarPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [providers, setProviders] = useState<ProviderSummaryApi[]>([]);
  const [locations, setLocations] = useState<RentalLocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const [providersResponse, locationRows] = await Promise.all([
          listProviders({ page: 1, limit: 100 }),
          listRentalLocations(),
        ]);

        setProviders(providersResponse.items);
        setLocations(locationRows);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load form options";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadOptions();
  }, []);

  const availableLocations = useMemo(() => {
    if (!form.providerId) return [];
    return locations.filter((location) => location.providerId === form.providerId);
  }, [form.providerId, locations]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      if (key === "providerId") {
        return {
          ...prev,
          providerId: value as FormState["providerId"],
          locationId: "",
        };
      }

      return { ...prev, [key]: value };
    });
  };

  const validate = () => {
    if (!form.providerId) return "Select a provider";
    if (!form.locationId) return "Select a location";
    if (!form.brand.trim()) return "Brand is required";
    if (!form.model.trim()) return "Model is required";
    if (!form.year.trim()) return "Year is required";
    if (!form.seats.trim()) return "Seats is required";
    if (!form.bags.trim()) return "Bags is required";
    if (!form.dailyRate.trim()) return "Daily rate is required";

    const year = Number(form.year);
    if (!Number.isInteger(year)) return "Year must be a whole number";

    const seats = Number(form.seats);
    if (!Number.isInteger(seats) || seats < 1) return "Seats must be at least 1";

    const dailyRate = Number(form.dailyRate);
    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      return "Daily rate must be greater than 0";
    }

    if (form.hourlyRate.trim()) {
      const hourlyRate = Number(form.hourlyRate);
      if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
        return "Hourly rate must be greater than 0";
      }
    }

    return null;
  };

  const onSave = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      const response = await createAdminCar({
        providerId: form.providerId,
        locationId: form.locationId,
        brand: form.brand.trim(),
        model: form.model.trim(),
        category: form.category,
        year: Number(form.year),
        seats: Number(form.seats),
        bags: form.bags.trim(),
        hasAC: form.hasAC,
        transmission: form.transmission,
        mileagePolicy: form.mileagePolicy,
        dailyRate: Number(form.dailyRate),
        hourlyRate: form.hourlyRate.trim() ? Number(form.hourlyRate) : null,
        autoApprove: form.autoApprove,
        note: form.note.trim() || undefined,
      });

      toast.success(response.message || "Car created");
      router.push("/rentals/cars");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create car";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Add Car</h1>
          <p style={styles.subtitle}>
            Create a new rental car listing for a provider and location.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingState}>Loading providers and locations...</div>
        ) : (
          <>
            <div style={styles.grid}>
              <Field label="Provider">
                <select
                  value={form.providerId}
                  onChange={(e) => setField("providerId", e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Location">
                <select
                  value={form.locationId}
                  onChange={(e) => setField("locationId", e.target.value)}
                  style={styles.input}
                  disabled={!form.providerId}
                >
                  <option value="">Select location</option>
                  {availableLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                      {location.address ? ` - ${location.address}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Brand">
                <input
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  placeholder="Toyota"
                  style={styles.input}
                />
              </Field>

              <Field label="Model">
                <input
                  value={form.model}
                  onChange={(e) => setField("model", e.target.value)}
                  placeholder="Corolla"
                  style={styles.input}
                />
              </Field>

              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value as FormState["category"])}
                  style={styles.input}
                >
                  <option value="COMPACT">Compact</option>
                  <option value="ECONOMY">Economy</option>
                  <option value="LUXURY">Luxury</option>
                </select>
              </Field>

              <Field label="Year">
                <input
                  value={form.year}
                  onChange={(e) => setField("year", e.target.value)}
                  placeholder="2024"
                  style={styles.input}
                  inputMode="numeric"
                />
              </Field>

              <Field label="Seats">
                <input
                  value={form.seats}
                  onChange={(e) => setField("seats", e.target.value)}
                  placeholder="4"
                  style={styles.input}
                  inputMode="numeric"
                />
              </Field>

              <Field label="Bags">
                <input
                  value={form.bags}
                  onChange={(e) => setField("bags", e.target.value)}
                  placeholder="2 medium bags"
                  style={styles.input}
                />
              </Field>

              <Field label="Transmission">
                <select
                  value={form.transmission}
                  onChange={(e) =>
                    setField("transmission", e.target.value as FormState["transmission"])
                  }
                  style={styles.input}
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </Field>

              <Field label="Mileage Policy">
                <select
                  value={form.mileagePolicy}
                  onChange={(e) =>
                    setField("mileagePolicy", e.target.value as FormState["mileagePolicy"])
                  }
                  style={styles.input}
                >
                  <option value="UNLIMITED">Unlimited</option>
                  <option value="LIMITED">Limited</option>
                </select>
              </Field>

              <Field label="Daily Rate (NGN)">
                <input
                  value={form.dailyRate}
                  onChange={(e) => setField("dailyRate", e.target.value)}
                  placeholder="25000"
                  style={styles.input}
                  inputMode="decimal"
                />
              </Field>

              <Field label="Hourly Rate (NGN)">
                <input
                  value={form.hourlyRate}
                  onChange={(e) => setField("hourlyRate", e.target.value)}
                  placeholder="4000"
                  style={styles.input}
                  inputMode="decimal"
                />
              </Field>
            </div>

            <div style={styles.stack}>
              <label style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  checked={form.hasAC}
                  onChange={(e) => setField("hasAC", e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Air Conditioning (AC)</span>
              </label>

              <label style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  checked={form.autoApprove}
                  onChange={(e) => setField("autoApprove", e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Auto-approve and activate immediately</span>
              </label>
            </div>

            <Field label="Admin Note">
              <textarea
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="Optional moderation note"
                style={styles.textarea}
              />
            </Field>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.btnSecondary}
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.btnPrimary}
                onClick={onSave}
                disabled={saving || loading}
              >
                {saving ? "Creating..." : "Create Car"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1120,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  subtitle: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  loadingState: {
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--fg-60)",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: "var(--fg-70)",
    fontWeight: 600,
  },
  input: {
    height: 46,
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    minHeight: 110,
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: 12,
    outline: "none",
    fontSize: 14,
    resize: "vertical",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  checkboxWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: "var(--fg-80)",
    fontSize: 14,
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: "#2563EB",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  btnSecondary: {
    height: 44,
    padding: "0 16px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  btnPrimary: {
    height: 44,
    padding: "0 18px",
    borderRadius: 10,
    border: "none",
    background: "#2563EB",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
};
