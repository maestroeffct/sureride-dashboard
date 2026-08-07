"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import {
  Send,
  Users,
  Building2,
  Globe,
  Bell,
  Check,
  AlertTriangle,
  RotateCw,
  Trash2,
  Upload,
  X as XIcon,
} from "lucide-react";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
} from "@/src/lib/platformSettingsDraftApi";
import {
  sendPromoPush,
  uploadPromoPushImage,
  type PromoPushSegment,
} from "@/src/lib/adminPromotionsApi";

type HistoryEntry = {
  id: string;
  title: string;
  body: string;
  segment: PromoPushSegment;
  deepLink: string | null;
  imageUrl: string | null;
  sent: number;
  failed: number;
  totalDevices: number;
  sentAt: string;
};

/**
 * Predefined deep-link targets — matches what the mobile
 * routeFromNotificationData handler knows how to open. "Custom URL"
 * unlocks the free-text input for edge cases (external URL, a
 * specific booking id the admin knows, etc.).
 */
const DEEP_LINK_PRESETS: Array<{ value: string; label: string; hint?: string }> = [
  { value: "", label: "None (opens inbox on tap)" },
  { value: "/notifications", label: "Notifications Inbox" },
  { value: "/bookings", label: "My Bookings" },
  { value: "/home", label: "Home" },
  { value: "/verify", label: "KYC / Verification" },
  { value: "/profile", label: "Profile" },
  { value: "/search", label: "Search cars" },
  { value: "__custom__", label: "Custom URL…", hint: "External URL or a specific route with an ID" },
];

const SEGMENTS: { key: PromoPushSegment; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: "ALL_USERS", label: "All Users", desc: "Every registered rider with a device", icon: <Users size={16} /> },
  { key: "ALL_PROVIDERS", label: "All Providers", desc: "Every active rental provider", icon: <Building2 size={16} /> },
  { key: "EVERYONE", label: "Everyone", desc: "Users + providers — broadcast", icon: <Globe size={16} /> },
];

