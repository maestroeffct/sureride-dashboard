"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Check, ImagePlus, X, ShieldCheck } from "lucide-react";
import {
  attachAdminCarFeatures,
  createAdminCar,
  listAdminCarFeatureOptions,
  listRentalLocations,
  uploadAdminCarImages,
  type AdminCarFeatureOption,
} from "@/src/lib/carsApi";
import {
  listCarMetadataDraft,
  type CarBrandConfig,
  type CarModelConfig,
} from "@/src/lib/carMetadataDraftApi";
import { listProviders, type ProviderSummaryApi } from "@/src/lib/providersApi";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "COMPACT" | "ECONOMY" | "LUXURY" | "SUV" | "VAN" | "TRUCK";
type Transmission = "AUTOMATIC" | "MANUAL";
type MileagePolicy = "UNLIMITED" | "LIMITED";

type CarForm = {
  providerId: string;
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

type StepKey = "assignment" | "vehicle" | "specs" | "pricing" | "review";

const STEPS: { key: StepKey; label: string; short: string }[] = [
  { key: "assignment", label: "Provider & Location", short: "Assignment" },
  { key: "vehicle", label: "Vehicle Details", short: "Vehicle" },
  { key: "specs", label: "Specs & Features", short: "Specs" },
  { key: "pricing", label: "Pricing & Photos", short: "Pricing" },
  { key: "review", label: "Review & Options", short: "Review" },
];

const STEP_ORDER: StepKey[] = STEPS.map((s) => s.key);

const INITIAL: CarForm = {
  providerId: "",
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
  autoApprove: false,
  note: "",
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAddCarPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<StepKey>("assignment");
  const [form, setForm] = useState<CarForm>(INITIAL);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [createdCarId, setCreatedCarId] = useState<string | null>(null);

  const [providers, setProviders] = useState<ProviderSummaryApi[]>([]);
  const [locations, setLocations] = useState<RentalLocationOption[]>([]);
  const [brands, setBrands] = useState<CarBrandConfig[]>([]);
  const [models, setModels] = useState<CarModelConfig[]>([]);
  const [featureOptions, setFeatureOptions] = useState<AdminCarFeatureOption[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [providersRes, locationRows, metadata] = await Promise.all([
          listProviders({ page: 1, limit: 100 }),
          listRentalLocations(),
          listCarMetadataDraft(),
        ]);
        setProviders(providersRes.items);
        setLocations(locationRows);
        setBrands(metadata.brands.filter((b) => b.isActive));
        setModels(metadata.models.filter((m) => m.isActive));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load form data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!form.providerId) return;
    setLoadingFeatures(true);
    listAdminCarFeatureOptions(form.providerId || undefined)
      .then((r) => setFeatureOptions(r.items ?? []))
      .catch(() => {})
      .finally(() => setLoadingFeatures(false));
  }, [form.providerId]);

  const availableLocations = useMemo(
    () => locations.filter((l) => l.providerId === form.providerId),
    [form.providerId, locations],
  );

  const matchingBrand = useMemo(() => {
    const name = form.brand.trim().toLowerCase();
    return name ? (brands.find((b) => b.name.trim().toLowerCase() === name) ?? null) : null;
  }, [brands, form.brand]);

  const modelOptions = useMemo(
    () => (matchingBrand ? models.filter((m) => m.brandId === matchingBrand.id) : models),
    [matchingBrand, models],
  );

  const groupedFeatures = useMemo(() => {
    const map = new Map<string, AdminCarFeatureOption[]>();
    for (const f of featureOptions) {
      const key = f.category || "OTHER";
      const arr = map.get(key) ?? [];
      arr.push(f);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([cat, items]) => ({
      cat,
      items: items.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [featureOptions]);

  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === form.providerId) ?? null,
    [providers, form.providerId],
  );

  const selectedLocation = useMemo(
    () => availableLocations.find((l) => l.id === form.locationId) ?? null,
    [availableLocations, form.locationId],
  );

  const set = <K extends keyof CarForm>(k: K, v: CarForm[K]) =>
    setForm((p) => {
      if (k === "providerId") return { ...p, [k]: v, locationId: "" };
      return { ...p, [k]: v };
    });

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
    setImagePreviews((p) => { URL.revokeObjectURL(p[i]); return p.filter((_, idx) => idx !== i); });
  };

  // ── Step validity ──────────────────────────────────────────────────────────
  const validity: Record<StepKey, boolean> = useMemo(() => ({
    assignment: !!(form.providerId && form.locationId),
    vehicle: !!(form.brand.trim() && form.model.trim() && form.year.trim()),
    specs: !!(form.seats.trim()),
    pricing: !!(form.dailyRate.trim()),
    review: true,
  }), [form]);

  const stepIndex = STEP_ORDER.indexOf(activeStep);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEP_ORDER.length - 1;
  const canGoNext = validity[activeStep];

  const goNext = () => { if (!canGoNext || saving) return; setActiveStep(STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)]); };
  const goPrev = () => { if (saving) return; setActiveStep(STEP_ORDER[Math.max(stepIndex - 1, 0)]); };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      let carId = createdCarId;
      let msg = "Car created";

      if (!carId) {
        const res = await createAdminCar({
          providerId: form.providerId,
          locationId: form.locationId,
          brand: form.brand.trim(),
          model: form.model.trim(),
          category: form.category,
          year: Number(form.year),
          seats: Number(form.seats) || 5,
          bags: form.bags.trim() || "0",
          hasAC: form.hasAC,
          transmission: form.transmission,
          mileagePolicy: form.mileagePolicy,
          dailyRate: Number(form.dailyRate),
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
          autoApprove: form.autoApprove,
          note: form.note.trim() || undefined,
        });
        carId = res.car.id;
        msg = res.message || msg;
        setCreatedCarId(carId);
      }

      if (selectedFeatureIds.length) await attachAdminCarFeatures(carId, selectedFeatureIds);
      if (imageFiles.length) await uploadAdminCarImages(carId, imageFiles);

      toast.success(form.autoApprove ? "Car created and activated" : msg);
      router.push("/rentals/cars");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create car");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={s.gateLoader}><div style={s.gateSpinner} /></div>;
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.push("/rentals/cars")}>
          <ArrowLeft size={14} /> Back to Cars
        </button>
        <div style={s.titleRow}>
          <div>
            <h1 style={s.title}>Add Car</h1>
            <p style={s.subtitle}>Create a new rental car listing under a provider fleet</p>
          </div>
          <span style={s.stepBadge}>Step {stepIndex + 1} of {STEP_ORDER.length}</span>
        </div>
      </div>

      {/* Stepper */}
      <div style={s.stepperWrap}>
        <HorizontalStepper steps={STEPS} active={activeStep} completed={validity} onSelect={(k) => !saving && setActiveStep(k)} />
      </div>

      {/* Card */}
      <div style={s.card}>
        <div style={s.cardBody}>
          {activeStep === "assignment" && (
            <StepAssignment
              form={form} set={set}
              providers={providers}
              availableLocations={availableLocations}
            />
          )}
          {activeStep === "vehicle" && (
            <StepVehicle
              form={form} set={set}
              brands={brands}
              modelOptions={modelOptions}
            />
          )}
          {activeStep === "specs" && (
            <StepSpecs
              form={form} set={set}
              loadingFeatures={loadingFeatures}
              groupedFeatures={groupedFeatures}
              selectedFeatureIds={selectedFeatureIds}
              toggleFeature={toggleFeature}
            />
          )}
          {activeStep === "pricing" && (
            <StepPricingPhotos
              form={form} set={set}
              imagePreviews={imagePreviews}
              dragOver={dragOver}
              setDragOver={setDragOver}
              addImages={addImages}
              removeImage={removeImage}
            />
          )}
          {activeStep === "review" && (
            <StepReview
              form={form} set={set}
              selectedProvider={selectedProvider}
              selectedLocation={selectedLocation}
              selectedFeatureIds={selectedFeatureIds}
              imageCount={imageFiles.length}
              onEdit={setActiveStep}
            />
          )}
        </div>

        {/* Footer */}
        <div style={s.cardFooter}>
          <button style={s.btnCancel} onClick={() => router.push("/rentals/cars")}>Cancel</button>
          <div style={s.footerRight}>
            {!isFirst && <button style={s.btnBack} onClick={goPrev} disabled={saving}>Back</button>}
            {isLast ? (
              <button
                style={{ ...s.btnNext, ...(!saving ? {} : s.btnDisabled) }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Creating…" : form.autoApprove ? "Create & Activate Car" : "Create Car"}
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
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function HorizontalStepper({ steps, active, completed, onSelect }: {
  steps: typeof STEPS;
  active: StepKey;
  completed: Record<StepKey, boolean>;
  onSelect: (k: StepKey) => void;
}) {
  return (
    <div style={st.wrap}>
      {steps.map((step, i) => {
        const isActive = step.key === active;
        const isPast = STEP_ORDER.indexOf(step.key) < STEP_ORDER.indexOf(active);
        const isDone = completed[step.key] && isPast;
        return (
          <div key={step.key} style={st.item}>
            {i > 0 && <div style={{ ...st.line, ...(isPast ? st.lineDone : {}) }} />}
            <button style={st.btn} onClick={() => onSelect(step.key)}>
              <div style={{ ...st.circle, ...(isActive ? st.circleActive : isDone ? st.circleDone : {}) }}>
                {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span style={{ ...st.label, ...(isActive ? st.labelActive : {}) }}>{step.short}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  wrap: { display: "flex", alignItems: "center", width: "100%" },
  item: { display: "flex", alignItems: "center", flex: 1 },
  line: { flex: 1, height: 2, background: "var(--input-border)", transition: "background 0.3s" },
  lineDone: { background: "var(--brand-secondary)" },
  btn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "0 8px", flexShrink: 0 },
  circle: { width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--input-border)", background: "var(--surface-2)", color: "var(--muted-foreground)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, transition: "all 0.25s" },
  circleActive: { border: "2px solid var(--brand-primary)", background: "var(--brand-primary)", color: "#fff" },
  circleDone: { border: "2px solid var(--brand-secondary)", background: "var(--brand-secondary)", color: "#fff" },
  label: { fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", whiteSpace: "nowrap" },
  labelActive: { color: "var(--brand-primary)" },
};

// ── Step 1: Provider & Location ───────────────────────────────────────────────

function StepAssignment({ form, set, providers, availableLocations }: {
  form: CarForm;
  set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void;
  providers: ProviderSummaryApi[];
  availableLocations: RentalLocationOption[];
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader title="Provider & Location" desc="Assign this car to a provider and select its operating location." />
      <div style={f.grid2}>
        <Field label="Provider *">
          <select style={f.input} value={form.providerId} onChange={(e) => set("providerId", e.target.value)}>
            <option value="">Select provider</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Location *">
          <select
            style={{ ...f.input, opacity: !form.providerId ? 0.5 : 1 }}
            value={form.locationId}
            onChange={(e) => set("locationId", e.target.value)}
            disabled={!form.providerId}
          >
            <option value="">{form.providerId ? "Select location" : "Select a provider first"}</option>
            {availableLocations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}{l.address ? ` — ${l.address}` : ""}</option>
            ))}
          </select>
        </Field>
      </div>
      {form.providerId && availableLocations.length === 0 && (
        <p style={f.warnText}>This provider has no locations yet. Add a location in the provider settings first.</p>
      )}
    </div>
  );
}

// ── Step 2: Vehicle ───────────────────────────────────────────────────────────

function StepVehicle({ form, set, brands, modelOptions }: {
  form: CarForm;
  set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void;
  brands: CarBrandConfig[];
  modelOptions: CarModelConfig[];
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader title="Vehicle Identity" desc="Select the make, model, category, and year of the car." />
      <div style={f.grid2}>
        <Field label="Brand *">
          <select
            style={f.input}
            value={form.brand}
            onChange={(e) => {
              set("brand", e.target.value);
              if (form.model) set("model", "");
            }}
          >
            <option value="">Select a brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model *">
          <select
            style={f.input}
            value={form.model}
            onChange={(e) => set("model", e.target.value)}
            disabled={!form.brand}
          >
            <option value="">
              {form.brand ? "Select a model" : "Select a brand first"}
            </option>
            {modelOptions.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
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
          <input style={f.input} type="number" min="1990" max={new Date().getFullYear() + 1} placeholder="2024" value={form.year} onChange={(e) => set("year", e.target.value)} />
        </Field>
        <Field label="Air Conditioning">
          <ToggleGroup
            options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
            value={form.hasAC ? "yes" : "no"}
            onChange={(v) => set("hasAC", v === "yes")}
          />
        </Field>
      </div>
    </div>
  );
}

// ── Step 3: Specs & Features ──────────────────────────────────────────────────

function StepSpecs({ form, set, loadingFeatures, groupedFeatures, selectedFeatureIds, toggleFeature }: {
  form: CarForm;
  set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void;
  loadingFeatures: boolean;
  groupedFeatures: { cat: string; items: AdminCarFeatureOption[] }[];
  selectedFeatureIds: string[];
  toggleFeature: (id: string) => void;
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader title="Specs & Features" desc="Set capacity, drivetrain, and attach available features." />
      <div style={f.grid3}>
        <Field label="Seats *">
          <input style={f.input} type="number" min="1" max="20" placeholder="5" value={form.seats} onChange={(e) => set("seats", e.target.value)} />
        </Field>
        <Field label="Bags">
          <input style={f.input} placeholder="e.g. 2 medium" value={form.bags} onChange={(e) => set("bags", e.target.value)} />
        </Field>
        <Field label="Transmission">
          <ToggleGroup
            options={[{ value: "AUTOMATIC", label: "Auto" }, { value: "MANUAL", label: "Manual" }]}
            value={form.transmission}
            onChange={(v) => set("transmission", v as Transmission)}
          />
        </Field>
      </div>
      <Field label="Mileage Policy">
        <ToggleGroup
          options={[{ value: "UNLIMITED", label: "Unlimited" }, { value: "LIMITED", label: "Limited" }]}
          value={form.mileagePolicy}
          onChange={(v) => set("mileagePolicy", v as MileagePolicy)}
        />
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>
          {form.mileagePolicy === "UNLIMITED"
            ? "Renters can drive any distance during the rental period — no extra charges."
            : "A per-day mileage cap applies; renters pay an overage fee for any extra distance."}
        </p>
      </Field>

      {/* Features */}
      <div style={{ paddingTop: 8, borderTop: "1px solid var(--input-border)" }}>
        <p style={f.featuresSectionLabel}>Features</p>
        {loadingFeatures ? (
          <p style={f.mutedText}>Loading features for this provider…</p>
        ) : groupedFeatures.length === 0 ? (
          <p style={f.mutedText}>No feature options available for this provider.</p>
        ) : (
          <div style={f.featuresCols}>
            {groupedFeatures.map(({ cat, items }) => (
              <div key={cat} style={f.featureGroup}>
                <p style={f.featureCat}>{cat}</p>
                {items.map((item) => (
                  <label key={item.id} style={f.checkLabel}>
                    <input type="checkbox" checked={selectedFeatureIds.includes(item.id)} onChange={() => toggleFeature(item.id)} style={f.checkbox} />
                    <span style={{ fontSize: 13 }}>{item.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 4: Pricing & Photos ──────────────────────────────────────────────────

function StepPricingPhotos({ form, set, imagePreviews, dragOver, setDragOver, addImages, removeImage }: {
  form: CarForm;
  set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void;
  imagePreviews: string[];
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  addImages: (files: File[]) => void;
  removeImage: (i: number) => void;
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader title="Pricing & Photos" desc="Set rental rates and upload vehicle photos." />
      <div style={f.grid2}>
        <Field label="Daily Rate (₦) *">
          <div style={f.inputPrefixed}>
            <span style={f.prefix}>₦</span>
            <input style={{ ...f.input, paddingLeft: 34 }} type="number" min="0" placeholder="25,000" value={form.dailyRate} onChange={(e) => set("dailyRate", e.target.value)} />
          </div>
        </Field>
        <Field label="Hourly Rate (₦)">
          <div style={f.inputPrefixed}>
            <span style={f.prefix}>₦</span>
            <input style={{ ...f.input, paddingLeft: 34 }} type="number" min="0" placeholder="Optional" value={form.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} />
          </div>
        </Field>
      </div>

      {/* Drop zone */}
      <div
        style={{ ...f.dropZone, ...(dragOver ? f.dropZoneHover : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addImages(Array.from(e.dataTransfer.files)); }}
        onClick={() => document.getElementById("admin-img-input")?.click()}
      >
        <input id="admin-img-input" type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => addImages(Array.from(e.target.files ?? []))} />
        <ImagePlus size={28} color="var(--muted-foreground)" strokeWidth={1.5} />
        <p style={f.dropTitle}>Drag & drop photos here</p>
        <p style={f.dropHint}>or click to browse · PNG, JPG, WEBP · max 10MB</p>
      </div>

      {imagePreviews.length > 0 && (
        <div style={f.previewGrid}>
          {imagePreviews.map((url, i) => (
            <div key={i} style={f.previewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={f.previewImg} />
              {i === 0 && <span style={f.coverBadge}>Cover</span>}
              <button style={f.removeBtn} onClick={() => removeImage(i)} title="Remove"><X size={11} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 5: Review & Options ──────────────────────────────────────────────────

function StepReview({ form, set, selectedProvider, selectedLocation, selectedFeatureIds, imageCount, onEdit }: {
  form: CarForm;
  set: <K extends keyof CarForm>(k: K, v: CarForm[K]) => void;
  selectedProvider: ProviderSummaryApi | null;
  selectedLocation: RentalLocationOption | null;
  selectedFeatureIds: string[];
  imageCount: number;
  onEdit: (step: StepKey) => void;
}) {
  return (
    <div style={f.wrapper}>
      <StepHeader title="Review & Options" desc="Confirm all details and set admin options before creating." />

      <div style={f.reviewGrid}>
        <ReviewCard title="Assignment" onEdit={() => onEdit("assignment")}>
          <Row label="Provider" value={selectedProvider?.name ?? "—"} />
          <Row label="Location" value={selectedLocation?.name ?? "—"} />
        </ReviewCard>

        <ReviewCard title="Vehicle" onEdit={() => onEdit("vehicle")}>
          <Row label="Brand" value={form.brand || "—"} />
          <Row label="Model" value={form.model || "—"} />
          <Row label="Category" value={form.category} />
          <Row label="Year" value={form.year || "—"} />
        </ReviewCard>

        <ReviewCard title="Specs" onEdit={() => onEdit("specs")}>
          <Row label="Seats" value={form.seats || "—"} />
          <Row label="Bags" value={form.bags || "—"} />
          <Row label="Transmission" value={form.transmission} />
          <Row label="Mileage" value={form.mileagePolicy} />
          <Row label="Features" value={`${selectedFeatureIds.length} selected`} />
        </ReviewCard>

        <ReviewCard title="Pricing & Photos" onEdit={() => onEdit("pricing")}>
          <Row label="Daily" value={form.dailyRate ? `₦${Number(form.dailyRate).toLocaleString()}` : "—"} />
          <Row label="Hourly" value={form.hourlyRate ? `₦${Number(form.hourlyRate).toLocaleString()}` : "—"} />
          <Row label="Photos" value={`${imageCount} uploaded`} />
        </ReviewCard>
      </div>

      {/* Admin options */}
      <div style={f.adminOptions}>
        <p style={f.adminOptionsTitle}>Admin Options</p>

        <label style={f.optionRow} onClick={() => set("autoApprove", !form.autoApprove)}>
          <div style={{ ...f.optionToggle, ...(form.autoApprove ? f.optionToggleOn : {}) }}>
            {form.autoApprove && <Check size={12} strokeWidth={3} color="#fff" />}
          </div>
          <div>
            <p style={f.optionLabel}>
              <ShieldCheck size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Auto-approve and activate immediately
            </p>
            <p style={f.optionDesc}>
              Car will go live without requiring additional approval. Use for trusted providers.
            </p>
          </div>
        </label>

        <Field label="Admin Note (internal)">
          <textarea
            style={{ ...f.input, height: "auto", padding: "10px 12px", resize: "vertical" }}
            rows={3}
            placeholder="Optional moderation note visible only to admins…"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function ToggleGroup({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; }) {
  return (
    <div style={f.toggleRow}>
      {options.map((o) => (
        <button key={o.value} type="button"
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

// ── Page styles ───────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: { height: "100%", display: "flex", flexDirection: "column", gap: 0, background: "var(--background)", overflow: "hidden" },
  gateLoader: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  gateSpinner: { width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.8s linear infinite" },
  header: { padding: "20px 28px 0", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 },
  backBtn: { width: "fit-content", background: "transparent", border: "none", color: "var(--muted-foreground)", cursor: "pointer", padding: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 6 },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  title: { fontSize: 24, fontWeight: 750, margin: 0, letterSpacing: -0.4 },
  subtitle: { color: "var(--muted-foreground)", margin: "4px 0 0", fontSize: 13 },
  stepBadge: { padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", border: "1px solid var(--input-border)", background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)", color: "var(--brand-primary)" },
  stepperWrap: { padding: "18px 28px", flexShrink: 0 },
  card: { margin: "0 28px 28px", background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 16, display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" },
  cardBody: { padding: "28px 28px 24px", flex: 1, minHeight: 0, overflowY: "auto" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--input-border)", background: "var(--surface-2)", gap: 12, flexShrink: 0 },
  footerRight: { display: "flex", gap: 10 },
  btnCancel: { background: "transparent", border: "1px solid var(--input-border)", color: "var(--muted-foreground)", padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13 },
  btnBack: { background: "var(--surface-2)", border: "1px solid var(--input-border)", color: "var(--foreground)", padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13 },
  btnNext: { background: "var(--brand-primary)", border: "none", color: "#fff", padding: "9px 22px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 },
  btnDisabled: { opacity: 0.45, cursor: "not-allowed" },
};

// ── Form styles ───────────────────────────────────────────────────────────────

const f: Record<string, CSSProperties> = {
  wrapper: { display: "flex", flexDirection: "column", gap: 24 },
  stepHead: { display: "flex", flexDirection: "column", gap: 5 },
  stepTitle: { margin: 0, fontSize: 18, fontWeight: 700 },
  stepDesc: { margin: 0, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.55 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: { width: "100%", height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg, var(--surface-2))", color: "var(--input-fg, var(--foreground))", fontSize: 14, outline: "none", boxSizing: "border-box" },
  warnText: { margin: 0, fontSize: 13, color: "#f87171", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" },
  mutedText: { margin: 0, fontSize: 13, color: "var(--muted-foreground)" },
  toggleRow: { display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--input-border)" },
  toggleBtn: { flex: 1, height: 44, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "background 0.15s, color 0.15s" },
  toggleActive: { background: "var(--brand-primary)", color: "#fff" },
  toggleInactive: { background: "var(--surface-2)", color: "var(--muted-foreground)" },
  inputPrefixed: { position: "relative" },
  prefix: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--muted-foreground)", zIndex: 1, pointerEvents: "none" },
  featuresSectionLabel: { margin: "0 0 12px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted-foreground)" },
  featuresCols: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 },
  featureGroup: { display: "flex", flexDirection: "column", gap: 8 },
  featureCat: { margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, color: "var(--brand-primary)" },
  checkLabel: { display: "flex", alignItems: "center", gap: 9, cursor: "pointer" },
  checkbox: { accentColor: "var(--brand-primary)", width: 14, height: 14 },
  dropZone: { border: "2px dashed var(--input-border)", borderRadius: 14, padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "border-color 0.15s, background 0.15s", textAlign: "center" },
  dropZoneHover: { borderColor: "var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 5%, transparent)" },
  dropTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: "var(--foreground)" },
  dropHint: { margin: 0, fontSize: 12, color: "var(--muted-foreground)" },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 },
  previewWrap: { position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", border: "1px solid var(--input-border)" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  coverBadge: { position: "absolute", bottom: 5, left: 5, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  reviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  reviewCard: { border: "1px solid var(--input-border)", borderRadius: 12, overflow: "hidden", background: "var(--surface-2)" },
  reviewCardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--input-border)", background: "var(--surface-1)" },
  reviewCardTitle: { fontSize: 13, fontWeight: 700 },
  editBtn: { fontSize: 12, background: "none", border: "none", color: "var(--brand-primary)", cursor: "pointer", fontWeight: 600 },
  reviewCardBody: { padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 12, color: "var(--muted-foreground)" },
  rowValue: { fontSize: 13, fontWeight: 600, color: "var(--foreground)" },
  adminOptions: { display: "flex", flexDirection: "column", gap: 16, padding: "20px", background: "var(--surface-2)", borderRadius: 14, border: "1px solid var(--input-border)" },
  adminOptionsTitle: { margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted-foreground)" },
  optionRow: { display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer", padding: "14px 16px", borderRadius: 12, border: "1px solid var(--input-border)", background: "var(--surface-1)" },
  optionToggle: { width: 20, height: 20, borderRadius: 6, border: "2px solid var(--input-border)", background: "var(--surface-2)", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
  optionToggleOn: { border: "2px solid var(--brand-primary)", background: "var(--brand-primary)" },
  optionLabel: { margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" },
  optionDesc: { margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 },
};
