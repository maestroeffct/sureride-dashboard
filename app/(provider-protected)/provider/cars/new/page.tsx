"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, ImagePlus, X, Check, FileSpreadsheet, Download, Upload } from "lucide-react";
import {
  attachProviderCarFeatures,
  createProviderCar,
  listProviderCarMetaBrands,
  listProviderCarMetaModels,
  listProviderFeatureOptions,
  listProviderLocations,
  uploadProviderCarImages,
  type ProviderCarBrandOption,
  type ProviderCarModelOption,
  type ProviderCreateCarPayload,
} from "@/src/lib/providerApi";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "COMPACT" | "ECONOMY" | "LUXURY" | "SUV" | "VAN" | "TRUCK";
type Transmission = "AUTOMATIC" | "MANUAL";
type MileagePolicy = "UNLIMITED" | "LIMITED";

type CarForm = {
  locationId: string;
  brand: string;
  model: string;
  category: Category;
  year: string;
  seats: string;
  bags: string;
  transmission: Transmission;
  mileagePolicy: MileagePolicy;
  hasAC: boolean;
  dailyRate: string;
  hourlyRate: string;
};

type StepKey = "vehicle" | "specs" | "pricing" | "photos" | "review";

const STEPS: { key: StepKey; label: string; short: string }[] = [
  { key: "vehicle", label: "Vehicle Details", short: "Vehicle" },
  { key: "specs", label: "Specs & Features", short: "Specs" },
  { key: "pricing", label: "Pricing", short: "Pricing" },
  { key: "photos", label: "Photos", short: "Photos" },
  { key: "review", label: "Review & Save", short: "Review" },
];

const STEP_ORDER: StepKey[] = STEPS.map((s) => s.key);

const INITIAL: CarForm = {
  locationId: "",
  brand: "",
  model: "",
  category: "ECONOMY",
  year: String(new Date().getFullYear()),
  seats: "",
  bags: "",
  transmission: "AUTOMATIC",
  mileagePolicy: "UNLIMITED",
  hasAC: true,
  dailyRate: "",
  hourlyRate: "",
};

