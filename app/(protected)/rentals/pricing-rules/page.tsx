"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Tag,
  Info,
} from "lucide-react";
import {
  listPricingRules,
  upsertPricingRule,
  deletePricingRule,
  type PricingRule,
  type UpsertPricingRulePayload,
  type DepositType,
} from "@/src/lib/adminPricingRulesApi";
import type { CSSProperties } from "react";

/* ─── Car categories ─────────────────────────────────────── */

const KNOWN_CATEGORIES = [
  { slug: "economy", label: "Economy" },
  { slug: "compact", label: "Compact" },
  { slug: "luxury", label: "Luxury" },
  { slug: "suv", label: "SUV" },
  { slug: "van", label: "Van / Minibus" },
  { slug: "truck", label: "Truck / Pickup" },
];

/* ─── Helpers ─────────────────────────────────────────────── */

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);
}

function categoryLabel(slug: string | null) {
  if (!slug) return "Global Default";
  return KNOWN_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

/* ─── Empty form ──────────────────────────────────────────── */

const EMPTY_FORM: UpsertPricingRulePayload = {
  categorySlug: null,
  platformCommissionRate: 0.1,
  priceMultiplier: 1.0,
  depositType: "PERCENTAGE",
  depositValue: 0.2,
  minRentalDays: 1,
  isActive: true,
  note: "",
};

/* ─── Modal ───────────────────────────────────────────────── */

function RuleModal({
  initial,
  existingSlugs,
  onSave,
  onClose,
  saving,
}: {
  initial: UpsertPricingRulePayload & { id?: string };
  existingSlugs: (string | null)[];
  onSave: (data: UpsertPricingRulePayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const isEdit = Boolean(initial.id);
  const isGlobal = form.categorySlug === null || form.categorySlug === "";

  function set<K extends keyof UpsertPricingRulePayload>(
    key: K,
    val: UpsertPricingRulePayload[K]
  ) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>
            {isEdit ? "Edit Pricing Rule" : "Add Pricing Rule"}
          </span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form
          style={s.modalBody}
          onSubmit={(e) => { e.preventDefault(); onSave(form); }}
        >
          {/* Scope */}
          {!isEdit && (
            <Field label="Scope">
              <select
                style={s.input}
                value={form.categorySlug ?? ""}
                onChange={(e) => set("categorySlug", e.target.value || null)}
              >
                <option value="">Global Default</option>
                {KNOWN_CATEGORIES.filter(
                  (c) => !existingSlugs.includes(c.slug)
                ).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span style={s.fieldHint}>
                Global applies to all categories without a specific override.
              </span>
            </Field>
          )}

          {/* Commission */}
          <Field label="Platform Commission Rate">
            <div style={s.inputRow}>
              <input
                style={{ ...s.input, flex: 1 }}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={(form.platformCommissionRate ?? 0.1) * 100}
                onChange={(e) =>
                  set("platformCommissionRate", Number(e.target.value) / 100)
                }
              />
              <span style={s.inputSuffix}>%</span>
            </div>
            <span style={s.fieldHint}>
              % of gross booking value kept as platform fee.
            </span>
          </Field>

          {/* Price multiplier */}
          <Field label="Price Multiplier">
            <div style={s.inputRow}>
              <input
                style={{ ...s.input, flex: 1 }}
                type="number"
                min={0.1}
                step={0.05}
                value={form.priceMultiplier ?? 1.0}
                onChange={(e) => set("priceMultiplier", Number(e.target.value))}
              />
              <span style={s.inputSuffix}>×</span>
            </div>
            <span style={s.fieldHint}>
              1.0 = no change · 1.2 = +20% on base daily rate · 0.9 = -10%
            </span>
          </Field>

          {/* Deposit */}
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Deposit Type" style={{ flex: 1 }}>
              <select
                style={s.input}
                value={form.depositType ?? "PERCENTAGE"}
                onChange={(e) => set("depositType", e.target.value as DepositType)}
              >
                <option value="PERCENTAGE">% of Total</option>
                <option value="FIXED">Fixed Amount (₦)</option>
              </select>
            </Field>
            <Field
              label={form.depositType === "FIXED" ? "Deposit Amount (₦)" : "Deposit Rate (%)"}
              style={{ flex: 1 }}
            >
              <div style={s.inputRow}>
                <input
                  style={{ ...s.input, flex: 1 }}
                  type="number"
                  min={0}
                  step={form.depositType === "FIXED" ? 500 : 0.01}
                  value={
                    form.depositType === "PERCENTAGE"
                      ? (form.depositValue ?? 0.2) * 100
                      : (form.depositValue ?? 0)
                  }
                  onChange={(e) =>
                    set(
                      "depositValue",
                      form.depositType === "PERCENTAGE"
                        ? Number(e.target.value) / 100
                        : Number(e.target.value)
                    )
                  }
                />
                <span style={s.inputSuffix}>
                  {form.depositType === "PERCENTAGE" ? "%" : "₦"}
                </span>
              </div>
            </Field>
          </div>

          {/* Min rental days */}
          <Field label="Minimum Rental Days">
            <input
              style={s.input}
              type="number"
              min={1}
              value={form.minRentalDays ?? 1}
              onChange={(e) => set("minRentalDays", Number(e.target.value))}
            />
          </Field>

          {/* Note */}
          <Field label="Internal Note">
            <input
              style={s.input}
              value={form.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Optional note for ops team…"
            />
          </Field>

          <div style={s.modalActions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={s.saveBtn} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

/* ─── Rule Card ──────────────────────────────────────────── */

function RuleCard({
  rule,
  onEdit,
  onDelete,
}: {
  rule: PricingRule;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isGlobal = rule.categorySlug === null;

  return (
    <div style={{ ...s.ruleCard, ...(isGlobal ? s.ruleCardGlobal : {}) }}>
      <div style={s.ruleCardTop}>
        <div style={s.ruleCardLeft}>
          <div style={{ ...s.scopeBadge, ...(isGlobal ? s.scopeGlobal : s.scopeCategory) }}>
            {isGlobal ? <Globe size={13} /> : <Tag size={13} />}
            {categoryLabel(rule.categorySlug)}
          </div>
          {rule.note && (
            <span style={s.ruleNote}>
              <Info size={11} /> {rule.note}
            </span>
          )}
        </div>
        <div style={s.ruleCardActions}>
          {!rule.isActive && (
            <span style={s.inactivePill}>Inactive</span>
          )}
          <button style={s.iconBtn} onClick={onEdit} title="Edit">
            <Pencil size={14} />
          </button>
          {!isGlobal && (
            <button
              style={{ ...s.iconBtn, color: "#EF4444" }}
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={s.ruleGrid}>
        <Stat label="Commission" value={fmtPct(rule.platformCommissionRate)} accent="#A78BFA" />
        <Stat
          label="Price Multiplier"
          value={`${rule.priceMultiplier.toFixed(2)}×`}
          accent={rule.priceMultiplier > 1 ? "#FB923C" : rule.priceMultiplier < 1 ? "#34D399" : "var(--fg-65)"}
        />
        <Stat
          label="Deposit"
          value={
            rule.depositType === "PERCENTAGE"
              ? fmtPct(rule.depositValue)
              : fmtMoney(rule.depositValue)
          }
          accent="#3AEDE1"
        />
        <Stat label="Min Days" value={`${rule.minRentalDays}d`} accent="#FBBF24" />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={s.statCell}>
      <span style={s.statLabel}>{label}</span>
      <span style={{ ...s.statValue, color: accent }}>{value}</span>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PricingRule | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    listPricingRules()
      .then(setRules)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const globalRule = rules.find((r) => r.categorySlug === null);
  const categoryRules = rules.filter((r) => r.categorySlug !== null);
  const existingSlugs = rules.map((r) => r.categorySlug);

  const handleSave = async (data: UpsertPricingRulePayload) => {
    setSaving(true);
    try {
      if (editTarget) {
        await upsertPricingRule({ ...data, categorySlug: editTarget.categorySlug });
      } else {
        await upsertPricingRule(data);
      }
      setModalOpen(false);
      setEditTarget(null);
      load();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule: PricingRule) => {
    if (!window.confirm(`Remove override for ${categoryLabel(rule.categorySlug)}? It will fall back to the global rule.`)) return;
    try {
      await deletePricingRule(rule.id);
      load();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to delete rule");
    }
  };

  const modalInitial: UpsertPricingRulePayload & { id?: string } = editTarget
    ? {
        id: editTarget.id,
        categorySlug: editTarget.categorySlug,
        platformCommissionRate: editTarget.platformCommissionRate,
        priceMultiplier: editTarget.priceMultiplier,
        depositType: editTarget.depositType,
        depositValue: editTarget.depositValue,
        minRentalDays: editTarget.minRentalDays,
        isActive: editTarget.isActive,
        note: editTarget.note ?? "",
      }
    : EMPTY_FORM;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <div style={s.titleRow}>
            <DollarSign size={18} style={{ color: "var(--fg-85)" }} />
            <h1 style={s.pageTitle}>Pricing Rules</h1>
          </div>
          <p style={s.pageSub}>
            Configure platform commission, deposit requirements, and per-category price adjustments
          </p>
        </div>
        <button
          style={s.createBtn}
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <Plus size={16} />
          Add Category Override
        </button>
      </div>

      {/* How it works */}
      <div style={s.infoBanner}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          The <strong>Global Default</strong> applies to all car categories unless a specific category override exists.
          Overrides inherit unset fields from the global rule. Changes take effect on the next booking price calculation.
        </span>
      </div>

      {loading ? (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <span style={{ color: "var(--fg-65)", fontSize: 14 }}>Loading rules…</span>
        </div>
      ) : (
        <>
          {/* Global rule */}
          <div>
            <h2 style={s.sectionTitle}>Global Default</h2>
            {globalRule ? (
              <RuleCard
                rule={globalRule}
                onEdit={() => { setEditTarget(globalRule); setModalOpen(true); }}
                onDelete={() => {}}
              />
            ) : (
              <div style={s.emptyGlobal}>
                No global rule set. All bookings will use hardcoded defaults (10% commission, 20% deposit).
                <button
                  style={s.createBtn}
                  onClick={() => {
                    setEditTarget(null);
                    setModalOpen(true);
                  }}
                >
                  <Plus size={14} /> Create Global Rule
                </button>
              </div>
            )}
          </div>

          {/* Category overrides */}
          <div>
            <h2 style={s.sectionTitle}>Category Overrides</h2>
            {categoryRules.length === 0 ? (
              <div style={s.emptyCategory}>
                No category overrides. All categories use the global rule.
              </div>
            ) : (
              <div style={s.rulesGrid}>
                {categoryRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={() => { setEditTarget(rule); setModalOpen(true); }}
                    onDelete={() => handleDelete(rule)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {modalOpen && (
        <RuleModal
          initial={modalInitial}
          existingSlugs={existingSlugs}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */

const s: Record<string, CSSProperties> = {
  page: { width: "100%", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 },
  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: {
    width: 22, height: 22, border: "3px solid var(--glass-10)",
    borderTopColor: "#3AEDE1", borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },

  headerRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "var(--foreground)" },
  pageSub: { margin: "4px 0 0", fontSize: 13, color: "var(--fg-65)" },
  createBtn: {
    display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px",
    borderRadius: 10, border: "none", background: "#0A6A4B", color: "#fff",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
  },

  infoBanner: {
    display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px",
    borderRadius: 12, background: "rgba(58,237,225,0.06)", border: "1px solid rgba(58,237,225,0.16)",
    color: "var(--fg-75)", fontSize: 13, lineHeight: 1.6,
  },

  sectionTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--fg-65)", textTransform: "uppercase", letterSpacing: 0.6 },

  rulesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },

  ruleCard: {
    borderRadius: 16, background: "var(--glass-04)", border: "1px solid var(--glass-08)",
    padding: 20, display: "flex", flexDirection: "column", gap: 16,
  },
  ruleCardGlobal: {
    background: "rgba(58,237,225,0.04)", border: "1px solid rgba(58,237,225,0.16)",
  },
  ruleCardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  ruleCardLeft: { display: "flex", flexDirection: "column", gap: 6 },
  ruleCardActions: { display: "flex", alignItems: "center", gap: 8 },

  scopeBadge: {
    display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 12px",
    borderRadius: 999, fontSize: 13, fontWeight: 700,
  },
  scopeGlobal: { background: "rgba(58,237,225,0.12)", color: "#3AEDE1", border: "1px solid rgba(58,237,225,0.22)" },
  scopeCategory: { background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.22)" },

  ruleNote: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--fg-55)" },
  inactivePill: {
    fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
    background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.2)",
  },

  ruleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  statCell: {
    display: "flex", flexDirection: "column", gap: 3, padding: "10px 14px",
    borderRadius: 10, background: "var(--glass-06)", border: "1px solid var(--glass-08)",
  },
  statLabel: { fontSize: 11, color: "var(--fg-55)", fontWeight: 500 },
  statValue: { fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" },

  iconBtn: {
    width: 32, height: 32, borderRadius: 8, border: "1px solid var(--glass-10)",
    background: "var(--glass-06)", color: "var(--fg-70)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },

  emptyGlobal: {
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14,
    padding: "20px 24px", borderRadius: 14, border: "1px dashed var(--glass-14)",
    color: "var(--fg-55)", fontSize: 13,
  },
  emptyCategory: {
    padding: "20px 24px", borderRadius: 14, border: "1px dashed var(--glass-14)",
    color: "var(--fg-55)", fontSize: 13,
  },

  /* modal */
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
  },
  modal: {
    background: "var(--sidebar-bg)", borderRadius: 18, border: "1px solid var(--glass-10)",
    width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  modalHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 22px", borderBottom: "1px solid var(--glass-08)",
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "var(--foreground)" },
  closeBtn: { background: "none", border: "none", color: "var(--fg-65)", cursor: "pointer", fontSize: 18 },
  modalBody: { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: "var(--fg-65)" },
  fieldHint: { fontSize: 11, color: "var(--fg-50)" },
  input: {
    height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--glass-10)",
    background: "var(--glass-06)", color: "var(--foreground)", fontSize: 14, outline: "none", width: "100%",
  },
  inputRow: { display: "flex", alignItems: "center", gap: 0 },
  inputSuffix: {
    height: 42, padding: "0 14px", display: "flex", alignItems: "center",
    background: "var(--glass-08)", border: "1px solid var(--glass-10)", borderLeft: "none",
    borderRadius: "0 10px 10px 0", fontSize: 13, color: "var(--fg-65)", fontWeight: 600,
  },
  modalActions: { display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 },
  cancelBtn: {
    height: 40, padding: "0 18px", borderRadius: 10, border: "1px solid var(--glass-10)",
    background: "var(--glass-06)", color: "var(--fg-80)", cursor: "pointer", fontSize: 14,
  },
  saveBtn: {
    height: 40, padding: "0 18px", borderRadius: 10, border: "none",
    background: "#0A6A4B", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
};
