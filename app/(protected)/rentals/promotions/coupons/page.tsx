"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  listAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  toggleAdminCoupon,
  deleteAdminCoupon,
  type AdminCoupon,
  type CreateCouponPayload,
  type CouponType,
} from "@/src/lib/adminCouponsApi";
import type { CSSProperties } from "react";

/* ─── Helpers ─────────────────────────────────────────────── */

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);
}

function couponStatus(c: AdminCoupon): "active" | "expired" | "exhausted" | "inactive" {
  if (!c.isActive) return "inactive";
  if (new Date() > new Date(c.validUntil)) return "expired";
  if (c.usageLimit !== null && c.usageCount >= c.usageLimit) return "exhausted";
  return "active";
}

const STATUS_STYLE: Record<string, CSSProperties> = {
  active: { background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.22)" },
  expired: { background: "rgba(156,163,175,0.14)", color: "#9CA3AF", border: "1px solid rgba(156,163,175,0.22)" },
  exhausted: { background: "rgba(251,191,36,0.14)", color: "#FCD34D", border: "1px solid rgba(251,191,36,0.22)" },
  inactive: { background: "rgba(239,68,68,0.12)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.20)" },
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  exhausted: "Exhausted",
  inactive: "Inactive",
};

/* ─── Empty form ──────────────────────────────────────────── */

const EMPTY_FORM: CreateCouponPayload = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minBookingAmount: undefined,
  maxDiscountAmount: undefined,
  usageLimit: undefined,
  perUserLimit: 1,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  isActive: true,
  description: "",
};

/* ─── Modal ───────────────────────────────────────────────── */

function CouponModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: CreateCouponPayload & { id?: string };
  onSave: (data: CreateCouponPayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const isEdit = Boolean(initial.id);

  function set<K extends keyof CreateCouponPayload>(key: K, val: CreateCouponPayload[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>{isEdit ? "Edit Coupon" : "Create Coupon"}</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={s.modalBody}>
          {/* Code */}
          {!isEdit && (
            <Field label="Coupon Code *">
              <input
                style={s.input}
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                required
              />
            </Field>
          )}

          {/* Type + Value */}
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Discount Type *" style={{ flex: 1 }}>
              <select
                style={s.input}
                value={form.type}
                onChange={(e) => set("type", e.target.value as CouponType)}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (₦)</option>
              </select>
            </Field>
            <Field label={form.type === "PERCENTAGE" ? "Value (%) *" : "Amount (₦) *"} style={{ flex: 1 }}>
              <input
                style={s.input}
                type="number"
                min={0}
                max={form.type === "PERCENTAGE" ? 100 : undefined}
                value={form.value}
                onChange={(e) => set("value", Number(e.target.value))}
                required
              />
            </Field>
          </div>

          {/* Min booking + Max discount */}
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Min Booking Amount (₦)" style={{ flex: 1 }}>
              <input
                style={s.input}
                type="number"
                min={0}
                value={form.minBookingAmount ?? ""}
                onChange={(e) => set("minBookingAmount", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </Field>
            {form.type === "PERCENTAGE" && (
              <Field label="Max Discount Cap (₦)" style={{ flex: 1 }}>
                <input
                  style={s.input}
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount ?? ""}
                  onChange={(e) => set("maxDiscountAmount", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Optional"
                />
              </Field>
            )}
          </div>

          {/* Usage limits */}
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Total Usage Limit" style={{ flex: 1 }}>
              <input
                style={s.input}
                type="number"
                min={1}
                value={form.usageLimit ?? ""}
                onChange={(e) => set("usageLimit", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Per User Limit *" style={{ flex: 1 }}>
              <input
                style={s.input}
                type="number"
                min={1}
                value={form.perUserLimit ?? 1}
                onChange={(e) => set("perUserLimit", Number(e.target.value))}
                required
              />
            </Field>
          </div>

          {/* Validity */}
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Valid From *" style={{ flex: 1 }}>
              <input
                style={s.input}
                type="date"
                value={form.validFrom}
                onChange={(e) => set("validFrom", e.target.value)}
                required
              />
            </Field>
            <Field label="Valid Until *" style={{ flex: 1 }}>
              <input
                style={s.input}
                type="date"
                value={form.validUntil}
                onChange={(e) => set("validUntil", e.target.value)}
                required
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              style={{ ...s.input, height: 72, resize: "vertical" }}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Internal note about this coupon…"
            />
          </Field>

          {/* Active */}
          <div style={s.toggleRow}>
            <span style={{ fontSize: 13, color: "var(--fg-80)" }}>Active on creation</span>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: form.isActive ? "#34D399" : "var(--fg-55)" }}
              onClick={() => set("isActive", !form.isActive)}
            >
              {form.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          <div style={s.modalActions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={s.saveBtn} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCoupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listAdminCoupons({ q: query || undefined, active: filterActive })
      .then((res) => setCoupons(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filterActive]);

  const filtered = useMemo(() => coupons, [coupons]);

  const counts = useMemo(() => ({
    all: coupons.length,
    active: coupons.filter((c) => couponStatus(c) === "active").length,
    expired: coupons.filter((c) => ["expired", "exhausted"].includes(couponStatus(c))).length,
    inactive: coupons.filter((c) => couponStatus(c) === "inactive").length,
  }), [coupons]);

  const handleSave = async (data: CreateCouponPayload) => {
    setSaving(true);
    try {
      if (editTarget) {
        const { code: _code, ...rest } = data;
        await updateAdminCoupon(editTarget.id, rest);
      } else {
        await createAdminCoupon(data);
      }
      setModalOpen(false);
      setEditTarget(null);
      load();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: AdminCoupon) => {
    try {
      await toggleAdminCoupon(c.id);
      load();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to toggle coupon");
    }
  };

  const handleDelete = async (c: AdminCoupon) => {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    try {
      await deleteAdminCoupon(c.id);
      load();
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to delete coupon");
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const modalInitial: CreateCouponPayload & { id?: string } = editTarget
    ? {
        id: editTarget.id,
        code: editTarget.code,
        type: editTarget.type,
        value: editTarget.value,
        minBookingAmount: editTarget.minBookingAmount ?? undefined,
        maxDiscountAmount: editTarget.maxDiscountAmount ?? undefined,
        usageLimit: editTarget.usageLimit ?? undefined,
        perUserLimit: editTarget.perUserLimit,
        validFrom: editTarget.validFrom.slice(0, 10),
        validUntil: editTarget.validUntil.slice(0, 10),
        isActive: editTarget.isActive,
        description: editTarget.description ?? "",
      }
    : EMPTY_FORM;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <div style={s.titleRow}>
            <Tag size={18} style={{ color: "var(--fg-85)" }} />
            <h1 style={s.pageTitle}>Coupons</h1>
            <span style={s.countBadge}>{filtered.length}</span>
          </div>
          <p style={s.pageSub}>Issue and manage discount coupon codes</p>
        </div>
        <button
          style={s.createBtn}
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <Plus size={16} />
          Create Coupon
        </button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { label: "Total", count: counts.all, color: "var(--foreground)" },
          { label: "Active", count: counts.active, color: "#34D399" },
          { label: "Expired / Used Up", count: counts.expired, color: "#9CA3AF" },
          { label: "Inactive", count: counts.inactive, color: "#FCA5A5" },
        ].map((stat) => (
          <div key={stat.label} style={s.statChip}>
            <span style={{ ...s.statCount, color: stat.color }}>{stat.count}</span>
            <span style={s.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filtersRow}>
        <div style={s.searchBox}>
          <Search size={16} style={{ color: "var(--fg-55)", flexShrink: 0 }} />
          <input
            style={s.searchInput}
            placeholder="Search code or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div style={s.filterBtns}>
          {([
            { label: "All", value: undefined },
            { label: "Active", value: true },
            { label: "Inactive", value: false },
          ] as const).map((f) => (
            <button
              key={String(f.label)}
              style={{
                ...s.filterBtn,
                ...(filterActive === f.value ? s.filterBtnActive : {}),
              }}
              onClick={() => setFilterActive(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={s.card}>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.trHead}>
                <th style={s.th}>#</th>
                <th style={s.th}>Code</th>
                <th style={s.th}>Type</th>
                <th style={s.thRight}>Value</th>
                <th style={s.thRight}>Min Booking</th>
                <th style={s.th}>Usage</th>
                <th style={s.th}>Valid Period</th>
                <th style={s.th}>Status</th>
                <th style={s.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const status = couponStatus(c);
                const usagePct =
                  c.usageLimit ? Math.min(100, (c.usageCount / c.usageLimit) * 100) : null;

                return (
                  <tr key={c.id} style={s.tr}>
                    <td style={s.td}>{i + 1}</td>

                    <td style={s.td}>
                      <div style={s.codeCell}>
                        <span style={s.codeText}>{c.code}</span>
                        <button
                          style={s.copyBtn}
                          title="Copy code"
                          onClick={() => handleCopy(c.code, c.id)}
                        >
                          {copiedId === c.id ? (
                            <CheckCircle size={13} color="#34D399" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                      {c.description && (
                        <span style={s.secondaryText}>{c.description}</span>
                      )}
                    </td>

                    <td style={s.td}>
                      <span
                        style={{
                          ...s.typePill,
                          ...(c.type === "PERCENTAGE" ? s.typePct : s.typeFixed),
                        }}
                      >
                        {c.type === "PERCENTAGE" ? "%" : "₦"}
                      </span>
                    </td>

                    <td style={s.tdRight}>
                      <span style={s.valueText}>
                        {c.type === "PERCENTAGE"
                          ? `${c.value}%`
                          : fmtMoney(c.value)}
                      </span>
                      {c.maxDiscountAmount && (
                        <span style={s.secondaryText}>
                          max {fmtMoney(c.maxDiscountAmount)}
                        </span>
                      )}
                    </td>

                    <td style={s.tdRight}>
                      <span style={s.secondaryText}>
                        {c.minBookingAmount ? fmtMoney(c.minBookingAmount) : "—"}
                      </span>
                    </td>

                    <td style={s.td}>
                      <div style={s.usageCol}>
                        <span style={s.usageText}>
                          {c.usageCount}
                          {c.usageLimit !== null ? ` / ${c.usageLimit}` : " uses"}
                        </span>
                        {usagePct !== null && (
                          <div style={s.usageBar}>
                            <div
                              style={{
                                ...s.usageFill,
                                width: `${usagePct}%`,
                                background:
                                  usagePct >= 100
                                    ? "#EF4444"
                                    : usagePct >= 75
                                    ? "#FBBF24"
                                    : "#34D399",
                              }}
                            />
                          </div>
                        )}
                        <span style={s.secondaryText}>
                          {c.perUserLimit}x per user
                        </span>
                      </div>
                    </td>

                    <td style={s.td}>
                      <div style={s.twoLine}>
                        <span style={s.primaryText}>{fmt(c.validFrom)}</span>
                        <span style={s.secondaryText}>→ {fmt(c.validUntil)}</span>
                      </div>
                    </td>

                    <td style={s.td}>
                      <span style={{ ...s.statusPill, ...STATUS_STYLE[status] }}>
                        {status === "active" && <CheckCircle size={11} />}
                        {status === "expired" && <Clock size={11} />}
                        {status === "exhausted" && <Clock size={11} />}
                        {status === "inactive" && <XCircle size={11} />}
                        {STATUS_LABEL[status]}
                      </span>
                    </td>

                    <td style={s.tdRight}>
                      <div style={s.actionsRow}>
                        <button
                          style={{ ...s.iconBtn, color: c.isActive ? "#34D399" : "var(--fg-55)" }}
                          title={c.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggle(c)}
                        >
                          {c.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        </button>
                        <button
                          style={s.iconBtn}
                          title="Edit"
                          onClick={() => { setEditTarget(c); setModalOpen(true); }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          style={{ ...s.iconBtn, color: "#EF4444" }}
                          title="Delete"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr><td style={s.emptyCell} colSpan={9}>Loading coupons…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td style={s.emptyCell} colSpan={9}>No coupons found. Create your first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <CouponModal
          initial={modalInitial}
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
  page: { width: "100%", maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 },
  headerRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "var(--foreground)" },
  pageSub: { margin: "4px 0 0", fontSize: 13, color: "var(--fg-65)" },
  countBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    color: "var(--foreground)", background: "var(--glass-08)", border: "1px solid var(--glass-08)",
  },
  createBtn: {
    display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px",
    borderRadius: 10, border: "none", background: "#0A6A4B", color: "#fff",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
  },

  statsRow: { display: "flex", gap: 12 },
  statChip: {
    display: "flex", alignItems: "center", gap: 8, padding: "12px 18px",
    borderRadius: 12, background: "var(--glass-04)", border: "1px solid var(--glass-08)",
  },
  statCount: { fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  statLabel: { fontSize: 12, color: "var(--fg-60)" },

  filtersRow: { display: "flex", gap: 12, alignItems: "center" },
  searchBox: {
    display: "flex", alignItems: "center", gap: 10, height: 44, flex: 1, maxWidth: 400,
    padding: "0 14px", borderRadius: 12, border: "1px solid var(--glass-10)", background: "var(--glass-06)",
  },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--foreground)", fontSize: 14 },
  filterBtns: { display: "flex", gap: 8 },
  filterBtn: {
    height: 38, padding: "0 14px", borderRadius: 999, border: "1px solid var(--glass-10)",
    background: "var(--glass-04)", color: "var(--fg-70)", cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  filterBtnActive: { background: "var(--glass-10)", color: "var(--foreground)", border: "1px solid var(--glass-14)" },

  card: { borderRadius: 16, background: "var(--glass-04)", border: "1px solid var(--glass-08)", overflow: "hidden" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1000 },
  trHead: { background: "var(--glass-03)" },
  th: { textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--fg-65)", padding: "12px 16px", borderBottom: "1px solid var(--glass-08)", whiteSpace: "nowrap" },
  thRight: { textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--fg-65)", padding: "12px 16px", borderBottom: "1px solid var(--glass-08)", whiteSpace: "nowrap" },
  tr: {},
  td: { padding: "14px 16px", fontSize: 13, color: "var(--fg-85)", borderBottom: "1px solid var(--glass-06)", verticalAlign: "middle" },
  tdRight: { padding: "14px 16px", textAlign: "right", borderBottom: "1px solid var(--glass-06)", verticalAlign: "middle" },
  twoLine: { display: "flex", flexDirection: "column", gap: 3 },
  primaryText: { fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  secondaryText: { fontSize: 11, color: "var(--fg-55)" },

  codeCell: { display: "flex", alignItems: "center", gap: 6 },
  codeText: { fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: "var(--foreground)", letterSpacing: 1 },
  copyBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--fg-55)", display: "flex", padding: 2 },

  typePill: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: 8, fontSize: 13, fontWeight: 800,
  },
  typePct: { background: "rgba(167,139,250,0.14)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.22)" },
  typeFixed: { background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.22)" },

  valueText: { fontSize: 14, fontWeight: 800, color: "var(--foreground)", display: "block" },

  usageCol: { display: "flex", flexDirection: "column", gap: 4, minWidth: 100 },
  usageText: { fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  usageBar: { height: 4, borderRadius: 2, background: "var(--glass-08)", overflow: "hidden" },
  usageFill: { height: "100%", borderRadius: 2 },

  statusPill: {
    display: "inline-flex", alignItems: "center", gap: 5, height: 26, padding: "0 10px",
    borderRadius: 999, fontSize: 11, fontWeight: 700,
  },

  actionsRow: { display: "flex", justifyContent: "flex-end", gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8, border: "1px solid var(--glass-10)",
    background: "var(--glass-06)", color: "var(--fg-70)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
  emptyCell: { padding: 24, textAlign: "center", color: "var(--fg-65)", fontSize: 13 },

  /* modal */
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
  },
  modal: {
    background: "var(--sidebar-bg)", borderRadius: 18, border: "1px solid var(--glass-10)",
    width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
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
  input: {
    height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--glass-10)",
    background: "var(--glass-06)", color: "var(--foreground)", fontSize: 14, width: "100%", outline: "none",
  },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
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