type CsvRow = Record<string, string>;
const CSV_HEADERS = ["brand", "model", "category", "year", "seats", "bags", "transmission", "mileagePolicy", "hasAC", "dailyRate", "hourlyRate", "locationId"];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProviderAddCarPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<StepKey>("vehicle");
  const [form, setForm] = useState<CarForm>(INITIAL);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [csvOpen, setCsvOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [locations, setLocations] = useState<Array<{ id: string; name: string; address: string }>>([]);
  const [brands, setBrands] = useState<ProviderCarBrandOption[]>([]);
  const [models, setModels] = useState<ProviderCarModelOption[]>([]);
  const [featureOptions, setFeatureOptions] = useState<Array<{ id: string; name: string; category: string }>>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [locationRows, brandsRes, modelsRes, featuresRes] = await Promise.all([
          listProviderLocations(),
          listProviderCarMetaBrands(),
          listProviderCarMetaModels(),
          listProviderFeatureOptions(),
        ]);
        setLocations(locationRows.map((r) => ({ id: r.id, name: r.name, address: r.address })));
        setBrands(brandsRes.items);
        setModels(modelsRes.items);
        setFeatureOptions(featuresRes.items.map((i) => ({ id: i.id, name: i.name, category: i.category })));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load form data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const matchingBrand = useMemo(() => {
    const name = form.brand.trim().toLowerCase();
    return name ? (brands.find((b) => b.name.trim().toLowerCase() === name) ?? null) : null;
  }, [brands, form.brand]);

  const modelOptions = useMemo(
    () => (matchingBrand ? models.filter((m) => m.brandId === matchingBrand.id) : models),
    [matchingBrand, models],
  );

  const groupedFeatures = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    featureOptions.forEach((f) => {
      const arr = map.get(f.category) ?? [];
      arr.push({ id: f.id, name: f.name });
      map.set(f.category, arr);
    });
    return Array.from(map.entries());
  }, [featureOptions]);

  const set = <K extends keyof CarForm>(k: K, v: CarForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const toggleFeature = (id: string) =>
    setSelectedFeatureIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ── Image drag-drop ────────────────────────────────────────────────────────
  const addImages = useCallback((files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;
    setImageFiles((p) => [...p, ...valid]);
    setImagePreviews((p) => [...p, ...valid.map((f) => URL.createObjectURL(f))]);
  }, []);

  const removeImage = (i: number) => {
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
    setImagePreviews((p) => {
      URL.revokeObjectURL(p[i]);
      return p.filter((_, idx) => idx !== i);
    });
  };

  // ── Step validity ──────────────────────────────────────────────────────────
  const validity: Record<StepKey, boolean> = useMemo(() => ({
    vehicle: !!(form.brand.trim() && form.model.trim() && form.locationId && form.year.trim()),
    specs: !!(form.seats.trim()),
    pricing: !!(form.dailyRate.trim()),
    photos: true,
    review: true,
  }), [form]);

  const stepIndex = STEP_ORDER.indexOf(activeStep);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEP_ORDER.length - 1;
  const canGoNext = validity[activeStep];

  const goNext = () => {
    if (!canGoNext || saving) return;
    setActiveStep(STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)]);
  };
  const goPrev = () => {
    if (saving) return;
    setActiveStep(STEP_ORDER[Math.max(stepIndex - 1, 0)]);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const payload: ProviderCreateCarPayload = {
        locationId: form.locationId,
        brand: form.brand.trim(),
        model: form.model.trim(),
        category: form.category,
        year: Number(form.year) || new Date().getFullYear(),
        seats: Number(form.seats) || 5,
        bags: form.bags.trim() || "0",
        hasAC: form.hasAC,
        transmission: form.transmission,
        mileagePolicy: form.mileagePolicy,
        dailyRate: Number(form.dailyRate),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
      };
      const res = await createProviderCar(payload);
      const carId = res.car.id;
      if (selectedFeatureIds.length) await attachProviderCarFeatures(carId, selectedFeatureIds);
      if (imageFiles.length) await uploadProviderCarImages(carId, imageFiles);
      toast.success("Car listing created successfully!");
      router.push("/provider/cars");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create car");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={s.gateLoader}>
        <div style={s.gateSpinner} />
      </div>
    );
  }

  return (
    <>
      {csvOpen && (
        <CsvImportModal locations={locations} onClose={() => setCsvOpen(false)} />
      )}

      <div style={s.page}>
        {/* ── Header ── */}
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => router.push("/provider/cars")}>
            <ArrowLeft size={14} /> Back to Fleet
          </button>
          <div style={s.titleRow}>
            <div>
              <h1 style={s.title}>Add New Car</h1>
              <p style={s.subtitle}>List a new vehicle in your rental fleet</p>
            </div>
            <div style={s.headerRight}>
              <button style={s.csvBtn} onClick={() => setCsvOpen(true)}>
                <FileSpreadsheet size={14} /> Bulk Import CSV
              </button>
              <span style={s.stepBadge}>
                Step {stepIndex + 1} of {STEP_ORDER.length}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stepper ── */}
        <div style={s.stepperWrap}>
          <HorizontalStepper
            steps={STEPS}
            active={activeStep}
            completed={validity}
            onSelect={(k) => !saving && setActiveStep(k)}
          />
        </div>

        {/* ── Card ── */}
        <div style={s.card}>
          <div style={s.cardBody}>
            {activeStep === "vehicle" && (
              <StepVehicle
                form={form}
                set={set}
                brands={brands}
                modelOptions={modelOptions}
                locations={locations}
              />
            )}
            {activeStep === "specs" && (
              <StepSpecs form={form} set={set} />
            )}
            {activeStep === "pricing" && (
              <StepPricingFeatures
                form={form}
                set={set}
                groupedFeatures={groupedFeatures}
                selectedFeatureIds={selectedFeatureIds}
                toggleFeature={toggleFeature}
              />
            )}
            {activeStep === "photos" && (
              <StepPhotos
                imagePreviews={imagePreviews}
                dragOver={dragOver}
                setDragOver={setDragOver}
                addImages={addImages}
                removeImage={removeImage}
              />
            )}
            {activeStep === "review" && (
              <StepReview
                form={form}
                selectedFeatureIds={selectedFeatureIds}
                imageCount={imageFiles.length}
                locations={locations}
                onEdit={setActiveStep}
              />
            )}
          </div>

          {/* ── Footer ── */}
          <div style={s.cardFooter}>
            <button style={s.btnCancel} onClick={() => router.push("/provider/cars")}>
              Cancel
            </button>
            <div style={s.footerRight}>
              {!isFirst && (
                <button style={s.btnBack} onClick={goPrev} disabled={saving}>
                  Back
                </button>
              )}
              {isLast ? (
                <button
                  style={{ ...s.btnNext, ...(!saving ? {} : s.btnDisabled) }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Car Listing"}
                </button>
              ) : (
                <button
                  style={{ ...s.btnNext, ...(!canGoNext ? s.btnDisabled : {}) }}
                  onClick={goNext}
                  disabled={!canGoNext}
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Horizontal Stepper ────────────────────────────────────────────────────────

function HorizontalStepper({
  steps,
  active,
  completed,
  onSelect,
}: {
  steps: typeof STEPS;
  active: StepKey;
  completed: Record<StepKey, boolean>;
  onSelect: (k: StepKey) => void;
}) {
  return (
    <div style={st.wrap}>
      {steps.map((step, i) => {
        const isActive = step.key === active;
        const isDone = completed[step.key] && step.key !== active;
        const isPast = STEP_ORDER.indexOf(step.key) < STEP_ORDER.indexOf(active);
        const showDone = isDone && isPast;

        return (
          <div key={step.key} style={st.item}>
            {/* Connector line before */}
            {i > 0 && (
              <div style={{ ...st.line, ...(isPast ? st.lineDone : {}) }} />
            )}

            <button style={st.stepBtn} onClick={() => onSelect(step.key)}>
              <div
                style={{
                  ...st.circle,
                  ...(isActive ? st.circleActive : showDone ? st.circleDone : {}),
                }}
              >
                {showDone ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span style={{ ...st.label, ...(isActive ? st.labelActive : {}) }}>
                {step.short}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  wrap: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  item: {
    display: "flex",
    alignItems: "center",
    flex: 1,
  },
  line: {
    flex: 1,
    height: 2,
    background: "var(--input-border)",
    transition: "background 0.3s",
  },
  lineDone: { background: "var(--brand-secondary)" },
  stepBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0 8px",
    flexShrink: 0,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "2px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--muted-foreground)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    transition: "all 0.25s",
  },
  circleActive: {
    border: "2px solid var(--brand-primary)",
    background: "var(--brand-primary)",
    color: "#fff",
  },
  circleDone: {
    border: "2px solid var(--brand-secondary)",
    background: "var(--brand-secondary)",
    color: "#fff",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    whiteSpace: "nowrap",
  },
  labelActive: { color: "var(--brand-primary)" },
};

// ── Step 1: Vehicle Details ───────────────────────────────────────────────────

function StepVehicle({
  form, set, brands, modelOptions, locations,
}: {
  form: CarForm;
  set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void;
  brands: ProviderCarBrandOption[];
  modelOptions: ProviderCarModelOption[];
  locations: Array<{ id: string; name: string; address: string }>;
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader
        title="Vehicle Identity"
        desc="Select the make, model, and location for this car listing."
      />
      <div style={f.grid2}>
        <Field label="Brand *">
          <input
            style={f.input}
            list="brand-list"
            placeholder="e.g. Toyota"
            value={form.brand}
            onChange={(e) => set("brand", e.target.value)}
          />
          <datalist id="brand-list">
            {brands.map((b) => <option key={b.id} value={b.name} />)}
          </datalist>
        </Field>
        <Field label="Model *">
          <input
            style={f.input}
            list="model-list"
            placeholder="e.g. Camry"
            value={form.model}
            onChange={(e) => set("model", e.target.value)}
          />
          <datalist id="model-list">
            {modelOptions.map((m) => <option key={m.id} value={m.name} />)}
          </datalist>
        </Field>
      </div>
      <div style={f.grid3}>
        <Field label="Category">
          <select style={f.input} value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
            {(["ECONOMY","COMPACT","LUXURY","SUV","VAN","TRUCK"] as Category[]).map((c) => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </Field>
        <Field label="Year *">
          <input
            style={f.input}
            type="number"
            min="1990"
            max={new Date().getFullYear() + 1}
            placeholder="2024"
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
          />
        </Field>
        <Field label="Fleet Location *">
          <select style={f.input} value={form.locationId} onChange={(e) => set("locationId", e.target.value)}>
            <option value="">Select location</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

// ── Step 2: Specs ─────────────────────────────────────────────────────────────

function StepSpecs({ form, set }: { form: CarForm; set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void }) {
  return (
    <div style={f.wrapper}>
      <StepHeader title="Vehicle Specs" desc="Capacity, drivetrain, and comfort options." />
      <div style={f.grid3}>
        <Field label="Seats *">
          <input
            style={f.input}
            type="number"
            min="1"
            max="20"
            placeholder="5"
            value={form.seats}
            onChange={(e) => set("seats", e.target.value)}
          />
        </Field>
        <Field label="Bags">
          <input
            style={f.input}
            placeholder="e.g. 2 medium"
            value={form.bags}
            onChange={(e) => set("bags", e.target.value)}
          />
        </Field>
        <Field label="Air Conditioning">
          <ToggleGroup
            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
            value={form.hasAC ? "yes" : "no"}
            onChange={(v) => set("hasAC", v === "yes")}
          />
        </Field>
      </div>
      <div style={f.grid2}>
        <Field label="Transmission">
          <ToggleGroup
            options={[{ value: "AUTOMATIC", label: "Automatic" }, { value: "MANUAL", label: "Manual" }]}
            value={form.transmission}
            onChange={(v) => set("transmission", v as Transmission)}
          />
        </Field>
        <Field label="Mileage Policy">
          <ToggleGroup
            options={[{ value: "UNLIMITED", label: "Unlimited" }, { value: "LIMITED", label: "Limited" }]}
            value={form.mileagePolicy}
            onChange={(v) => set("mileagePolicy", v as MileagePolicy)}
          />
        </Field>
      </div>
    </div>
  );
}

// ── Step 3: Pricing & Features ────────────────────────────────────────────────

function StepPricingFeatures({
  form, set, groupedFeatures, selectedFeatureIds, toggleFeature,
}: {
  form: CarForm;
  set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void;
  groupedFeatures: [string, Array<{ id: string; name: string }>][];
  selectedFeatureIds: string[];
  toggleFeature: (id: string) => void;
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader title="Pricing & Features" desc="Set daily and hourly rates, then add available amenities." />

      <div style={f.grid2}>
        <Field label="Daily Rate (₦) *">
          <div style={f.inputPrefixed}>
            <span style={f.prefix}>₦</span>
            <input
              style={{ ...f.input, paddingLeft: 34 }}
              type="number"
              min="0"
              placeholder="15,000"
              value={form.dailyRate}
              onChange={(e) => set("dailyRate", e.target.value)}
            />
          </div>
        </Field>
        <Field label="Hourly Rate (₦)">
          <div style={f.inputPrefixed}>
            <span style={f.prefix}>₦</span>
            <input
              style={{ ...f.input, paddingLeft: 34 }}
              type="number"
              min="0"
              placeholder="Optional"
              value={form.hourlyRate}
              onChange={(e) => set("hourlyRate", e.target.value)}
            />
          </div>
        </Field>
      </div>

      {groupedFeatures.length > 0 && (
        <div style={f.featuresBlock}>
          <p style={f.featuresSectionLabel}>Available Features</p>
          <div style={f.featuresCols}>
            {groupedFeatures.map(([cat, items]) => (
              <div key={cat} style={f.featureGroup}>
                <p style={f.featureCat}>{cat}</p>
                {items.map((item) => (
                  <label key={item.id} style={f.checkLabel}>
                    <input
                      type="checkbox"
                      checked={selectedFeatureIds.includes(item.id)}
                      onChange={() => toggleFeature(item.id)}
                      style={f.checkbox}
                    />
                    <span style={{ fontSize: 13 }}>{item.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Photos ────────────────────────────────────────────────────────────

function StepPhotos({
  imagePreviews, dragOver, setDragOver, addImages, removeImage,
}: {
  imagePreviews: string[];
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  addImages: (files: File[]) => void;
  removeImage: (i: number) => void;
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader
        title="Vehicle Photos"
        desc="Upload clear photos — exterior, interior, and any notable details. The first image will be the cover."
      />

      <div
        style={{ ...f.dropZone, ...(dragOver ? f.dropZoneHover : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addImages(Array.from(e.dataTransfer.files)); }}
        onClick={() => document.getElementById("car-img-input")?.click()}
      >
        <input
          id="car-img-input"
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addImages(Array.from(e.target.files ?? []))}
        />
        <ImagePlus size={32} color="var(--muted-foreground)" strokeWidth={1.5} />
        <p style={f.dropTitle}>Drag & drop photos here</p>
        <p style={f.dropHint}>or click to browse · PNG, JPG, WEBP · max 10MB each</p>
      </div>

      {imagePreviews.length > 0 && (
        <div style={f.previewGrid}>
          {imagePreviews.map((url, i) => (
            <div key={i} style={f.previewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={f.previewImg} />
              {i === 0 && <span style={f.coverBadge}>Cover</span>}
              <button style={f.removeBtn} onClick={() => removeImage(i)} title="Remove">
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {imagePreviews.length === 0 && (
        <p style={f.photoHint}>
          At least 3 photos recommended. Cover photo is shown in search results.
        </p>
      )}
    </div>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────────

function StepReview({
  form, selectedFeatureIds, imageCount, locations, onEdit,
}: {
  form: CarForm;
  selectedFeatureIds: string[];
  imageCount: number;
  locations: Array<{ id: string; name: string }>;
  onEdit: (step: StepKey) => void;
}) {
  const locationName = locations.find((l) => l.id === form.locationId)?.name ?? "—";

  return (
    <div style={f.wrapper}>
      <StepHeader title="Review Listing" desc="Check all details before creating the car listing." />

      <div style={f.reviewGrid}>
        <ReviewCard title="Vehicle" onEdit={() => onEdit("vehicle")}>
          <Row label="Brand" value={form.brand || "—"} />
          <Row label="Model" value={form.model || "—"} />
          <Row label="Category" value={form.category} />
          <Row label="Year" value={form.year || "—"} />
          <Row label="Location" value={locationName} />
        </ReviewCard>

        <ReviewCard title="Specs" onEdit={() => onEdit("specs")}>
          <Row label="Seats" value={form.seats || "—"} />
          <Row label="Bags" value={form.bags || "—"} />
          <Row label="Transmission" value={form.transmission} />
          <Row label="Mileage" value={form.mileagePolicy} />
          <Row label="AC" value={form.hasAC ? "Yes" : "No"} />
        </ReviewCard>

        <ReviewCard title="Pricing" onEdit={() => onEdit("pricing")}>
          <Row label="Daily" value={form.dailyRate ? `₦${Number(form.dailyRate).toLocaleString()}` : "—"} />
          <Row label="Hourly" value={form.hourlyRate ? `₦${Number(form.hourlyRate).toLocaleString()}` : "—"} />
          <Row label="Features" value={`${selectedFeatureIds.length} selected`} />
        </ReviewCard>

        <ReviewCard title="Photos" onEdit={() => onEdit("photos")}>
          <Row label="Uploaded" value={`${imageCount} photo${imageCount !== 1 ? "s" : ""}`} />
          {imageCount === 0 && (
            <p style={{ margin: 0, fontSize: 12, color: "#f87171" }}>
              No photos uploaded. Adding photos improves bookings.
            </p>
          )}
        </ReviewCard>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={f.stepHead}>
      <h2 style={f.stepTitle}>{title}</h2>
      <p style={f.stepDesc}>{desc}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={f.field}>
      <label style={f.label}>{label}</label>
      {children}
    </div>
  );
}

function ToggleGroup({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={f.toggleRow}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          style={{ ...f.toggleBtn, ...(value === o.value ? f.toggleActive : f.toggleInactive) }}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div style={f.reviewCard}>
      <div style={f.reviewCardHead}>
        <strong style={f.reviewCardTitle}>{title}</strong>
        <button style={f.editBtn} onClick={onEdit}>Edit</button>
      </div>
      <div style={f.reviewCardBody}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={f.row}>
      <span style={f.rowLabel}>{label}</span>
      <span style={f.rowValue}>{value}</span>
    </div>
  );
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────

function CsvImportModal({
  locations,
  onClose,
}: {
  locations: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<Array<{ row: CsvRow; ok: boolean; msg: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const sample: Record<string, string> = {
      brand: "Toyota", model: "Camry", category: "ECONOMY",
      year: String(new Date().getFullYear()), seats: "5", bags: "2",
      transmission: "AUTOMATIC", mileagePolicy: "UNLIMITED", hasAC: "true",
      dailyRate: "15000", hourlyRate: "2000", locationId: locations[0]?.id ?? "<location-id>",
    };
    const csv = [CSV_HEADERS.join(","), CSV_HEADERS.map((h) => sample[h]).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "car_import_template.csv",
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) { toast.error("No valid rows in CSV"); return; }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const parsed = lines.slice(1).map((line) => {
        const vals = line.split(",");
        const row: CsvRow = {};
        headers.forEach((h, i) => { row[h] = (vals[i] ?? "").trim(); });
        return row;
      });
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setStep("importing");
    const out: typeof results = [];
    for (const row of rows) {
      try {
        await createProviderCar({
          locationId: row.locationid || row.locationId || "",
          brand: row.brand, model: row.model,
          category: (row.category?.toUpperCase() as Category) || "ECONOMY",
          year: Number(row.year) || new Date().getFullYear(),
          seats: Number(row.seats) || 5,
          bags: row.bags || "0",
          hasAC: (row.hasac || row.hasAC) === "true",
          transmission: (row.transmission?.toUpperCase() as Transmission) || "AUTOMATIC",
          mileagePolicy: (row.mileagepolicy?.toUpperCase() as MileagePolicy) || "UNLIMITED",
          dailyRate: Number(row.dailyrate || row.dailyRate),
          hourlyRate: (row.hourlyrate || row.hourlyRate) ? Number(row.hourlyrate || row.hourlyRate) : null,
        });
        out.push({ row, ok: true, msg: "Created" });
      } catch (e) {
        out.push({ row, ok: false, msg: e instanceof Error ? e.message : "Failed" });
      }
    }
    setResults(out);
    setStep("done");
    toast.success(`${out.filter((r) => r.ok).length} of ${out.length} cars imported`);
  };

  return (
    <div style={cm.overlay} onClick={onClose}>
      <div style={cm.modal} onClick={(e) => e.stopPropagation()}>
        <div style={cm.head}>
          <h2 style={cm.title}>
            {step === "upload" ? "Bulk Import Cars" : step === "preview" ? `Preview — ${rows.length} rows` : step === "importing" ? "Importing…" : "Import Complete"}
          </h2>
          <button style={cm.closeBtn} onClick={onClose}>✕</button>
        </div>

        {step === "upload" && (
          <div style={cm.body}>
            <p style={cm.desc}>Download the CSV template, fill in your cars, then upload it here.</p>
            <button style={cm.dlBtn} onClick={downloadTemplate}>
              <Download size={14} /> Download Template
            </button>
            <div style={cm.drop} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
              <Upload size={22} color="var(--muted-foreground)" />
              <p style={cm.dropText}>Click to upload your filled CSV</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div style={cm.body}>
            <div style={cm.tableWrap}>
              <table style={cm.table}>
                <thead><tr>
                  {["brand","model","category","year","dailyRate"].map((h) => <th key={h} style={cm.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={i % 2 ? {} : cm.trAlt}>
                      {["brand","model","category","year","dailyRate"].map((h) => <td key={h} style={cm.td}>{row[h] || row[h.toLowerCase()] || "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={cm.foot}>
              <button style={cm.btnSec} onClick={() => setStep("upload")}>Back</button>
              <button style={cm.btnPri} onClick={handleImport}>Import {rows.length} Cars →</button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div style={{ ...cm.body, alignItems: "center", justifyContent: "center", minHeight: 160, gap: 14 }}>
            <div style={cm.spinner} />
            <p style={cm.desc}>Importing, please wait…</p>
          </div>
        )}

        {step === "done" && (
          <div style={cm.body}>
            <div style={cm.tableWrap}>
              <table style={cm.table}>
                <thead><tr>{["Brand","Model","Status","Note"].map((h) => <th key={h} style={cm.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} style={i % 2 ? {} : cm.trAlt}>
                      <td style={cm.td}>{r.row.brand}</td>
                      <td style={cm.td}>{r.row.model}</td>
                      <td style={{ ...cm.td, color: r.ok ? "var(--brand-secondary)" : "#f87171", fontWeight: 700 }}>{r.ok ? "✓ OK" : "✗ Failed"}</td>
                      <td style={cm.td}>{r.msg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={cm.foot}>
              <button style={cm.btnPri} onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page-level styles ─────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    background: "var(--background)",
    overflow: "hidden",
  },
  gateLoader: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  gateSpinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid var(--input-border)",
    borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    padding: "20px 28px 0",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    flexShrink: 0,
  },
  backBtn: {
    width: "fit-content",
    background: "transparent",
    border: "none",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    padding: 0,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: 750, margin: 0, letterSpacing: -0.4 },
  subtitle: { color: "var(--muted-foreground)", margin: "4px 0 0", fontSize: 13 },
  headerRight: { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  csvBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  stepBadge: {
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    border: "1px solid var(--input-border)",
    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
    color: "var(--brand-primary)",
  },
  stepperWrap: { padding: "18px 28px", flexShrink: 0 },
  card: {
    margin: "0 28px 28px",
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  cardBody: {
    padding: "28px 28px 24px",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    gap: 12,
    flexShrink: 0,
  },
  footerRight: { display: "flex", gap: 10 },
  btnCancel: {
    background: "transparent",
    border: "1px solid var(--input-border)",
    color: "var(--muted-foreground)",
    padding: "9px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },
  btnBack: {
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    color: "var(--foreground)",
    padding: "9px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },
  btnNext: {
    background: "var(--brand-primary)",
    border: "none",
    color: "#fff",
    padding: "9px 22px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  btnDisabled: { opacity: 0.45, cursor: "not-allowed" },
};

// ── Form-level styles (shared across steps) ───────────────────────────────────

const f: Record<string, CSSProperties> = {
  wrapper: { display: "flex", flexDirection: "column", gap: 24 },
  stepHead: { display: "flex", flexDirection: "column", gap: 5 },
  stepTitle: { margin: 0, fontSize: 18, fontWeight: 700 },
  stepDesc: { margin: 0, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.55 },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },

  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: {
    width: "100%",
    height: 44,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-2))",
    color: "var(--input-fg, var(--foreground))",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },

  toggleRow: { display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--input-border)" },
  toggleBtn: { flex: 1, height: 44, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "background 0.15s, color 0.15s" },
  toggleActive: { background: "var(--brand-primary)", color: "#fff" },
  toggleInactive: { background: "var(--surface-2)", color: "var(--muted-foreground)" },

  inputPrefixed: { position: "relative" },
  prefix: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--muted-foreground)", zIndex: 1, pointerEvents: "none" },

  // Features
  featuresBlock: { display: "flex", flexDirection: "column", gap: 14, paddingTop: 8, borderTop: "1px solid var(--input-border)" },
  featuresSectionLabel: { margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted-foreground)" },
  featuresCols: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 },
  featureGroup: { display: "flex", flexDirection: "column", gap: 8 },
  featureCat: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, color: "var(--brand-primary)" },
  checkLabel: { display: "flex", alignItems: "center", gap: 9, cursor: "pointer" },
  checkbox: { accentColor: "var(--brand-primary)", width: 14, height: 14 },

  // Photos
  dropZone: {
    border: "2px dashed var(--input-border)",
    borderRadius: 14,
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    textAlign: "center",
  },
  dropZoneHover: {
    borderColor: "var(--brand-primary)",
    background: "color-mix(in srgb, var(--brand-primary) 5%, transparent)",
  },
  dropTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: "var(--foreground)" },
  dropHint: { margin: 0, fontSize: 12, color: "var(--muted-foreground)" },
  photoHint: { margin: 0, fontSize: 12, color: "var(--muted-foreground)", textAlign: "center" },

  previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 },
  previewWrap: { position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", border: "1px solid var(--input-border)" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  coverBadge: { position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 },
  removeBtn: { position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },

  // Review
  reviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  reviewCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    overflow: "hidden",
    background: "var(--surface-2)",
  },
  reviewCardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid var(--input-border)",
    background: "var(--surface-1)",
  },
  reviewCardTitle: { fontSize: 13, fontWeight: 700 },
  editBtn: { fontSize: 12, background: "none", border: "none", color: "var(--brand-primary)", cursor: "pointer", fontWeight: 600 },
  reviewCardBody: { padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 12, color: "var(--muted-foreground)" },
  rowValue: { fontSize: 13, fontWeight: 600, color: "var(--foreground)" },
};

// ── CSV Modal styles ──────────────────────────────────────────────────────────

const cm: Record<string, CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  modal: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 18, width: 660, maxWidth: "calc(100vw - 40px)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", overflow: "hidden" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--input-border)", flexShrink: 0 },
  title: { margin: 0, fontSize: 17, fontWeight: 700 },
  closeBtn: { background: "transparent", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 16, padding: 0 },
  body: { padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 },
  desc: { margin: 0, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.55 },
  dlBtn: { display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "fit-content" },
  drop: { border: "2px dashed var(--input-border)", borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" },
  dropText: { margin: 0, fontSize: 13, color: "var(--muted-foreground)" },
  tableWrap: { overflowX: "auto", borderRadius: 10, border: "1px solid var(--input-border)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--muted-foreground)", background: "var(--surface-2)", borderBottom: "1px solid var(--input-border)", whiteSpace: "nowrap" },
  td: { padding: "9px 12px", color: "var(--foreground)" },
  trAlt: { background: "color-mix(in srgb, var(--surface-2) 40%, transparent)" },
  foot: { display: "flex", justifyContent: "flex-end", gap: 10 },
  btnSec: { padding: "9px 18px", borderRadius: 10, border: "1px solid var(--input-border)", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 13 },
  btnPri: { padding: "9px 22px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 },
  spinner: { width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.8s linear infinite" },
};
