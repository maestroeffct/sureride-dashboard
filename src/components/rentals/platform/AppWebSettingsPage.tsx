"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import {
  Smartphone,
  Apple,
  Bot,
  Save,
  AlertTriangle,
  Info,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
} from "@/src/lib/platformSettingsDraftApi";

// ── Types matching the backend payload ───────────────────────────────────────

type PlatformPolicy = {
  latestVersionName: string;
  latestBuildCode: string; // string in form, sent as number
  minSupportedBuildCode: string;
  storeUrl: string;
};

type AppPolicy = {
  android: PlatformPolicy;
  ios: PlatformPolicy;
  forceUpdate: boolean;
  title: string;
  message: string;
};

type AppType = "customer" | "provider";

type Enforcement = Record<AppType, AppPolicy>;

const EMPTY_PLATFORM: PlatformPolicy = {
  latestVersionName: "",
  latestBuildCode: "",
  minSupportedBuildCode: "",
  storeUrl: "",
};

const EMPTY_APP: AppPolicy = {
  android: { ...EMPTY_PLATFORM },
  ios: { ...EMPTY_PLATFORM },
  forceUpdate: false,
  title: "Update Required",
  message: "A newer version of the app is available. Please update to continue.",
};

const INITIAL: Enforcement = {
  customer: { ...EMPTY_APP, android: { ...EMPTY_PLATFORM }, ios: { ...EMPTY_PLATFORM } },
  provider: { ...EMPTY_APP, android: { ...EMPTY_PLATFORM }, ios: { ...EMPTY_PLATFORM } },
};

