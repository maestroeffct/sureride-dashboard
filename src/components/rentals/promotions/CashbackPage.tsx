"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Wallet, Info } from "lucide-react";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
} from "@/src/lib/platformSettingsDraftApi";

// ── Types ────────────────────────────────────────────────────────────────────

type CashbackRule = {
  id: string;
  label: string;
  minBookingAmount: number;
  cashbackPercent: number;
  maxCashbackAmount: number;
  isActive: boolean;
};

type CashbackConfig = {
  enabled: boolean;
  walletEnabled: boolean;
  expiryDays: number;
  rules: CashbackRule[];
};

const DEFAULT_CONFIG: CashbackConfig = {
  enabled: false,
  walletEnabled: true,
  expiryDays: 90,
  rules: [],
};

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

function emptyRule(): CashbackRule {
  return {
    id: uid(),
    label: "",
    minBookingAmount: 0,
    cashbackPercent: 5,
    maxCashbackAmount: 5000,
    isActive: true,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function CashbackPage() {
  const [config, setConfig] = useState<CashbackConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPlatformSettingsDraft();
        const raw = res.items["promo-cashback"] as Partial<CashbackConfig> | undefined;
        if (raw) {
          setConfig({
            enabled: Boolean(raw.enabled ?? DEFAULT_CONFIG.enabled),
            walletEnabled: Boolean(raw.walletEnabled ?? DEFAULT_CONFIG.walletEnabled),
            expiryDays: Number(raw.expiryDays) || DEFAULT_CONFIG.expiryDays,
            rules: Array.isArray(raw.rules) ? raw.rules : [],
          });
        }
      } catch {
        // fall back to defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = <K extends keyof CashbackConfig>(key: K, value: CashbackConfig[K]) => {
    setConfig((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const updateRule = (id: string, patch: Partial<CashbackRule>) => {
    setConfig((p) => ({
      ...p,
      rules: p.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    setDirty(true);
  };

  const addRule = () => {
    setConfig((p) => ({ ...p, rules: [...p.rules, emptyRule()] }));
    setDirty(true);
  };

  const deleteRule = (id: string) => {
    setConfig((p) => ({ ...p, rules: p.rules.filter((r) => r.id !== id) }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await savePlatformSettingsDraft(
        "promo-cashback",
        config as unknown as Record<string, unknown>,
      );
      toast.success("Cashback settings saved");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Loading cashback settings…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Cashback Program</h1>
          <p style={s.desc}>
            Reward bookings with cashback credited to the user&apos;s wallet. Rules
            evaluate top-down — the first matching tier wins.
          </p>
        </div>
      </div>

      {/* Global toggles */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.cardTitle}>Global Settings</h2>
        </div>
        <div style={s.cardBody}>
          <ToggleRow
            title="Cashback program enabled"
            desc="When OFF, no cashback is awarded regardless of rules below."
            on={config.enabled}
            onToggle={() => setField("enabled", !config.enabled)}
          />
          <ToggleRow
            title="Credit cashback to user wallet"
            desc="If OFF, cashback is shown as a discount on the next booking instead."
            on={config.walletEnabled}
            onToggle={() => setField("walletEnabled", !config.walletEnabled)}
          />
          <Field label="Wallet expiry (days)">
            <input
              style={s.input}
              type="number"
              min={1}
              max={3650}
              value={config.expiryDays}
              onChange={(e) => setField("expiryDays", Number(e.target.value) || 0)}
            />
            <span style={s.hint}>Unused cashback expires after this many days.</span>
          </Field>
        </div>
      </div>

      {/* Rules */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.cardTitle}>Cashback Tiers</h2>
          <button style={s.addBtn} onClick={addRule}>
            <Plus size={13} />
            Add Tier
          </button>
        </div>
        <div style={s.cardBody}>
          <div style={s.infoBox}>
            <Info size={13} />
            <span>
              Rules apply when booking total exceeds <strong>Min Booking</strong>.
              Cashback = booking × <strong>%</strong>, capped at <strong>Max Cashback</strong>.
            </span>
          </div>

          {config.rules.length === 0 ? (
            <div style={s.emptyInline}>
              No tiers configured. Click <strong>Add Tier</strong> above.
            </div>
          ) : (
            <div style={s.rulesList}>
              {config.rules.map((rule) => (
                <div key={rule.id} style={s.ruleRow}>
                  <div style={s.ruleIcon}>
                    <Wallet size={15} />
                  </div>
                  <div style={s.ruleFields}>
                    <Field label="Label">
                      <input
                        style={s.input}
                        value={rule.label}
                        onChange={(e) => updateRule(rule.id, { label: e.target.value })}
                        placeholder="e.g. Tier 1 — small bookings"
                      />
                    </Field>
                    <div style={s.grid3}>
                      <Field label="Min Booking (NGN)">
                        <input
                          style={s.input}
                          type="number"
                          min={0}
                          value={rule.minBookingAmount}
                          onChange={(e) => updateRule(rule.id, { minBookingAmount: Number(e.target.value) || 0 })}
                        />
                      </Field>
                      <Field label="Cashback %">
                        <input
                          style={s.input}
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={rule.cashbackPercent}
                          onChange={(e) => updateRule(rule.id, { cashbackPercent: Number(e.target.value) || 0 })}
                        />
                      </Field>
                      <Field label="Max Cashback (NGN)">
                        <input
                          style={s.input}
                          type="number"
                          min={0}
                          value={rule.maxCashbackAmount}
                          onChange={(e) => updateRule(rule.id, { maxCashbackAmount: Number(e.target.value) || 0 })}
                        />
                      </Field>
                    </div>
                    <label style={s.activeRow}>
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(e) => updateRule(rule.id, { isActive: e.target.checked })}
                        style={{ accentColor: "var(--brand-primary)" }}
                      />
                      Active
                    </label>
                  </div>
                  <button
                    style={s.deleteRuleBtn}
                    onClick={() => deleteRule(rule.id)}
                    title="Delete tier"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={s.saveBar}>
        <button
          style={{
            ...s.saveBtn,
            opacity: saving || !dirty ? 0.5 : 1,
            cursor: saving || !dirty ? "not-allowed" : "pointer",
          }}
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? "Saving…" : dirty ? "Save Cashback Settings" : "Saved"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ title, desc, on, onToggle }: { title: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={s.toggleRow}>
      <div style={{ flex: 1 }}>
        <p style={s.toggleTitle}>{title}</p>
        <p style={s.toggleDesc}>{desc}</p>
      </div>
      <div
        onClick={onToggle}
        style={{ ...s.track, background: on ? "var(--brand-primary)" : "var(--glass-08)" }}
      >
        <div style={{ ...s.knob, left: on ? 23 : 3 }} />
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 980, display: "flex", flexDirection: "column", gap: 18 },
  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: { width: 22, height: 22, borderRadius: "50%", border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.8s linear infinite" },

  header: { display: "flex", justifyContent: "space-between" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, letterSpacing: -0.4 },
  desc: { margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 580 },

  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, overflow: "hidden" },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--input-border)", background: "var(--surface-2)" },
  cardTitle: { margin: 0, fontSize: 14, fontWeight: 700 },
  cardBody: { padding: 18, display: "flex", flexDirection: "column", gap: 14 },

  addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", cursor: "pointer", fontSize: 12, fontWeight: 600 },

  infoBox: { display: "flex", gap: 8, padding: "10px 12px", background: "color-mix(in srgb, var(--brand-primary) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)", borderRadius: 8, fontSize: 12, color: "var(--foreground)", lineHeight: 1.55 },

  emptyInline: { padding: 24, textAlign: "center", border: "1px dashed var(--input-border)", borderRadius: 10, color: "var(--muted-foreground)", fontSize: 13 },

  rulesList: { display: "flex", flexDirection: "column", gap: 12 },
  ruleRow: { display: "flex", gap: 12, padding: 14, background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--input-border)" },
  ruleIcon: { width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 22 },
  ruleFields: { flex: 1, display: "flex", flexDirection: "column", gap: 10 },
  activeRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--foreground)" },
  deleteRuleBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-start", marginTop: 22 },

  toggleRow: { display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--input-border)" },
  toggleTitle: { margin: 0, fontSize: 13, fontWeight: 700 },
  toggleDesc: { margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 },
  track: { width: 44, height: 24, borderRadius: 999, position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" },
  knob: { position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" },

  input: { height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg, var(--surface-1))", color: "var(--foreground)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  label: { fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  hint: { fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },

  saveBar: { display: "flex", justifyContent: "flex-end" },
  saveBtn: { padding: "11px 22px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#fff", fontSize: 14, fontWeight: 700 },
};
