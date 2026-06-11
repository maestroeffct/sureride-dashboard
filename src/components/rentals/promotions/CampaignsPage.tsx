"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil, Calendar, Tag, Power } from "lucide-react";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
} from "@/src/lib/platformSettingsDraftApi";

// ── Types ────────────────────────────────────────────────────────────────────

type CampaignType = "PERCENT_OFF" | "FIXED_OFF" | "FREE_DAY" | "CREDIT";

type Campaign = {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  value: number;
  startDate: string; // ISO
  endDate: string; // ISO
  targetSegment: "ALL" | "NEW_USERS" | "RETURNING" | "PROVIDERS";
  isActive: boolean;
  createdAt: string;
};

const SEGMENT_LABELS: Record<Campaign["targetSegment"], string> = {
  ALL: "All Users",
  NEW_USERS: "New Users",
  RETURNING: "Returning Users",
  PROVIDERS: "Providers",
};

const TYPE_LABELS: Record<CampaignType, string> = {
  PERCENT_OFF: "% Discount",
  FIXED_OFF: "Fixed Amount Off",
  FREE_DAY: "Free Rental Days",
  CREDIT: "Account Credit",
};

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

function emptyCampaign(): Campaign {
  const now = new Date();
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: uid(),
    name: "",
    description: "",
    type: "PERCENT_OFF",
    value: 10,
    startDate: now.toISOString().slice(0, 10),
    endDate: inAMonth.toISOString().slice(0, 10),
    targetSegment: "ALL",
    isActive: true,
    createdAt: now.toISOString(),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPlatformSettingsDraft();
        const raw = res.items["promo-campaigns"] as { items?: Campaign[] } | undefined;
        if (raw?.items && Array.isArray(raw.items)) {
          setCampaigns(raw.items);
        }
      } catch {
        // fall back to empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next: Campaign[]) => {
    setCampaigns(next);
    try {
      setSaving(true);
      await savePlatformSettingsDraft("promo-campaigns", { items: next });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (campaign: Campaign) => {
    if (!campaign.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    const exists = campaigns.find((c) => c.id === campaign.id);
    const next = exists
      ? campaigns.map((c) => (c.id === campaign.id ? campaign : c))
      : [...campaigns, campaign];
    await persist(next);
    setEditing(null);
    toast.success(exists ? "Campaign updated" : "Campaign created");
  };

  const handleToggleActive = async (id: string) => {
    const next = campaigns.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    await persist(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    await persist(campaigns.filter((c) => c.id !== id));
    toast.success("Campaign deleted");
  };

  const sorted = useMemo(
    () => [...campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [campaigns],
  );

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Loading campaigns…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {editing && (
        <CampaignModal
          campaign={editing}
          onSave={handleSaveEdit}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      <div style={s.header}>
        <div>
          <h1 style={s.title}>Campaigns</h1>
          <p style={s.desc}>
            Time-bound promotional campaigns. Each campaign defines a discount or
            credit, a target segment, and active dates.
          </p>
        </div>
        <button style={s.createBtn} onClick={() => setEditing(emptyCampaign())}>
          <Plus size={15} />
          New Campaign
        </button>
      </div>

      {sorted.length === 0 ? (
        <div style={s.empty}>
          No campaigns yet. Click <strong>New Campaign</strong> to create the first one.
        </div>
      ) : (
        <div style={s.grid}>
          {sorted.map((c) => {
            const now = new Date();
            const start = new Date(c.startDate);
            const end = new Date(c.endDate);
            const isLive = c.isActive && now >= start && now <= end;
            const isExpired = now > end;
            const isUpcoming = now < start;
            return (
              <div key={c.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <p style={s.cardName}>{c.name || "Untitled campaign"}</p>
                    <p style={s.cardDesc}>{c.description || "—"}</p>
                  </div>
                  <span
                    style={{
                      ...s.statusPill,
                      ...(isLive
                        ? s.pillLive
                        : isUpcoming
                          ? s.pillUpcoming
                          : isExpired
                            ? s.pillExpired
                            : s.pillInactive),
                    }}
                  >
                    {isLive ? "Live" : isUpcoming ? "Upcoming" : isExpired ? "Expired" : "Off"}
                  </span>
                </div>
                <div style={s.metaRow}>
                  <span style={s.metaChip}>
                    <Tag size={11} /> {TYPE_LABELS[c.type]}: <strong>{c.value}{c.type === "PERCENT_OFF" ? "%" : ""}</strong>
                  </span>
                  <span style={s.metaChip}>
                    <Calendar size={11} /> {c.startDate} → {c.endDate}
                  </span>
                  <span style={s.metaChip}>Segment: {SEGMENT_LABELS[c.targetSegment]}</span>
                </div>
                <div style={s.cardActions}>
                  <button style={s.iconBtn} onClick={() => handleToggleActive(c.id)} title={c.isActive ? "Disable" : "Enable"}>
                    <Power size={14} color={c.isActive ? "#22c55e" : "var(--muted-foreground)"} />
                  </button>
                  <button style={s.iconBtn} onClick={() => setEditing(c)} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button
                    style={{ ...s.iconBtn, color: "#ef4444" }}
                    onClick={() => handleDelete(c.id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

function CampaignModal({
  campaign,
  onSave,
  onCancel,
  saving,
}: {
  campaign: Campaign;
  onSave: (c: Campaign) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Campaign>(campaign);
  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  return (
    <div style={m.overlay} onClick={onCancel}>
      <div style={m.modal} onClick={(e) => e.stopPropagation()}>
        <div style={m.head}>
          <h2 style={m.title}>{campaign.id ? "Edit Campaign" : "New Campaign"}</h2>
          <button style={m.close} onClick={onCancel}>✕</button>
        </div>

        <div style={m.body}>
          <Field label="Campaign Name *">
            <input style={s.input} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Black Friday 20% off" />
          </Field>

          <Field label="Description">
            <textarea
              style={{ ...s.input, height: 70, padding: "10px 12px", resize: "vertical" }}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Internal description for the ops team"
            />
          </Field>

          <div style={s.grid2}>
            <Field label="Reward Type">
              <select style={s.input} value={draft.type} onChange={(e) => set("type", e.target.value as CampaignType)}>
                <option value="PERCENT_OFF">% Discount</option>
                <option value="FIXED_OFF">Fixed Amount Off</option>
                <option value="FREE_DAY">Free Rental Days</option>
                <option value="CREDIT">Account Credit</option>
              </select>
            </Field>
            <Field label={draft.type === "PERCENT_OFF" ? "Discount %" : draft.type === "FREE_DAY" ? "Free Days" : "Amount (NGN)"}>
              <input
                style={s.input}
                type="number"
                min={0}
                value={draft.value}
                onChange={(e) => set("value", Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <div style={s.grid2}>
            <Field label="Start Date">
              <input style={s.input} type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            <Field label="End Date">
              <input style={s.input} type="date" value={draft.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
          </div>

          <Field label="Target Segment">
            <select style={s.input} value={draft.targetSegment} onChange={(e) => set("targetSegment", e.target.value as Campaign["targetSegment"])}>
              <option value="ALL">All Users</option>
              <option value="NEW_USERS">New Users (first booking)</option>
              <option value="RETURNING">Returning Users</option>
              <option value="PROVIDERS">Providers</option>
            </select>
          </Field>

          <label style={m.checkRow}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              style={{ accentColor: "var(--brand-primary)" }}
            />
            Active immediately
          </label>
        </div>

        <div style={m.foot}>
          <button style={m.cancel} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...m.save, opacity: saving ? 0.55 : 1 }}
            disabled={saving}
            onClick={() => onSave(draft)}
          >
            {saving ? "Saving…" : "Save Campaign"}
          </button>
        </div>
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

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 1080, display: "flex", flexDirection: "column", gap: 20 },
  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: { width: 22, height: 22, borderRadius: "50%", border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.8s linear infinite" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  title: { margin: 0, fontSize: 22, fontWeight: 750, letterSpacing: -0.4 },
  desc: { margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 540 },
  createBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 },

  empty: { padding: 40, textAlign: "center", border: "1px dashed var(--input-border)", borderRadius: 14, color: "var(--muted-foreground)", fontSize: 13 },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  cardName: { margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  cardDesc: { margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 },
  statusPill: { fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, letterSpacing: 0.5, textTransform: "uppercase", flexShrink: 0 },
  pillLive: { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
  pillUpcoming: { background: "color-mix(in srgb, var(--brand-primary) 15%, transparent)", color: "var(--brand-primary)", border: "1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)" },
  pillExpired: { background: "rgba(115,115,115,0.15)", color: "var(--muted-foreground)", border: "1px solid var(--input-border)" },
  pillInactive: { background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" },

  metaRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  metaChip: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 9px", borderRadius: 6, background: "var(--surface-2)", border: "1px solid var(--input-border)", color: "var(--foreground)" },

  cardActions: { display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--input-border)" },
  iconBtn: { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" },

  input: { height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg, var(--surface-2))", color: "var(--foreground)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
};

const m: Record<string, CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 },
  modal: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 16, width: 540, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--input-border)" },
  title: { margin: 0, fontSize: 16, fontWeight: 700 },
  close: { background: "transparent", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 16 },
  body: { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" },
  checkRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--foreground)" },
  foot: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--input-border)" },
  cancel: { padding: "9px 18px", borderRadius: 10, border: "1px solid var(--input-border)", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 13 },
  save: { padding: "9px 22px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 },
};