const APP_TABS: { key: AppType; label: string; description: string }[] = [
  { key: "customer", label: "Customer App", description: "Rider-facing mobile app" },
  { key: "provider", label: "Provider App", description: "Provider-facing mobile app" },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function AppWebSettingsPage() {
  const [activeApp, setActiveApp] = useState<AppType>("customer");
  const [state, setState] = useState<Enforcement>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPlatformSettingsDraft();
        const raw = res.items["app-update-enforcement"] as Partial<Enforcement> | undefined;
        if (raw) {
          setState({
            customer: mergePolicy(raw.customer),
            provider: mergePolicy(raw.provider),
          });
        }
      } catch {
        // Fall back to defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = state[activeApp];

  const updateApp = (patch: Partial<AppPolicy>) => {
    setState((prev) => ({ ...prev, [activeApp]: { ...prev[activeApp], ...patch } }));
  };

  const updatePlatform = (
    platform: "android" | "ios",
    patch: Partial<PlatformPolicy>,
  ) => {
    setState((prev) => ({
      ...prev,
      [activeApp]: {
        ...prev[activeApp],
        [platform]: { ...prev[activeApp][platform], ...patch },
      },
    }));
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      // Coerce build codes to numbers before sending
      const payload = {
        customer: serializeAppPolicy(state.customer),
        provider: serializeAppPolicy(state.provider),
      };
      await savePlatformSettingsDraft("app-update-enforcement", payload);
      toast.success("Update enforcement settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Loading update enforcement settings…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Explanation card */}
      <div style={s.explainCard}>
        <Info size={18} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={s.explainTitle}>What this controls</p>
          <p style={s.explainText}>
            When users open the SureRide mobile app, it calls{" "}
            <code style={s.code}>GET /platform/app-update-policy</code> on splash. If the
            user&apos;s installed build is older than{" "}
            <strong>Minimum Supported Build</strong>, the app blocks startup and routes
            them to the store URL you set here.
          </p>
          <p style={{ ...s.explainText, marginTop: 8 }}>
            <strong>Use integer build codes</strong> (Android <code style={s.code}>versionCode</code>,
            iOS <code style={s.code}>CFBundleVersion</code>) for enforcement — never the
            display version like &quot;1.10&quot;, which is ambiguous.
          </p>
        </div>
      </div>

      {/* App tabs */}
      <div style={s.tabsWrap}>
        {APP_TABS.map((tab) => (
          <button
            key={tab.key}
            style={{ ...s.tab, ...(activeApp === tab.key ? s.tabActive : {}) }}
            onClick={() => setActiveApp(tab.key)}
          >
            <Smartphone size={14} />
            <div style={{ textAlign: "left" }}>
              <span style={s.tabLabel}>{tab.label}</span>
              <span style={s.tabSub}>{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Android section */}
      <PlatformSection
        title="Android"
        icon={<Bot size={18} />}
        policy={current.android}
        onChange={(patch) => updatePlatform("android", patch)}
        storeHint="https://play.google.com/store/apps/details?id=..."
        buildCodeHint="versionCode from build.gradle (an integer)"
      />

      {/* iOS section */}
      <PlatformSection
        title="iOS"
        icon={<Apple size={18} />}
        policy={current.ios}
        onChange={(patch) => updatePlatform("ios", patch)}
        storeHint="https://apps.apple.com/app/id..."
        buildCodeHint="CFBundleVersion from Info.plist (an integer)"
      />

      {/* Enforcement options */}
      <div style={s.card}>
        <div style={s.cardHead}>
          <h3 style={s.cardTitle}>Enforcement & Message</h3>
          <p style={s.cardDesc}>How the user is told they must update.</p>
        </div>

        <div style={s.cardBody}>
          <ToggleRow
            label="Hard force update"
            desc="When ON: users below the minimum build are blocked completely. When OFF: they only see a soft prompt and can dismiss it."
            on={current.forceUpdate}
            onToggle={() => updateApp({ forceUpdate: !current.forceUpdate })}
          />

          {current.forceUpdate && (
            <div style={s.warningBox}>
              <AlertTriangle size={14} />
              <span>
                Hard mode blocks startup entirely. Make sure your store URLs are valid
                and the new build is live before enabling.
              </span>
            </div>
          )}

          <Field label="Update Screen Title">
            <input
              style={s.input}
              value={current.title}
              onChange={(e) => updateApp({ title: e.target.value })}
              placeholder="Update Required"
            />
          </Field>

          <Field label="Update Screen Message">
            <textarea
              style={s.textarea}
              rows={3}
              value={current.message}
              onChange={(e) => updateApp({ message: e.target.value })}
              placeholder="A newer version of the app is available. Please update to continue."
            />
          </Field>
        </div>
      </div>

      {/* Policy preview */}
      <div style={s.previewCard}>
        <div style={s.previewHead}>
          <span style={s.previewLabel}>API Response Preview</span>
          <span style={s.previewBadge}>GET /platform/app-update-policy?app={activeApp}&amp;platform=android</span>
        </div>
        <pre style={s.previewBody}>{JSON.stringify(buildPolicyPreview(activeApp, "android", current), null, 2)}</pre>
      </div>

      {/* Save bar */}
      <div style={s.saveBar}>
        <button
          style={{ ...s.saveBtn, opacity: saving ? 0.5 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <span>Saving…</span> : <><Save size={14} /> Save All Settings</>}
        </button>
      </div>
    </div>
  );
}

// ── Platform section card ────────────────────────────────────────────────────

function PlatformSection({
  title,
  icon,
  policy,
  onChange,
  storeHint,
  buildCodeHint,
}: {
  title: string;
  icon: React.ReactNode;
  policy: PlatformPolicy;
  onChange: (patch: Partial<PlatformPolicy>) => void;
  storeHint: string;
  buildCodeHint: string;
}) {
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <div style={s.cardHeadRow}>
          <div style={s.iconBox}>{icon}</div>
          <div>
            <h3 style={s.cardTitle}>{title}</h3>
            <p style={s.cardDesc}>Build codes and store URL for {title}.</p>
          </div>
        </div>
      </div>

      <div style={s.cardBody}>
        <div style={s.grid2}>
          <Field label="Latest Version Name (display)">
            <input
              style={s.input}
              value={policy.latestVersionName}
              onChange={(e) => onChange({ latestVersionName: e.target.value })}
              placeholder="e.g. 1.4.2"
            />
            <span style={s.fieldHint}>Shown to users — not used for enforcement.</span>
          </Field>

          <Field label="Latest Build Code">
            <input
              style={s.input}
              type="number"
              min={0}
              value={policy.latestBuildCode}
              onChange={(e) => onChange({ latestBuildCode: e.target.value })}
              placeholder="e.g. 142"
            />
            <span style={s.fieldHint}>Current latest build released.</span>
          </Field>
        </div>

        <Field label="Minimum Supported Build Code *">
          <input
            style={s.input}
            type="number"
            min={0}
            value={policy.minSupportedBuildCode}
            onChange={(e) => onChange({ minSupportedBuildCode: e.target.value })}
            placeholder="e.g. 130"
          />
          <span style={s.fieldHint}>{buildCodeHint} — anything below this is forced to update.</span>
        </Field>

        <Field label="Store URL *">
          <div style={s.inputWithAction}>
            <input
              style={{ ...s.input, paddingRight: 44 }}
              value={policy.storeUrl}
              onChange={(e) => onChange({ storeUrl: e.target.value })}
              placeholder={storeHint}
            />
            {policy.storeUrl && (
              <a
                href={policy.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={s.openLink}
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </Field>

        {/* Inline validation */}
        <div style={s.validationRow}>
          <ValidIndicator ok={isValidUrl(policy.storeUrl)} label="Store URL is valid" />
          <ValidIndicator ok={Number(policy.minSupportedBuildCode) > 0} label="Min build is set" />
          <ValidIndicator
            ok={
              Number(policy.latestBuildCode) >= Number(policy.minSupportedBuildCode || 0)
            }
            label="Latest ≥ Min"
          />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mergePolicy(raw: Partial<AppPolicy> | undefined): AppPolicy {
  if (!raw) return { ...EMPTY_APP, android: { ...EMPTY_PLATFORM }, ios: { ...EMPTY_PLATFORM } };
  return {
    android: mergePlatform(raw.android),
    ios: mergePlatform(raw.ios),
    forceUpdate: Boolean(raw.forceUpdate),
    title: String(raw.title ?? EMPTY_APP.title),
    message: String(raw.message ?? EMPTY_APP.message),
  };
}

function mergePlatform(raw: Partial<PlatformPolicy> | undefined): PlatformPolicy {
  if (!raw) return { ...EMPTY_PLATFORM };
  return {
    latestVersionName: String(raw.latestVersionName ?? ""),
    latestBuildCode: raw.latestBuildCode != null ? String(raw.latestBuildCode) : "",
    minSupportedBuildCode:
      raw.minSupportedBuildCode != null ? String(raw.minSupportedBuildCode) : "",
    storeUrl: String(raw.storeUrl ?? ""),
  };
}

function serializeAppPolicy(p: AppPolicy) {
  return {
    android: serializePlatform(p.android),
    ios: serializePlatform(p.ios),
    forceUpdate: p.forceUpdate,
    title: p.title.trim() || "Update Required",
    message: p.message.trim() || "A newer version of the app is available. Please update to continue.",
  };
}

function serializePlatform(p: PlatformPolicy) {
  return {
    latestVersionName: p.latestVersionName.trim(),
    latestBuildCode: Number(p.latestBuildCode) || 0,
    minSupportedBuildCode: Number(p.minSupportedBuildCode) || 0,
    storeUrl: p.storeUrl.trim(),
  };
}

function isValidUrl(url: string) {
  if (!url.trim()) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function buildPolicyPreview(app: AppType, platform: "android" | "ios", policy: AppPolicy) {
  const p = policy[platform];
  return {
    app,
    platform,
    latest_version_name: p.latestVersionName,
    latest_build_code: Number(p.latestBuildCode) || 0,
    min_supported_build_code: Number(p.minSupportedBuildCode) || 0,
    force_update: policy.forceUpdate,
    store_url: p.storeUrl,
    title: policy.title,
    message: policy.message,
  };
}

// ── Sub components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({
  label, desc, on, onToggle,
}: { label: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={s.toggleRow}>
      <div style={{ flex: 1 }}>
        <p style={s.toggleLabel}>{label}</p>
        <p style={s.toggleDesc}>{desc}</p>
      </div>
      <div
        onClick={onToggle}
        style={{ ...s.toggleTrack, background: on ? "var(--brand-primary)" : "var(--glass-08)" }}
      >
        <div style={{ ...s.toggleKnob, left: on ? 22 : 3 }} />
      </div>
    </div>
  );
}

function ValidIndicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ ...s.validItem, color: ok ? "#22c55e" : "var(--muted-foreground)" }}>
      <span
        style={{
          ...s.validDot,
          background: ok ? "#22c55e" : "var(--input-border)",
        }}
      >
        {ok && <Check size={9} strokeWidth={3} color="#fff" />}
      </span>
      {label}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 980, display: "flex", flexDirection: "column", gap: 18 },

  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: {
    width: 24, height: 24, borderRadius: "50%",
    border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },

  // Explain card
  explainCard: {
    display: "flex",
    gap: 14,
    padding: "16px 18px",
    borderRadius: 14,
    background: "color-mix(in srgb, var(--brand-primary) 6%, transparent)",
    border: "1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)",
  },
  explainTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  explainText: { margin: "4px 0 0", fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.6 },
  code: {
    background: "var(--surface-2)",
    padding: "1px 6px",
    borderRadius: 4,
    fontSize: 11.5,
    fontFamily: "monospace",
    color: "var(--foreground)",
    border: "1px solid var(--input-border)",
  },

  // Tabs
  tabsWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    cursor: "pointer",
    color: "var(--muted-foreground)",
    textAlign: "left",
    transition: "all 0.15s",
  },
  tabActive: {
    border: "1px solid var(--brand-primary)",
    background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
    color: "var(--brand-primary)",
  },
  tabLabel: { display: "block", fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  tabSub: { display: "block", fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 },

  // Card
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    overflow: "hidden",
  },
  cardHead: {
    padding: "16px 20px",
    background: "var(--surface-2)",
    borderBottom: "1px solid var(--input-border)",
  },
  cardHeadRow: { display: "flex", alignItems: "center", gap: 12 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
    color: "var(--brand-primary)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  cardDesc: { margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" },
  cardBody: { padding: 20, display: "flex", flexDirection: "column", gap: 16 },

  // Field
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  fieldHint: { fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5 },
  input: {
    height: 42,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-2))",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-2))",
    color: "var(--foreground)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.55,
  },
  inputWithAction: { position: "relative" },
  openLink: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--brand-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
  },

  // Validation row
  validationRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    paddingTop: 8,
    borderTop: "1px solid var(--input-border)",
  },
  validItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12 },
  validDot: {
    width: 14, height: 14, borderRadius: "50%",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s",
  },

  // Toggle
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 14px",
    borderRadius: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
  },
  toggleLabel: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  toggleDesc: { margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 },
  toggleTrack: {
    width: 44, height: 24, borderRadius: 999,
    position: "relative", cursor: "pointer", flexShrink: 0,
    transition: "background 0.2s",
  },
  toggleKnob: {
    position: "absolute", top: 3,
    width: 18, height: 18, borderRadius: "50%",
    background: "#fff",
    transition: "left 0.2s",
  },

  // Warning
  warningBox: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.3)",
    color: "#fcd34d",
    fontSize: 12.5,
    lineHeight: 1.5,
  },

  // Preview
  previewCard: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    overflow: "hidden",
  },
  previewHead: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  previewLabel: { fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  previewBadge: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "var(--brand-primary)",
    background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)",
  },
  previewBody: {
    margin: 0,
    padding: 16,
    fontSize: 12,
    fontFamily: "monospace",
    color: "var(--foreground)",
    lineHeight: 1.6,
    overflowX: "auto",
  },

  // Save bar
  saveBar: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 4,
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 22px",
    borderRadius: 10,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
  },
};
