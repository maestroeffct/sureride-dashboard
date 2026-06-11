"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, ExternalLink, Image as ImageIcon, MoveUp, MoveDown } from "lucide-react";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
} from "@/src/lib/platformSettingsDraftApi";

// ── Types ────────────────────────────────────────────────────────────────────

type BannerPlacement = "HOME_HERO" | "HOME_BELOW_HERO" | "BOOKING_TOP" | "PROFILE_TOP";

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  placement: BannerPlacement;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
};

const PLACEMENT_LABELS: Record<BannerPlacement, string> = {
  HOME_HERO: "Home — Hero",
  HOME_BELOW_HERO: "Home — Below Hero",
  BOOKING_TOP: "Booking Screen — Top",
  PROFILE_TOP: "Profile Screen — Top",
};

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

function emptyBanner(): Banner {
  const today = new Date().toISOString().slice(0, 10);
  const later = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    id: uid(),
    title: "",
    imageUrl: "",
    ctaLabel: "Learn More",
    ctaUrl: "",
    placement: "HOME_HERO",
    startDate: today,
    endDate: later,
    isActive: true,
    sortOrder: 1,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPlatformSettingsDraft();
        const raw = res.items["promo-banners"] as { items?: Banner[] } | undefined;
        if (raw?.items && Array.isArray(raw.items)) {
          setBanners(raw.items.sort((a, b) => a.sortOrder - b.sortOrder));
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next: Banner[]) => {
    setBanners(next);
    try {
      setSaving(true);
      await savePlatformSettingsDraft("promo-banners", { items: next });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    const next = [...banners, { ...emptyBanner(), sortOrder: banners.length + 1 }];
    void persist(next);
    toast.success("Banner added — fill in the details");
  };

  const updateBanner = (id: string, patch: Partial<Banner>) => {
    setBanners((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const saveAll = async () => {
    await persist(banners);
    toast.success("All banner changes saved");
  };

  const deleteBanner = (id: string) => {
    if (!confirm("Delete this banner?")) return;
    void persist(banners.filter((b) => b.id !== id));
    toast.success("Banner deleted");
  };

  const moveBanner = (id: string, direction: "up" | "down") => {
    const idx = banners.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    const next = [...banners];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    // Re-number sortOrder to keep things stable
    next.forEach((b, i) => (b.sortOrder = i + 1));
    void persist(next);
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Loading banners…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Banners</h1>
          <p style={s.desc}>
            In-app promotional banners. Each banner targets a placement and shows
            during its active window.
          </p>
        </div>
        <div style={s.headerActions}>
          <button style={s.addBtn} onClick={addBanner}>
            <Plus size={15} />
            New Banner
          </button>
          <button
            style={{ ...s.saveBtn, opacity: saving ? 0.55 : 1 }}
            onClick={saveAll}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save All"}
          </button>
        </div>
      </div>

      {banners.length === 0 ? (
        <div style={s.empty}>
          No banners yet. Click <strong>New Banner</strong> to add one.
        </div>
      ) : (
        <div style={s.list}>
          {banners.map((banner, idx) => (
            <div key={banner.id} style={s.card}>
              {/* Preview */}
              <div style={s.preview}>
                {banner.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={banner.imageUrl} alt="" style={s.previewImg} />
                ) : (
                  <div style={s.previewEmpty}>
                    <ImageIcon size={26} color="var(--muted-foreground)" />
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
                      No image
                    </span>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div style={s.fields}>
                <div style={s.fieldRow}>
                  <Field label="Title">
                    <input
                      style={s.input}
                      value={banner.title}
                      onChange={(e) => updateBanner(banner.id, { title: e.target.value })}
                      placeholder="e.g. Holiday Specials"
                    />
                  </Field>
                  <Field label="Placement">
                    <select
                      style={s.input}
                      value={banner.placement}
                      onChange={(e) => updateBanner(banner.id, { placement: e.target.value as BannerPlacement })}
                    >
                      {(Object.keys(PLACEMENT_LABELS) as BannerPlacement[]).map((p) => (
                        <option key={p} value={p}>{PLACEMENT_LABELS[p]}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Image URL">
                  <div style={s.inputWithBtn}>
                    <input
                      style={{ ...s.input, paddingRight: 40 }}
                      value={banner.imageUrl}
                      onChange={(e) => updateBanner(banner.id, { imageUrl: e.target.value })}
                      placeholder="https://… or upload to your CDN first"
                    />
                    {banner.imageUrl && (
                      <a href={banner.imageUrl} target="_blank" rel="noopener noreferrer" style={s.openLink} title="Open">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </Field>

                <div style={s.fieldRow}>
                  <Field label="CTA Label">
                    <input
                      style={s.input}
                      value={banner.ctaLabel}
                      onChange={(e) => updateBanner(banner.id, { ctaLabel: e.target.value })}
                      placeholder="Learn More"
                    />
                  </Field>
                  <Field label="CTA URL or Path">
                    <input
                      style={s.input}
                      value={banner.ctaUrl}
                      onChange={(e) => updateBanner(banner.id, { ctaUrl: e.target.value })}
                      placeholder="/promotions/holiday or https://…"
                    />
                  </Field>
                </div>

                <div style={s.fieldRow}>
                  <Field label="Start Date">
                    <input
                      style={s.input}
                      type="date"
                      value={banner.startDate}
                      onChange={(e) => updateBanner(banner.id, { startDate: e.target.value })}
                    />
                  </Field>
                  <Field label="End Date">
                    <input
                      style={s.input}
                      type="date"
                      value={banner.endDate}
                      onChange={(e) => updateBanner(banner.id, { endDate: e.target.value })}
                    />
                  </Field>
                </div>

                <label style={s.activeRow}>
                  <input
                    type="checkbox"
                    checked={banner.isActive}
                    onChange={(e) => updateBanner(banner.id, { isActive: e.target.checked })}
                    style={{ accentColor: "var(--brand-primary)" }}
                  />
                  Active — visible to users
                </label>
              </div>

              {/* Actions */}
              <div style={s.cardActions}>
                <button
                  style={{ ...s.iconBtn, opacity: idx === 0 ? 0.3 : 1, cursor: idx === 0 ? "not-allowed" : "pointer" }}
                  onClick={() => moveBanner(banner.id, "up")}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <MoveUp size={14} />
                </button>
                <button
                  style={{ ...s.iconBtn, opacity: idx === banners.length - 1 ? 0.3 : 1, cursor: idx === banners.length - 1 ? "not-allowed" : "pointer" }}
                  onClick={() => moveBanner(banner.id, "down")}
                  disabled={idx === banners.length - 1}
                  title="Move down"
                >
                  <MoveDown size={14} />
                </button>
                <button
                  style={{ ...s.iconBtn, color: "#ef4444" }}
                  onClick={() => deleteBanner(banner.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 1100, display: "flex", flexDirection: "column", gap: 18 },
  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: { width: 22, height: 22, borderRadius: "50%", border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.8s linear infinite" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  title: { margin: 0, fontSize: 22, fontWeight: 750, letterSpacing: -0.4 },
  desc: { margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 540 },
  headerActions: { display: "flex", gap: 10 },
  addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  saveBtn: { padding: "9px 22px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 },

  empty: { padding: 40, textAlign: "center", border: "1px dashed var(--input-border)", borderRadius: 14, color: "var(--muted-foreground)", fontSize: 13 },

  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 16, display: "flex", gap: 16 },
  preview: { width: 180, height: 110, borderRadius: 10, overflow: "hidden", background: "var(--surface-2)", border: "1px solid var(--input-border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  previewEmpty: { display: "flex", flexDirection: "column", alignItems: "center" },

  fields: { flex: 1, display: "flex", flexDirection: "column", gap: 10 },
  fieldRow: { display: "flex", gap: 10 },
  activeRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--foreground)" },

  cardActions: { display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", display: "inline-flex", alignItems: "center", justifyContent: "center" },

  input: { height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg, var(--surface-2))", color: "var(--foreground)", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" },
  label: { fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },

  inputWithBtn: { position: "relative" },
  openLink: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 5 },
};