export default function PushNotificationPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<PromoPushSegment>("ALL_USERS");
  // deepLink is either a preset value or, when linkPreset is "__custom__",
  // whatever the admin types. Keep them separate so switching between
  // presets doesn't blow away the custom entry.
  const [linkPreset, setLinkPreset] = useState<string>("");
  const [customDeepLink, setCustomDeepLink] = useState("");
  const deepLink = linkPreset === "__custom__" ? customDeepLink : linkPreset;
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pushConfigured, setPushConfigured] = useState<boolean | null>(null);

  const loadHistory = async () => {
    try {
      const res = await listPlatformSettingsDraft();
      const raw = res.items["promo-push-history"] as { items?: HistoryEntry[] } | undefined;
      if (raw?.items && Array.isArray(raw.items)) {
        setHistory(raw.items);
      }
      // Also check if FCM key is configured
      const push = res.items["push-config"] as
        | { serverKey?: string; serviceAccountJson?: string }
        | undefined;
      setPushConfigured(
        Boolean(push?.serviceAccountJson?.trim() || push?.serverKey?.trim()),
      );
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  // Per-row delete — mutates the local history array and persists back to
  // the promo-push-history platform setting. Soft-fail on the API call so
  // the optimistic remove still feels snappy.
  const handleDelete = async (id: string) => {
    if (!confirm("Remove this entry from the send history? Cannot be undone.")) return;
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    try {
      await savePlatformSettingsDraft("promo-push-history", { items: next });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save history");
    }
  };

  // Per-row resend — fires the same payload again. Confirms first because
  // segment broadcasts are expensive (FCM rate limits + user fatigue).
  const handleResend = async (entry: HistoryEntry) => {
    if (sending) return;
    const seg = SEGMENTS.find((s) => s.key === entry.segment);
    if (!confirm(`Re-send "${entry.title}" to ${seg?.label ?? entry.segment}?`)) {
      return;
    }
    try {
      setSending(true);
      const result = await sendPromoPush({
        title: entry.title,
        body: entry.body,
        segment: entry.segment,
        deepLink: entry.deepLink ?? undefined,
        imageUrl: entry.imageUrl ?? undefined,
      });
      if (result.message) {
        toast(result.message, { icon: "ℹ️" });
      } else {
        toast.success(`Re-sent to ${result.sent} of ${result.totalDevices} devices`);
      }
      await loadHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resend failed");
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await uploadPromoPushImage(file);
      setImageUrl(res.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSend = async () => {
    if (sending) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }
    if (!confirm(`Send this push to "${SEGMENTS.find((s) => s.key === segment)?.label}"? This cannot be undone.`)) {
      return;
    }
    try {
      setSending(true);
      const result = await sendPromoPush({
        title: title.trim(),
        body: body.trim(),
        segment,
        deepLink: deepLink.trim() || undefined,
        imageUrl: imageUrl || undefined,
      });
      if (result.message) {
        toast(result.message, { icon: "ℹ️" });
      } else {
        toast.success(`Delivered to ${result.sent} of ${result.totalDevices} devices`);
      }
      // Clear form + refresh history
      setTitle("");
      setBody("");
      setLinkPreset("");
      setCustomDeepLink("");
      setImageUrl("");
      await loadHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Push Notifications</h1>
          <p style={s.desc}>
            Compose and broadcast a push notification to a segment of your users. All
            sends are recorded in the history below.
          </p>
        </div>
      </div>

      {/* FCM config warning */}
      {pushConfigured === false && (
        <div style={s.warningBanner}>
          <AlertTriangle size={16} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>
              FCM credentials not configured
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
              Add Service Account JSON in <strong>Platform Settings → Notification Channels → Push → Configure</strong> before sending.
            </p>
          </div>
        </div>
      )}

      <div style={s.row}>
        {/* Compose */}
        <div style={s.composeCard}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Compose</h2>
          </div>
          <div style={s.cardBody}>
            <Field label="Notification Title *">
              <input
                style={s.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🎉 Holiday Special — 20% Off This Weekend"
                maxLength={65}
              />
              <span style={s.hint}>{title.length}/65 characters</span>
            </Field>

            <Field label="Message Body *">
              <textarea
                style={s.textarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tap to learn more about our holiday rental deals."
                rows={3}
                maxLength={240}
              />
              <span style={s.hint}>{body.length}/240 characters</span>
            </Field>

            <Field label="Image (optional)">
              {imageUrl ? (
                <div style={s.imagePreviewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Attached" style={s.imagePreview} />
                  <button
                    type="button"
                    style={s.imageRemove}
                    onClick={() => setImageUrl("")}
                    aria-label="Remove image"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ) : (
                <label style={s.imagePicker}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImagePick(e.target.files?.[0] ?? null)}
                    disabled={uploadingImage}
                  />
                  <Upload size={16} />
                  <span>{uploadingImage ? "Uploading…" : "Choose an image (5MB max)"}</span>
                </label>
              )}
              <span style={s.hint}>
                Renders as a large image on Android; iOS shows it as an
                attachment (needs Notification Service Extension).
              </span>
            </Field>

            <Field label="Deep Link (optional)">
              <select
                style={s.input}
                value={linkPreset}
                onChange={(e) => setLinkPreset(e.target.value)}
              >
                {DEEP_LINK_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {linkPreset === "__custom__" && (
                <input
                  style={{ ...s.input, marginTop: 8 }}
                  value={customDeepLink}
                  onChange={(e) => setCustomDeepLink(e.target.value)}
                  placeholder="/bookings/abc123 or https://…"
                />
              )}
              <span style={s.hint}>
                Where the notification leads when tapped.
                {DEEP_LINK_PRESETS.find((p) => p.value === linkPreset)?.hint
                  ? ` ${DEEP_LINK_PRESETS.find((p) => p.value === linkPreset)?.hint}`
                  : ""}
              </span>
            </Field>

            <Field label="Target Segment">
              <div style={s.segmentGrid}>
                {SEGMENTS.map((seg) => {
                  const selected = segment === seg.key;
                  return (
                    <button
                      key={seg.key}
                      type="button"
                      style={{ ...s.segmentCard, ...(selected ? s.segmentCardActive : {}) }}
                      onClick={() => setSegment(seg.key)}
                    >
                      <div style={{ ...s.segmentIcon, ...(selected ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : {}) }}>
                        {seg.icon}
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ ...s.segmentLabel, ...(selected ? { color: "#fff" } : {}) }}>{seg.label}</p>
                        <p style={{ ...s.segmentDesc, ...(selected ? { color: "rgba(255,255,255,0.85)" } : {}) }}>{seg.desc}</p>
                      </div>
                      {selected && <Check size={16} color="#fff" />}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Preview — approximates an Android bigPicture
                notification card. Small icon + app name + time in the
                header row; title + body next; expanded image below
                (matches what Notifee renders in the tray). */}
            <div style={s.previewSection}>
              <p style={s.previewLabel}>Live Preview — Android tray</p>
              <div style={s.phonePreview}>
                <div style={s.previewHeader}>
                  <div style={s.previewAppIcon}>
                    <Bell size={11} color="#fff" />
                  </div>
                  <span style={s.previewAppName}>SureRide</span>
                  <span style={s.previewDot}>·</span>
                  <span style={s.previewTime}>now</span>
                </div>
                <p style={s.previewTitle}>{title || "Your title appears here"}</p>
                <p style={s.previewBody}>
                  {body || "Your message body appears here. Keep it short and actionable."}
                </p>
                {imageUrl && (
                  <div style={s.previewImageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Attachment"
                      style={s.previewImage}
                    />
                  </div>
                )}
              </div>
              <span style={s.hint}>
                Actual layout varies by device. iOS shows a compact
                banner by default; expanded view + image needs the
                Notification Service Extension.
              </span>
            </div>

            <button
              style={{
                ...s.sendBtn,
                opacity: sending || !title.trim() || !body.trim() ? 0.55 : 1,
                cursor: sending || !title.trim() || !body.trim() ? "not-allowed" : "pointer",
              }}
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
            >
              <Send size={14} />
              {sending ? "Sending…" : `Send to ${SEGMENTS.find((s) => s.key === segment)?.label}`}
            </button>
          </div>
        </div>

        {/* History */}
        <div style={s.historyCard}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Recent Sends</h2>
          </div>
          <div style={{ ...s.cardBody, padding: 0 }}>
            {loadingHistory ? (
              <div style={{ padding: 24, color: "var(--muted-foreground)", fontSize: 13 }}>
                Loading…
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: 24, color: "var(--muted-foreground)", fontSize: 13, textAlign: "center" }}>
                No sends yet
              </div>
            ) : (
              <div style={s.historyList}>
                {history.map((h) => (
                  <div key={h.id} style={s.historyItem}>
                    <div style={s.historyTop}>
                      <span style={s.historyTitle}>{h.title}</span>
                      <span style={s.historyDate}>
                        {new Date(h.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <p style={s.historyBody}>{h.body}</p>
                    {h.imageUrl && (
                      <div style={{ marginBottom: 8, borderRadius: 8, overflow: "hidden", border: "1px solid var(--input-border)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={h.imageUrl}
                          alt="Attachment"
                          style={{ width: "100%", maxHeight: 120, objectFit: "cover", display: "block" }}
                        />
                      </div>
                    )}
                    <div style={s.historyMeta}>
                      <span style={s.metaTag}>{h.segment}</span>
                      <span style={{ ...s.metaTag, color: "#22c55e" }}>
                        ✓ {h.sent} delivered
                      </span>
                      {h.failed > 0 && (
                        <span style={{ ...s.metaTag, color: "#ef4444" }}>
                          ✗ {h.failed} failed
                        </span>
                      )}
                      <div
                        style={{
                          marginLeft: "auto",
                          display: "inline-flex",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          className="hover-soft"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid var(--input-border)",
                            background: "transparent",
                            color: "var(--foreground)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: sending ? "default" : "pointer",
                            opacity: sending ? 0.55 : 1,
                          }}
                          onClick={() => void handleResend(h)}
                          disabled={sending}
                          title="Re-send this push to the same segment"
                        >
                          <RotateCw size={12} /> Resend
                        </button>
                        <button
                          type="button"
                          className="hover-soft"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: "1px solid rgba(239,68,68,0.4)",
                            background: "transparent",
                            color: "#FCA5A5",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onClick={() => void handleDelete(h.id)}
                          title="Remove from history"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 1180, display: "flex", flexDirection: "column", gap: 18 },

  header: { display: "flex", justifyContent: "space-between" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, letterSpacing: -0.4 },
  desc: { margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 580 },

  warningBanner: { display: "flex", gap: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", alignItems: "center" },

  row: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" },

  composeCard: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, overflow: "hidden" },
  historyCard: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, overflow: "hidden" },
  cardHead: { padding: "14px 18px", borderBottom: "1px solid var(--input-border)", background: "var(--surface-2)" },
  cardTitle: { margin: 0, fontSize: 14, fontWeight: 700 },
  cardBody: { padding: 18, display: "flex", flexDirection: "column", gap: 16 },

  input: { height: 42, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg, var(--surface-2))", color: "var(--foreground)", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  textarea: { padding: "10px 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg, var(--surface-2))", color: "var(--foreground)", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.55 },
  label: { fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  hint: { fontSize: 11, color: "var(--muted-foreground)" },

  imagePicker: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 10,
    border: "1px dashed var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  imagePreviewWrap: {
    position: "relative",
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid var(--input-border)",
  },
  imagePreview: {
    width: "100%",
    maxHeight: 200,
    objectFit: "cover" as const,
    display: "block",
  },
  imageRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 999,
    border: "none",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },

  segmentGrid: { display: "flex", flexDirection: "column", gap: 8 },
  segmentCard: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-2)", cursor: "pointer", textAlign: "left" },
  segmentCardActive: { background: "var(--brand-primary)", border: "1px solid var(--brand-primary)" },
  segmentIcon: { width: 32, height: 32, borderRadius: 8, background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  segmentLabel: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  segmentDesc: { margin: "2px 0 0", fontSize: 11, color: "var(--muted-foreground)" },

  previewSection: { display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid var(--input-border)" },
  previewLabel: { margin: 0, fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  phonePreview: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "12px 14px",
    borderRadius: 14,
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  previewAppIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    background: "#0A6A4B",
    display: "grid",
    placeItems: "center",
  },
  previewAppName: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted-foreground)",
    letterSpacing: 0.2,
    textTransform: "uppercase" as const,
  },
  previewDot: { fontSize: 11, color: "var(--muted-foreground)" },
  previewTime: { fontSize: 11, color: "var(--muted-foreground)" },
  previewTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  previewBody: {
    margin: "2px 0 0",
    fontSize: 13,
    color: "var(--foreground)",
    opacity: 0.85,
    lineHeight: 1.45,
  },
  previewImageWrap: {
    marginTop: 10,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid var(--input-border)",
  },
  previewImage: {
    width: "100%",
    aspectRatio: "16 / 9",
    objectFit: "cover" as const,
    display: "block",
  },

  sendBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#fff", fontSize: 14, fontWeight: 700, marginTop: 4 },

  historyList: { display: "flex", flexDirection: "column" },
  historyItem: { padding: "14px 18px", borderBottom: "1px solid var(--input-border)", display: "flex", flexDirection: "column", gap: 6 },
  historyTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  historyTitle: { fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  historyDate: { fontSize: 10, color: "var(--muted-foreground)" },
  historyBody: { margin: 0, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 },
  historyMeta: { display: "flex", flexWrap: "wrap", gap: 6 },
  metaTag: { fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "var(--surface-2)", border: "1px solid var(--input-border)", color: "var(--muted-foreground)", fontWeight: 600 },
};
