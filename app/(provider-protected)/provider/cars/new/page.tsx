"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  attachProviderCarFeatures,
  createProviderCar,
  listProviderCarMetaBrands,
  listProviderCarMetaModels,
  listProviderFeatureOptions,
  listProviderLocations,
  submitProviderCar,
  uploadProviderCarImages,
  type ProviderCarBrandOption,
  type ProviderCarModelOption,
  type ProviderCreateCarPayload,
} from "@/src/lib/providerApi";

type FormState = {
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
  submitForApproval: boolean;
  note: string;
};

const initialForm: FormState = {
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
  submitForApproval: true,
  note: "",
};

export default function ProviderAddCarPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; address: string }>>([]);
  const [brands, setBrands] = useState<ProviderCarBrandOption[]>([]);
  const [models, setModels] = useState<ProviderCarModelOption[]>([]);
  const [featureOptions, setFeatureOptions] = useState<
    Array<{ id: string; name: string; category: string }>
  >([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [locationRows, brandsResponse, modelsResponse, featureResponse] =
          await Promise.all([
          listProviderLocations(),
          listProviderCarMetaBrands(),
          listProviderCarMetaModels(),
          listProviderFeatureOptions(),
          ]);

        setLocations(
          locationRows.map((row) => ({
            id: row.id,
            name: row.name,
            address: row.address,
          })),
        );
        setBrands(brandsResponse.items);
        setModels(modelsResponse.items);
        setFeatureOptions(featureResponse.items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
        })));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load add-car form",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const matchingBrand = useMemo(() => {
    const brandName = form.brand.trim().toLowerCase();
    if (!brandName) return null;
    return brands.find((brand) => brand.name.trim().toLowerCase() === brandName) ?? null;
  }, [brands, form.brand]);

  const modelOptions = useMemo(() => {
    if (!matchingBrand) return models;
    return models.filter((model) => model.brandId === matchingBrand.id);
  }, [matchingBrand, models]);

  const groupedFeatures = useMemo(() => {
    const groups = new Map<string, Array<{ id: string; name: string }>>();
    featureOptions.forEach((item) => {
      const current = groups.get(item.category) ?? [];
      current.push({ id: item.id, name: item.name });
      groups.set(item.category, current);
    });
    return Array.from(groups.entries());
  }, [featureOptions]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!form.locationId || !form.brand || !form.model || !form.dailyRate) {
      toast.error("Complete the required fields first");
      return;
    }

    try {
      setSaving(true);

      const payload: ProviderCreateCarPayload = {
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
      };

      const response = await createProviderCar(payload);
      const carId = response.car.id;

      if (selectedFeatureIds.length) {
        await attachProviderCarFeatures(carId, selectedFeatureIds);
      }

      if (imageFiles.length) {
        await uploadProviderCarImages(carId, imageFiles);
      }

      if (form.submitForApproval) {
        await submitProviderCar(carId, form.note.trim() || undefined);
      }

      toast.success(
        form.submitForApproval
          ? "Car created and submitted for approval"
          : "Car saved as draft",
      );
      router.push("/provider/cars");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create car");
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
            Create a new provider listing, attach features, and send it for approval.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <div style={styles.empty}>Loading form...</div>
        ) : (
          <>
            <div style={styles.grid2}>
              <Field label="Location">
                <select
                  style={styles.input}
                  value={form.locationId}
                  onChange={(event) => setField("locationId", event.target.value)}
                >
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.address ? `• ${location.address}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Category">
                <select
                  style={styles.input}
                  value={form.category}
                  onChange={(event) =>
                    setField("category", event.target.value as FormState["category"])
                  }
                >
                  <option value="COMPACT">Compact</option>
                  <option value="ECONOMY">Economy</option>
                  <option value="LUXURY">Luxury</option>
                </select>
              </Field>
            </div>

            <div style={styles.grid2}>
              <Field label="Brand">
                <input
                  style={styles.input}
                  list="provider-brand-options"
                  value={form.brand}
                  onChange={(event) => setField("brand", event.target.value)}
                />
              </Field>
              <Field label="Model">
                <input
                  style={styles.input}
                  list="provider-model-options"
                  value={form.model}
                  onChange={(event) => setField("model", event.target.value)}
                />
              </Field>
            </div>

            <datalist id="provider-brand-options">
              {brands.map((brand) => (
                <option key={brand.id} value={brand.name} />
              ))}
            </datalist>

            <datalist id="provider-model-options">
              {modelOptions.map((model) => (
                <option key={model.id} value={model.name} />
              ))}
            </datalist>

            <div style={styles.grid3}>
              <Field label="Year">
                <input
                  style={styles.input}
                  value={form.year}
                  onChange={(event) => setField("year", event.target.value)}
                />
              </Field>
              <Field label="Seats">
                <input
                  style={styles.input}
                  value={form.seats}
                  onChange={(event) => setField("seats", event.target.value)}
                />
              </Field>
              <Field label="Bags">
                <input
                  style={styles.input}
                  value={form.bags}
                  onChange={(event) => setField("bags", event.target.value)}
                />
              </Field>
            </div>

            <div style={styles.grid3}>
              <Field label="Transmission">
                <select
                  style={styles.input}
                  value={form.transmission}
                  onChange={(event) =>
                    setField(
                      "transmission",
                      event.target.value as FormState["transmission"],
                    )
                  }
                >
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </Field>
              <Field label="Mileage Policy">
                <select
                  style={styles.input}
                  value={form.mileagePolicy}
                  onChange={(event) =>
                    setField(
                      "mileagePolicy",
                      event.target.value as FormState["mileagePolicy"],
                    )
                  }
                >
                  <option value="UNLIMITED">Unlimited</option>
                  <option value="LIMITED">Limited</option>
                </select>
              </Field>
              <Field label="Air Conditioning">
                <select
                  style={styles.input}
                  value={form.hasAC ? "yes" : "no"}
                  onChange={(event) => setField("hasAC", event.target.value === "yes")}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>

            <div style={styles.grid2}>
              <Field label="Daily Rate">
                <input
                  style={styles.input}
                  value={form.dailyRate}
                  onChange={(event) => setField("dailyRate", event.target.value)}
                />
              </Field>
              <Field label="Hourly Rate">
                <input
                  style={styles.input}
                  value={form.hourlyRate}
                  onChange={(event) => setField("hourlyRate", event.target.value)}
                />
              </Field>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Features</h2>
              <div style={styles.featureGroups}>
                {groupedFeatures.map(([category, items]) => (
                  <div key={category} style={styles.featureGroup}>
                    <strong style={styles.featureTitle}>{category}</strong>
                    <div style={styles.featureItems}>
                      {items.map((item) => (
                        <label key={item.id} style={styles.checkRow}>
                          <input
                            type="checkbox"
                            checked={selectedFeatureIds.includes(item.id)}
                            onChange={() =>
                              setSelectedFeatureIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id],
                              )
                            }
                          />
                          {item.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Images</h2>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setImageFiles(Array.from(event.target.files ?? []))
                }
              />
            </div>

            <div style={styles.section}>
              <label style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={form.submitForApproval}
                  onChange={(event) =>
                    setField("submitForApproval", event.target.checked)
                  }
                />
                Submit for admin approval after save
              </label>

              <textarea
                style={styles.textarea}
                value={form.note}
                onChange={(event) => setField("note", event.target.value)}
                placeholder="Optional note for the admin reviewer"
              />
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Car"}
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
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1080 },
  header: { display: "flex", justifyContent: "space-between", gap: 16 },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: "6px 0 0", color: "var(--fg-60)", fontSize: 13 },
  card: {
    borderRadius: 18,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "var(--fg-60)",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  },
  featureGroups: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  featureGroup: {
    borderRadius: 14,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  featureTitle: {
    fontSize: 13,
    color: "var(--fg-70)",
  },
  featureItems: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "var(--foreground)",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: 12,
    fontSize: 14,
    outline: "none",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  empty: { padding: 24, textAlign: "center", color: "var(--fg-60)" },
};
