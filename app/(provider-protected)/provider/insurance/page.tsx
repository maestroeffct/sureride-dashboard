"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  Plus,
  Shield,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  createProviderInsurancePackage,
  deleteProviderInsurancePackage,
  listProviderCars,
  listProviderInsurancePackages,
  updateProviderInsurancePackage,
  type ProtectionApprovalStatus,
  type ProtectionPricingModel,
  type ProtectionTier,
  type ProviderInsurancePackage,
  type UpsertProviderInsurancePayload,
} from "@/src/lib/providerApi";

type FormState = {
  name: string;
  description: string;
  dailyPrice: string;
  carId: string;
  isActive: boolean;
  tier: ProtectionTier;
  pricingModel: ProtectionPricingModel;
  pricingPercent: string;
  deductibleAmount: string;
  liabilityLimit: string;
  physicalDamageLimit: string;
  coveredPerils: string;
  exclusions: string;
  productHighlights: string;
  currency: string;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  dailyPrice: "",
  carId: "",
  isActive: true,
  tier: "STANDARD",
  pricingModel: "PER_DAY",
  pricingPercent: "",
  deductibleAmount: "",
  liabilityLimit: "",
  physicalDamageLimit: "",
  coveredPerils: "",
  exclusions: "",
  productHighlights: "",
  currency: "NGN",
};

const TIERS: { value: ProtectionTier; label: string; blurb: string }[] = [
  { value: "PREMIUM", label: "Premium", blurb: "Lowest deductible · highest limits" },
  { value: "STANDARD", label: "Standard", blurb: "Balanced coverage" },
  { value: "MINIMUM", label: "Minimum", blurb: "Basic coverage · lowest price" },
];

const PRICING_MODELS: { value: ProtectionPricingModel; label: string }[] = [
  { value: "PER_DAY", label: "Per day (flat)" },
  { value: "PERCENT_OF_TRIP", label: "% of trip subtotal" },
];

