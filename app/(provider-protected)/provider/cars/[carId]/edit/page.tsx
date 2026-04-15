"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { ArrowLeft, Trash2, Star, Upload, AlertTriangle } from "lucide-react";
import {
  getProviderCar,
  updateProviderCar,
  deleteProviderCarImage,
  uploadProviderCarImages,
  attachProviderCarFeatures,
  submitProviderCar,
  listProviderLocations,
  listProviderCarMetaBrands,
  listProviderCarMetaModels,
  listProviderFeatureOptions,
  type ProviderCarDetail,
  type ProviderCarBrandOption,
  type ProviderCarModelOption,
} from "@/src/lib/providerApi";

type FormState = {
  locationId: string;
  brand: string;
  model: string;
  category: string;
  year: string;
  seats: string;
  bags: string;
  transmission: string;
  mileagePolicy: string;
  dailyRate: string;
  hourlyRate: string;
  hasAC: boolean;
};

export default function ProviderEditCarPage() {
  const { carId } = useParams<{ carId: string }>();
  const router = useRouter();

  const [car, setCar] = useState<ProviderCarDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; address: string }>>([]);
  const [brands, setBrands] = useState<ProviderCarBrandOption[]>([]);
  const [models, setModels] = useState<ProviderCarModelOption[]>([]);
  const [featureOptions, setFeatureOptions] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [carData, locationRows, brandsResponse, modelsResponse, featureResponse] =
          await Promise.all([
            getProviderCar(carId),
            listProviderLocations(),
            listProviderCarMetaBrands(),
            listProviderCarMetaModels(),
            listProviderFeatureOptions(),
          ]);

        setCar(carData);
        setForm({
          locationId: carData.locationId ?? "",
          brand: carData.brand ?? "",
          model: carData.model ?? "",
          category: carData.category ?? "ECONOMY",
          year: carData.year != null ? String(carData.year) : "",
          seats: carData.seats != null ? String(carData.seats) : "",
          bags: carData.bags ?? "",
          transmission: carData.transmission ?? "AUTOMATIC",
          mileagePolicy: carData.mileagePolicy ?? "UNLIMITED",
          dailyRate: String(carData.dailyRate ?? ""),
          hourlyRate: carData.hourlyRate != null ? String(carData.hourlyRate) : "",
          hasAC: carData.hasAC ?? true,
        });
        setSelectedFeatureIds(carData.features.map((f) => f.featureId));
        setLocations(locationRows.map((row) => ({ id: row.id, name: row.name, address: row.address })));
        setBrands(brandsResponse.items);
        setModels(modelsResponse.items);
        setFeatureOptions(featureResponse.items.map((item) => ({ id: item.id, name: item.name, category: item.category })));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load car");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [carId]);

  const matchingBrand = useMemo(() => {
    if (!form) return null;
    const brandName = form.brand.trim().toLowerCase();
    if (!brandName) return null;
    return brands.find((b) => b.name.trim().toLowerCase() === brandName) ?? null;
  }, [brands, form]);

  const modelOptions = useMemo(() => {
    if (!matchingBrand) return models;
    return models.filter((m) => m.brandId === matchingBrand.id);
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
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleNewImages = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setNewImageFiles(arr);
    setNewImagePreviews(arr.map((f) => URL.createObjectURL(f)));
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!car) return;
    if (!confirm("Delete this image?")) return;
    try {
      setDeletingImageId(imageId);
      await deleteProviderCarImage(carId, imageId);
      setCar((prev) =>
        prev ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) } : prev,
      );
      toast.success("Image deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const onSave = async () => {
    if (!form) return;
    if (!form.locationId || !form.brand || !form.model || !form.dailyRate) {
      toast.error("Complete required fields: location, brand, model, daily rate");
      return;
    }

    try {
      setSaving(true);

      await updateProviderCar(carId, {
        locationId: form.locationId,
        brand: form.brand.trim(),
        model: form.model.trim(),
        category: form.category,
        year: form.year ? Number(form.year) : undefined,
        seats: form.seats ? Number(form.seats) : undefined,
        bags: form.bags.trim() || undefined,
        hasAC: form.hasAC,
        transmission: form.transmission,
        mileagePolicy: form.mileagePolicy,
        dailyRate: Number(form.dailyRate),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
      });

      await attachProviderCarFeatures(carId, selectedFeatureIds);

      if (newImageFiles.length) {
        await uploadProviderCarImages(carId, newImageFiles);
        setNewImageFiles([]);
        setNewImagePreviews([]);
      }

      // Refresh car data to pick up new images and updated status
      const updated = await getProviderCar(carId);
      setCar(updated);

      toast.success("Car updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update car");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!car) return;
    if (!confirm("Submit this car for admin approval?")) return;
    try {
      setSaving(true);
      await submitProviderCar(carId);
      const updated = await getProviderCar(carId);
      setCar(updated);
      toast.success("Submitted for approval");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={s.loading}>Loading car details...</div>;
  }

  if (!car || !form) {
    return <div style={s.loading}>Car not found.</div>;
  }

  const isFlagged = car.status === "FLAGGED";
  const isDraftOrRejected = car.status === "DRAFT" || car.status === "REJECTED";

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <Link href="/provider/cars" style={s.backLink}>
          <ArrowLeft size={18} />
          Back to Fleet
        </Link>
        <div>
          <h1 style={s.title}>Edit Car</h1>
          <p style={s.subtitle}>
            {car.brand} {car.model} &nbsp;·&nbsp;
            <span style={statusPill(car.status)}>{car.status}</span>
          </p>
        </div>
      </div>

      {/* Flagged warning */}
      {isFlagged && (
        <div style={s.alertBanner}>
          <AlertTriangle size={16} />
          <span>
            This car has been flagged by an admin: &quot;{car.flaggedReason ?? "No reason provided"}&quot;.
            Please contact support to resolve this before making changes.
          </span>
        </div>
      )}

      {/* Moderation note */}
      {car.moderationNote && !isFlagged && (
        <div style={s.infoBanner}>
          <AlertTriangle size={15} />
          <span>Admin note: {car.moderationNote}</span>
        </div>
      )}

      {/* Images section */}
      <div style={s.card}>
        <h2 style={s.sectionTitle}>Car Images</h2>

        {car.images.length > 0 && (
          <div style={s.imageGrid}>
            {car.images.map((img) => (
              <div key={img.id} style={s.imageItem}>
                <div style={s.imageWrapper}>
                  <Image
                    src={img.url}
                    alt="Car"
                    fill
                    style={{ objectFit: "cover", borderRadius: 12 }}
                  />
                  {img.isPrimary && (
                    <div style={s.primaryBadge}>
                      <Star size={10} fill="currentColor" /> Primary
                    </div>
                  )}
                </div>
                <button
                  style={s.deleteImgBtn}
                  onClick={() => handleDeleteImage(img.id)}
                  disabled={deletingImageId === img.id || isFlagged}
                  title="Delete image"
                >
                  <Trash2 size={13} />
                  {deletingImageId === img.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload new */}
        <div style={s.uploadRow}>
          <label style={s.uploadLabel}>
            <Upload size={16} />
            <span>Add Images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleNewImages(e.target.files)}
              disabled={isFlagged}
            />
          </label>
          {newImagePreviews.length > 0 && (
            <span style={s.uploadCount}>{newImagePreviews.length} new image(s) selected</span>
          )}
        </div>

        {newImagePreviews.length > 0 && (
          <div style={s.imageGrid}>
            {newImagePreviews.map((src, idx) => (
              <div key={idx} style={s.imageItem}>
                <div style={s.imageWrapper}>
                  <Image src={src} alt="Preview" fill style={{ objectFit: "cover", borderRadius: 12 }} />
                  <div style={s.newBadge}>New</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details form */}
      <div style={s.card}>
        <h2 style={s.sectionTitle}>Car Details</h2>

        <div style={s.grid2}>
          <Field label="Location *">
            <select
              style={s.input}
              value={form.locationId}
              onChange={(e) => setField("locationId", e.target.value)}
              disabled={isFlagged}
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}{loc.address ? ` · ${loc.address}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Category *">
            <select
              style={s.input}
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              disabled={isFlagged}
            >
              <option value="COMPACT">Compact</option>
              <option value="ECONOMY">Economy</option>
              <option value="LUXURY">Luxury</option>
            </select>
          </Field>
        </div>

        <div style={s.grid2}>
          <Field label="Brand *">
            <input
              style={s.input}
              list="edit-brand-options"
              value={form.brand}
              onChange={(e) => setField("brand", e.target.value)}
              disabled={isFlagged}
            />
            <datalist id="edit-brand-options">
              {brands.map((b) => <option key={b.id} value={b.name} />)}
            </datalist>
          </Field>
          <Field label="Model *">
            <input
              style={s.input}
              list="edit-model-options"
              value={form.model}
              onChange={(e) => setField("model", e.target.value)}
              disabled={isFlagged}
            />
            <datalist id="edit-model-options">
              {modelOptions.map((m) => <option key={m.id} value={m.name} />)}
            </datalist>
          </Field>
        </div>

        <div style={s.grid3}>
          <Field label="Year">
            <input
              style={s.input}
              type="number"
              value={form.year}
              onChange={(e) => setField("year", e.target.value)}
              disabled={isFlagged}
            />
          </Field>
          <Field label="Seats">
            <input
              style={s.input}
              type="number"
              value={form.seats}
              onChange={(e) => setField("seats", e.target.value)}
              disabled={isFlagged}
            />
          </Field>
          <Field label="Bags">
            <input
              style={s.input}
              value={form.bags}
              onChange={(e) => setField("bags", e.target.value)}
              disabled={isFlagged}
            />
          </Field>
        </div>

        <div style={s.grid3}>
          <Field label="Transmission">
            <select
              style={s.input}
              value={form.transmission}
              onChange={(e) => setField("transmission", e.target.value)}
              disabled={isFlagged}
            >
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </select>
          </Field>
          <Field label="Mileage Policy">
            <select
              style={s.input}
              value={form.mileagePolicy}
              onChange={(e) => setField("mileagePolicy", e.target.value)}
              disabled={isFlagged}
            >
              <option value="UNLIMITED">Unlimited</option>
              <option value="LIMITED">Limited</option>
            </select>
          </Field>
          <Field label="Air Conditioning">
            <select
              style={s.input}
              value={form.hasAC ? "yes" : "no"}
              onChange={(e) => setField("hasAC", e.target.value === "yes")}
              disabled={isFlagged}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>

        <div style={s.grid2}>
          <Field label="Daily Rate (NGN) *">
            <input
              style={s.input}
              type="number"
              value={form.dailyRate}
              onChange={(e) => setField("dailyRate", e.target.value)}
              disabled={isFlagged}
            />
          </Field>
          <Field label="Hourly Rate (NGN)">
            <input
              style={s.input}
              type="number"
              value={form.hourlyRate}
              onChange={(e) => setField("hourlyRate", e.target.value)}
              placeholder="Optional"
              disabled={isFlagged}
            />
          </Field>
        </div>
      </div>

      {/* Features */}
      <div style={s.card}>
        <h2 style={s.sectionTitle}>Features</h2>
        <div style={s.featureGroups}>
          {groupedFeatures.map(([category, items]) => (
            <div key={category} style={s.featureGroup}>
              <strong style={s.featureGroupTitle}>{category}</strong>
              <div style={s.featureItems}>
                {items.map((item) => (
                  <label key={item.id} style={s.checkRow}>
                    <input
                      type="checkbox"
                      checked={selectedFeatureIds.includes(item.id)}
                      disabled={isFlagged}
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

      {/* Actions */}
      <div style={s.actions}>
        {isDraftOrRejected && (
          <button
            type="button"
            style={s.submitBtn}
            onClick={handleSubmitForApproval}
            disabled={saving || isFlagged}
          >
            Submit for Approval
          </button>
        )}
        <button
          type="button"
          style={isFlagged ? s.disabledBtn : s.saveBtn}
          onClick={onSave}
          disabled={saving || isFlagged}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {isFlagged && (
        <p style={s.flaggedNote}>
          This car is flagged and cannot be edited until an admin resolves the issue.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={s.field}>
      <span style={s.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function statusPill(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    APPROVED:        { ...pill, background: "rgba(34,197,94,0.14)",  color: "#16a34a" },
    PENDING_APPROVAL:{ ...pill, background: "rgba(250,204,21,0.14)", color: "#a16207" },
    FLAGGED:         { ...pill, background: "rgba(239,68,68,0.14)",  color: "#dc2626" },
    REJECTED:        { ...pill, background: "rgba(244,63,94,0.14)",  color: "#be123c" },
    DRAFT:           { ...pill, background: "rgba(148,163,184,0.14)",color: "#475569" },
  };
  return map[status] ?? pill;
}

const pill: React.CSSProperties = {
  display: "inline-flex",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const s: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 20, maxWidth: 1080, paddingBottom: 40 },
  loading: { padding: 40, textAlign: "center", color: "var(--fg-60)" },

  header: { display: "flex", flexDirection: "column", gap: 6 },
  backLink: {
    display: "inline-flex", alignItems: "center", gap: 6,
    color: "var(--fg-60)", textDecoration: "none", fontSize: 13,
    marginBottom: 4,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: "4px 0 0", color: "var(--fg-60)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 },

  alertBanner: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "14px 16px", borderRadius: 14,
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
    color: "#dc2626", fontSize: 13,
  },
  infoBanner: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "14px 16px", borderRadius: 14,
    background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.3)",
    color: "#a16207", fontSize: 13,
  },

  card: {
    borderRadius: 18, border: "1px solid var(--input-border)",
    background: "var(--surface-1)", padding: "20px 24px",
    display: "flex", flexDirection: "column", gap: 18,
  },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 700 },

  /* images */
  imageGrid: { display: "flex", flexWrap: "wrap", gap: 12 },
  imageItem: { display: "flex", flexDirection: "column", gap: 6 },
  imageWrapper: {
    position: "relative", width: 140, height: 100,
    borderRadius: 12, overflow: "hidden",
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
  },
  primaryBadge: {
    position: "absolute", bottom: 6, left: 6,
    display: "inline-flex", alignItems: "center", gap: 3,
    background: "rgba(0,0,0,0.65)", color: "#fbbf24",
    fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 999,
  },
  newBadge: {
    position: "absolute", top: 6, right: 6,
    background: "var(--brand-primary)", color: "#fff",
    fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
  },
  deleteImgBtn: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.08)", color: "#dc2626",
    fontSize: 12, cursor: "pointer", fontWeight: 600,
  },
  uploadRow: { display: "flex", alignItems: "center", gap: 12 },
  uploadLabel: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 16px", borderRadius: 10,
    border: "1px dashed var(--input-border)",
    color: "var(--fg-60)", fontSize: 13, cursor: "pointer", fontWeight: 600,
  },
  uploadCount: { fontSize: 13, color: "var(--fg-60)" },

  /* form */
  grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: "var(--fg-60)" },
  input: {
    width: "100%", height: 44, borderRadius: 12,
    border: "1px solid var(--input-border)", background: "var(--surface-2)",
    color: "var(--foreground)", padding: "0 12px", fontSize: 14, outline: "none",
  },

  /* features */
  featureGroups: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14 },
  featureGroup: {
    borderRadius: 14, border: "1px solid var(--input-border)",
    background: "var(--surface-2)", padding: 14,
    display: "flex", flexDirection: "column", gap: 10,
  },
  featureGroupTitle: { fontSize: 12, color: "var(--fg-70)", textTransform: "uppercase", letterSpacing: "0.05em" },
  featureItems: { display: "flex", flexDirection: "column", gap: 8 },
  checkRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--foreground)", cursor: "pointer" },

  /* actions */
  actions: { display: "flex", justifyContent: "flex-end", gap: 12 },
  saveBtn: {
    padding: "12px 24px", borderRadius: 12, border: "none",
    background: "var(--brand-primary)", color: "#fff", fontWeight: 700, cursor: "pointer",
  },
  submitBtn: {
    padding: "12px 24px", borderRadius: 12,
    border: "1px solid var(--brand-primary)",
    background: "transparent", color: "var(--brand-primary)", fontWeight: 700, cursor: "pointer",
  },
  disabledBtn: {
    padding: "12px 24px", borderRadius: 12, border: "none",
    background: "var(--surface-2)", color: "var(--fg-40)", fontWeight: 700, cursor: "not-allowed",
  },
  flaggedNote: { textAlign: "right", fontSize: 12, color: "var(--fg-60)" },
};
