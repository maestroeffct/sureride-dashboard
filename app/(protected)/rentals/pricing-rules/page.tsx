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
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listPricingRules,
  upsertPricingRule,
  deletePricingRule,
  type PricingRule,
  type UpsertPricingRulePayload,
  type DepositType,
} from "@/src/lib/adminPricingRulesApi";
import {
  isGlobalCountryScope,
  readAdminCountryScope,
} from "@/src/lib/adminCountryScope";
import { listAdminCountries } from "@/src/lib/adminCountriesApi";
import type { CSSProperties } from "react";

/* ─── Currency helpers ────────────────────────────────────── */

// Map of ISO country code → ISO 4217 currency. Sticking to majors keeps the
// fallback path cheap; anything missing falls through to USD.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  NG: "NGN",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  DE: "EUR",
  FR: "EUR",
  IE: "EUR",
};

// Display locale per currency — using "en-XX" gives us the right symbol
// placement and grouping without needing a full intl-data dependency.
const CURRENCY_TO_LOCALE: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
  EUR: "en-IE",
};

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

function fmtMoneyFor(currency: string) {
  const locale = CURRENCY_TO_LOCALE[currency] ?? "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return (v: number) => formatter.format(v);
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
  fmtMoney,
}: {
  rule: PricingRule;
  onEdit: () => void;
  onDelete: () => void;
  fmtMoney: (v: number) => string;
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
  // Currency for deposit display follows the country scope. Resolved once on
  // mount from localStorage + the countries catalog — pricing rules don't
  // re-fetch when scope changes today, so neither does this.
  const [currency, setCurrency] = useState("USD");

  const load = () => {
    setLoading(true);
    listPricingRules()
      .then(setRules)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Resolve scope → ISO country code → currency once on mount. The scope is
  // stored as a country id (UUID), so we need the catalog to map back to a
  // code. Falls back to USD for "GLOBAL" or unknown countries.
  useEffect(() => {
    const scope = readAdminCountryScope();
    if (isGlobalCountryScope(scope)) {
      setCurrency("USD");
      return;
    }
    void listAdminCountries()
      .then((countries) => {
        const match = countries.find((c) => c.id === scope);
        const code = match?.code?.toUpperCase();
        setCurrency((code && COUNTRY_TO_CURRENCY[code]) || "USD");
      })
      .catch(() => setCurrency("USD"));
  }, []);

  const fmtMoney = fmtMoneyFor(currency);

  const globalRule = rules.find((r) => r.categorySlug === null);
  const categoryRules = rules.filter((r) => r.categorySlug !== null);
  const existingSlugs = rules.map((r) => r.categorySlug);

  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePricingRule(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete rule");
    } finally {
      setDeleting(false);
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
            Set the platform commission, deposit, and price multipliers for each car category
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

      {/* How it works — plain English */}
      <div style={s.explainCard}>
        <div style={s.explainRow}>
          <div style={s.explainBlock}>
            <div style={s.explainIcon}><Globe size={18} /></div>
            <div>
              <p style={s.explainLabel}>Global Default</p>
              <p style={s.explainText}>
                Think of this as the base rule that applies to <strong>every car</strong> on the platform.
                If a car category has no special rule, it falls back to these numbers.
              </p>
            </div>
          </div>
          <div style={s.explainArrow}>→</div>
          <div style={s.explainBlock}>
            <div style={{ ...s.explainIcon, background: "rgba(167,139,250,0.12)", color: "#A78BFA" }}><Tag size={18} /></div>
            <div>
              <p style={s.explainLabel}>Category Override</p>
              <p style={s.explainText}>
                A special exception for <strong>one specific car type</strong> (e.g. Luxury cars charge 15% commission
                instead of the global 10%). The global rule still applies to all other categories.
              </p>
            </div>
          </div>
        </div>
        <div style={s.explainFootnote}>
          <Info size={12} />
          Changes take effect on the next booking price calculation.
        </div>
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
            <div style={s.sectionHeaderRow}>
              <h2 style={s.sectionTitle}>Global Default</h2>
              <span style={s.sectionHint}>Fallback for any category without an override</span>
            </div>
            {globalRule ? (
              <RuleCard
                rule={globalRule}
                onEdit={() => { setEditTarget(globalRule); setModalOpen(true); }}
                onDelete={() => {}}
                fmtMoney={fmtMoney}
              />
            ) : (
              <div style={s.emptyGlobal}>
                <span>No global rule set yet. All bookings will use hardcoded defaults (10% commission, 20% deposit).</span>
                <button
                  style={s.createBtn}
                  onClick={() => { setEditTarget(null); setModalOpen(true); }}
                >
                  <Plus size={14} /> Create Global Rule
                </button>
              </div>
            )}
          </div>

          {/* Category overrides */}
          <div>
            <div style={s.sectionHeaderRow}>
              <h2 style={s.sectionTitle}>Category Overrides</h2>
              <span style={s.sectionHint}>Rules that apply only to a specific car category — override the global default</span>
            </div>
            {categoryRules.length === 0 ? (
              <div style={s.emptyCategory}>
                No category overrides yet — all categories currently use the global rule.
              </div>
            ) : (
              <div style={s.rulesGrid}>
                {categoryRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={() => { setEditTarget(rule); setModalOpen(true); }}
                    onDelete={() => setDeleteTarget(rule)}
                    fmtMoney={fmtMoney}
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

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, maxWidth: 420 }}>
            <div style={s.modalHeader}>
              <span style={{ ...s.modalTitle, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={16} color="#EF4444" />
                Remove Override
              </span>
              <button style={s.closeBtn} onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--fg-75)", lineHeight: 1.6 }}>
                Remove the <strong>{categoryLabel(deleteTarget.categorySlug)}</strong> override?{" "}
                That category will fall back to the <strong>Global Default</strong> rule.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button style={s.cancelBtn} onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancel
                </button>
                <button
                  style={{ ...s.saveBtn, background: "#DC2626" }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Removing…" : "Remove Override"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
    borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#fff",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
  },

  explainCard: {
    borderRadius: 14, border: "1px solid var(--input-border)", background: "var(--surface-1)",
    padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14,
  },
  explainRow: { display: "flex", alignItems: "flex-start", gap: 20 },
  explainBlock: { flex: 1, display: "flex", gap: 14, alignItems: "flex-start" },
  explainIcon: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
    color: "var(--brand-primary)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  explainLabel: { margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  explainText: { margin: 0, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 },
  explainArrow: {
    fontSize: 20, color: "var(--input-border)", fontWeight: 300, paddingTop: 8, flexShrink: 0,
  },
  explainFootnote: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 11,
    color: "var(--muted-foreground)", borderTop: "1px solid var(--input-border)", paddingTop: 12,
  },

  sectionHeaderRow: { display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 },
  sectionTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.6 },
  sectionHint: { fontSize: 12, color: "var(--muted-foreground)" },

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
    background: "var(--brand-primary)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
};