export default function ProviderProtectionPlansPage() {
  const [items, setItems] = useState<ProviderInsurancePackage[]>([]);
  const [cars, setCars] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState<ProviderInsurancePackage | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [plans, carsRes] = await Promise.all([
        listProviderInsurancePackages(),
        listProviderCars({ limit: 500 }),
      ]);
      setItems(plans.items);
      setCars(
        (carsRes.items ?? []).map((c: any) => ({
          id: c.id,
          label: `${c.brand} ${c.model}${c.licensePlate ? ` · ${c.licensePlate}` : ""}`,
        })),
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load protection plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (row: ProviderInsurancePackage) => {
    if (!confirm(`Delete "${row.name}"? This plan will be gone permanently.`)) return;
    try {
      await deleteProviderInsurancePackage(row.id);
      toast.success("Plan deleted");
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  };

  const kpi = useMemo(() => {
    let approved = 0, pending = 0, rejected = 0;
    for (const p of items) {
      if (p.approvalStatus === "APPROVED") approved += 1;
      else if (p.approvalStatus === "PENDING") pending += 1;
      else if (p.approvalStatus === "REJECTED") rejected += 1;
    }
    return { approved, pending, rejected };
  }, [items]);

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}>
            <Shield size={20} color="var(--brand-primary)" /> Protection Plans
          </h1>
          <p style={s.sub}>
            Tiered damage-waiver products customers can add to a rental.
            Set the tier, deductible, and coverage limits. Admin approves
            each new plan before it goes live to renters.
          </p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpenEdit("new")}>
          <Plus size={15} /> New plan
        </button>
      </header>

      <div style={s.kpiRow}>
        <span style={{ ...s.kpi, background: "rgba(34,197,94,0.10)", color: "#86efac" }}>
          <CheckCircle2 size={14} /> {kpi.approved} approved
        </span>
        <span style={{ ...s.kpi, background: "rgba(250,204,21,0.10)", color: "#fde68a" }}>
          <Clock size={14} /> {kpi.pending} awaiting review
        </span>
        {kpi.rejected > 0 && (
          <span style={{ ...s.kpi, background: "rgba(239,68,68,0.10)", color: "#fca5a5" }}>
            <XCircle size={14} /> {kpi.rejected} rejected
          </span>
        )}
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={s.empty}>
          No protection plans yet. Add one so customers have a coverage
          option at checkout.
        </div>
      ) : (
        <div style={s.grid}>
          {items.map((p) => (
            <article key={p.id} style={{ ...s.card, opacity: p.isActive ? 1 : 0.55 }}>
              <div style={s.cardHead}>
                <span style={tierBadge(p.tier)}>{p.tier}</span>
                <span style={statusPill(p.approvalStatus)}>{p.approvalStatus}</span>
              </div>
              <strong style={{ fontSize: 16, marginTop: 4 }}>{p.name}</strong>
              <p style={s.desc}>{p.description}</p>
              <div style={s.price}>
                {p.currency}{" "}
                <span style={{ fontSize: 22, fontWeight: 800 }}>
                  {p.pricingModel === "PERCENT_OF_TRIP"
                    ? `${p.pricingPercent ?? 0}%`
                    : p.dailyPrice.toLocaleString()}
                </span>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 4 }}>
                  {p.pricingModel === "PERCENT_OF_TRIP" ? "of trip subtotal" : "per day"}
                </span>
              </div>
              <div style={s.detailGrid}>
                {p.deductibleAmount != null && (
                  <Detail label="Deductible">{p.currency} {p.deductibleAmount.toLocaleString()}</Detail>
                )}
                {p.liabilityLimit != null && (
                  <Detail label="Liability limit">{p.currency} {p.liabilityLimit.toLocaleString()}</Detail>
                )}
                {p.physicalDamageLimit != null && (
                  <Detail label="Damage limit">{p.currency} {p.physicalDamageLimit.toLocaleString()}</Detail>
                )}
                {p.car && <Detail label="Attached car">{p.car.label}</Detail>}
              </div>
              {p.approvalStatus === "REJECTED" && p.approvalNote && (
                <div style={s.rejectNote}>
                  <strong>Admin note:</strong> {p.approvalNote}
                </div>
              )}
              <div style={s.actions}>
                <button style={s.linkBtn} onClick={() => setOpenEdit(p)}>Edit</button>
                <button style={s.iconBtn} onClick={() => void remove(p)}><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {openEdit && (
        <PlanModal
          plan={openEdit === "new" ? null : openEdit}
          cars={cars}
          onClose={() => setOpenEdit(null)}
          onDone={() => {
            setOpenEdit(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function PlanModal({
  plan,
  cars,
  onClose,
  onDone,
}: {
  plan: ProviderInsurancePackage | null;
  cars: { id: string; label: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    plan
      ? {
          name: plan.name,
          description: plan.description,
          dailyPrice: String(plan.dailyPrice ?? ""),
          carId: plan.carId ?? "",
          isActive: plan.isActive,
          tier: plan.tier,
          pricingModel: plan.pricingModel,
          pricingPercent: plan.pricingPercent != null ? String(plan.pricingPercent) : "",
          deductibleAmount: plan.deductibleAmount != null ? String(plan.deductibleAmount) : "",
          liabilityLimit: plan.liabilityLimit != null ? String(plan.liabilityLimit) : "",
          physicalDamageLimit: plan.physicalDamageLimit != null ? String(plan.physicalDamageLimit) : "",
          coveredPerils: plan.coveredPerils.join(", "),
          exclusions: plan.exclusions.join(", "),
          productHighlights: plan.productHighlights.join("\n"),
          currency: plan.currency,
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (form.name.trim().length < 2) return toast.error("Name required");
    if (form.description.trim().length < 2) return toast.error("Description required");
    const price = Number(form.dailyPrice);
    if (form.pricingModel === "PER_DAY" && !(price >= 0)) return toast.error("Enter a per-day price");
    if (form.pricingModel === "PERCENT_OF_TRIP" && !Number(form.pricingPercent))
      return toast.error("Enter a percent of trip");

    const payload: UpsertProviderInsurancePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      dailyPrice: form.pricingModel === "PER_DAY" ? price : 0,
      isActive: form.isActive,
      carId: form.carId || null,
      tier: form.tier,
      pricingModel: form.pricingModel,
      pricingPercent: form.pricingModel === "PERCENT_OF_TRIP" ? Number(form.pricingPercent) : null,
      deductibleAmount: form.deductibleAmount ? Number(form.deductibleAmount) : null,
      liabilityLimit: form.liabilityLimit ? Number(form.liabilityLimit) : null,
      physicalDamageLimit: form.physicalDamageLimit ? Number(form.physicalDamageLimit) : null,
      coveredPerils: splitList(form.coveredPerils),
      exclusions: splitList(form.exclusions),
      productHighlights: form.productHighlights.split("\n").map((x) => x.trim()).filter(Boolean),
      currency: form.currency.trim().toUpperCase() || null,
    };

    try {
      setBusy(true);
      if (plan) await updateProviderInsurancePackage(plan.id, payload);
      else await createProviderInsurancePackage(payload);
      toast.success(
        plan
          ? "Plan updated — sent for admin re-approval."
          : "Plan created — awaiting admin review.",
      );
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}>
          <div>
            <strong style={{ fontSize: 16 }}>{plan ? "Edit protection plan" : "New protection plan"}</strong>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>
              New or edited plans need admin approval before renters see them.
            </div>
          </div>
          <button style={m.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={m.body}>
          <div>
            <label style={m.label}>Tier</label>
            <div style={{ display: "flex", gap: 8 }}>
              {TIERS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("tier", t.value)}
                  style={{
                    flex: 1,
                    padding: "12px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--input-border)",
                    background: form.tier === t.value ? "color-mix(in srgb, var(--brand-primary) 12%, transparent)" : "transparent",
                    color: form.tier === t.value ? "var(--brand-primary)" : "var(--foreground)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {t.label}
                  <div style={{ fontSize: 10, fontWeight: 500, color: "var(--muted-foreground)", marginTop: 2 }}>{t.blurb}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={m.label}>Name</label>
            <input style={m.input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Premium Protection" />
          </div>
          <div>
            <label style={m.label}>Description (shown to renter)</label>
            <textarea style={{ ...m.input, height: 60 }} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div style={m.grid2}>
            <div>
              <label style={m.label}>Pricing model</label>
              <select style={m.input} value={form.pricingModel} onChange={(e) => set("pricingModel", e.target.value as ProtectionPricingModel)}>
                {PRICING_MODELS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={m.label}>Currency</label>
              <input style={m.input} maxLength={3} value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} placeholder="NGN" />
            </div>
          </div>
          {form.pricingModel === "PER_DAY" ? (
            <div>
              <label style={m.label}>Daily price</label>
              <input style={m.input} type="number" value={form.dailyPrice} onChange={(e) => set("dailyPrice", e.target.value)} placeholder="0.00" />
            </div>
          ) : (
            <div>
              <label style={m.label}>Percent of trip subtotal</label>
              <input style={m.input} type="number" min={0} max={100} value={form.pricingPercent} onChange={(e) => set("pricingPercent", e.target.value)} placeholder="e.g. 15" />
            </div>
          )}
          <div style={m.grid3}>
            <div>
              <label style={m.label}>Deductible</label>
              <input style={m.input} type="number" value={form.deductibleAmount} onChange={(e) => set("deductibleAmount", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={m.label}>Liability limit</label>
              <input style={m.input} type="number" value={form.liabilityLimit} onChange={(e) => set("liabilityLimit", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={m.label}>Damage limit</label>
              <input style={m.input} type="number" value={form.physicalDamageLimit} onChange={(e) => set("physicalDamageLimit", e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <label style={m.label}>Attached car (optional — leave blank for a provider-wide plan)</label>
            <select style={m.input} value={form.carId} onChange={(e) => set("carId", e.target.value)}>
              <option value="">Applies to all cars in your fleet</option>
              {cars.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={m.label}>Covered perils (comma-separated)</label>
            <input style={m.input} value={form.coveredPerils} onChange={(e) => set("coveredPerils", e.target.value)} placeholder="Collision, Theft, Vandalism, Windshield" />
          </div>
          <div>
            <label style={m.label}>Exclusions (comma-separated)</label>
            <input style={m.input} value={form.exclusions} onChange={(e) => set("exclusions", e.target.value)} placeholder="Off-road driving, Impaired driving" />
          </div>
          <div>
            <label style={m.label}>Highlights (one per line)</label>
            <textarea style={{ ...m.input, height: 70 }} value={form.productHighlights} onChange={(e) => set("productHighlights", e.target.value)} placeholder="24/7 roadside assistance&#10;Same-day claims" />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Active — offer at checkout (once approved)
          </label>
        </div>
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={m.primary} onClick={submit} disabled={busy}>{busy ? "Saving…" : plan ? "Save" : "Submit for approval"}</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={s.detailLabel}>{label}</div>
      <div style={s.detailValue}>{children}</div>
    </div>
  );
}

function splitList(v: string): string[] {
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

function tierBadge(tier: ProtectionTier): CSSProperties {
  const map: Record<ProtectionTier, string> = {
    PREMIUM: "linear-gradient(90deg, #6366f1, #a855f7)",
    STANDARD: "linear-gradient(90deg, #14b8a6, #22c55e)",
    MINIMUM: "linear-gradient(90deg, #64748b, #94a3b8)",
  };
  return {
    display: "inline-block",
    padding: "3px 12px",
    borderRadius: 999,
    background: map[tier],
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
  };
}
function statusPill(st: ProtectionApprovalStatus): CSSProperties {
  const base: CSSProperties = { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700 };
  const map: Record<ProtectionApprovalStatus, [string, string]> = {
    APPROVED: ["rgba(34,197,94,0.14)", "#86efac"],
    PENDING: ["rgba(250,204,21,0.14)", "#fde68a"],
    REJECTED: ["rgba(239,68,68,0.14)", "#fca5a5"],
  };
  const [bg, color] = map[st];
  return { ...base, background: bg, color };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  kpiRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  kpi: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 8 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  desc: { margin: 0, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5, minHeight: 40 },
  price: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 10, background: "var(--surface-2)", borderRadius: 8 },
  detailLabel: { fontSize: 10, textTransform: "uppercase", color: "var(--muted-foreground)", letterSpacing: 0.4 },
  detailValue: { fontSize: 13, fontWeight: 600, marginTop: 2 },
  rejectNote: { padding: 10, borderLeft: "3px solid #ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 8, fontSize: 12, color: "#fca5a5" },
  actions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--input-border)" },
  linkBtn: { background: "transparent", border: "none", color: "var(--brand-primary)", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#fca5a5" },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 640, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 22px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 22, display: "flex", flexDirection: "column", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" as any },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
