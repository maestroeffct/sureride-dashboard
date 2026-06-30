"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import { Settings2, ChevronDown, ChevronUp, Send, ExternalLink, Info } from "lucide-react";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
  sendWebhookTest,
  sendPushTest,
  listAdminDeviceTokens,
  type AdminDeviceToken,
  type PlatformSettingsSection,
} from "@/src/lib/platformSettingsDraftApi";

// ── Channel definitions ─────────────────────────────────────────────────────

type ChannelDef = {
  id: ChannelId;
  name: string;
  description: string;
  icon: string;
  defaultActive: boolean;
  configSection?: PlatformSettingsSection;
};

type ChannelId = "email" | "sms" | "push" | "whatsapp" | "inapp" | "webhook";

const CHANNEL_DEFS: ChannelDef[] = [
  { id: "email", name: "Email", description: "Send transactional emails via SMTP or SendGrid.", icon: "✉", defaultActive: true },
  { id: "sms", name: "SMS", description: "Deliver text messages via Twilio or 2Factor.", icon: "💬", defaultActive: true },
  { id: "push", name: "Push Notifications", description: "Firebase Cloud Messaging for mobile devices.", icon: "🔔", defaultActive: false, configSection: "push-config" },
  { id: "whatsapp", name: "WhatsApp Business", description: "Automated WhatsApp messages via official API.", icon: "📱", defaultActive: false },
  { id: "inapp", name: "In-App Notifications", description: "Real-time alerts shown inside the apps.", icon: "🖥", defaultActive: true, configSection: "inapp-config" },
  { id: "webhook", name: "Webhook", description: "Send POST payloads to a configured endpoint.", icon: "⚡", defaultActive: false, configSection: "webhook-config" },
];

// ── Per-channel config shapes ───────────────────────────────────────────────

type WebhookConfig = {
  url: string;
  secret: string;
  events: string[];
};

type PushConfig = {
  serverKey: string;
  senderId: string;
  serviceAccountJson: string;
};

type InAppConfig = {
  retentionDays: number;
  autoMarkReadDays: number;
};

const EMPTY_WEBHOOK: WebhookConfig = { url: "", secret: "", events: [] };
const EMPTY_PUSH: PushConfig = { serverKey: "", senderId: "", serviceAccountJson: "" };
const DEFAULT_INAPP: InAppConfig = { retentionDays: 90, autoMarkReadDays: 30 };

const WEBHOOK_EVENT_OPTIONS = [
  "booking.created", "booking.confirmed", "booking.cancelled", "booking.completed",
  "provider.registered", "provider.approved", "provider.suspended",
  "user.registered", "kyc.submitted", "kyc.approved", "kyc.rejected",
  "payment.received", "payment.failed", "payout.initiated", "payout.completed",
];

// ── Main Component ──────────────────────────────────────────────────────────

type ChannelState = Record<string, boolean>;

function defaultsFromDefs(): ChannelState {
  return Object.fromEntries(CHANNEL_DEFS.map((c) => [c.id, c.defaultActive]));
}

export default function NotificationChannelsPage() {
  const [state, setState] = useState<ChannelState>(defaultsFromDefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expandedId, setExpandedId] = useState<ChannelId | null>(null);

  // Per-channel config
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(EMPTY_WEBHOOK);
  const [pushConfig, setPushConfig] = useState<PushConfig>(EMPTY_PUSH);
  const [inappConfig, setInAppConfig] = useState<InAppConfig>(DEFAULT_INAPP);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPlatformSettingsDraft();
        // Channels on/off
        const raw = res.items["notification-channels"] as Record<string, unknown> | undefined;
        if (raw && typeof raw === "object") {
          const merged: ChannelState = defaultsFromDefs();
          for (const id of Object.keys(merged)) {
            if (typeof raw[id] === "boolean") merged[id] = raw[id] as boolean;
          }
          setState(merged);
        }

        // Webhook config
        const wh = res.items["webhook-config"] as Partial<WebhookConfig> | undefined;
        if (wh) {
          setWebhookConfig({
            url: String(wh.url ?? ""),
            secret: String(wh.secret ?? ""),
            events: Array.isArray(wh.events) ? wh.events.map(String) : [],
          });
        }

        // Push config
        const push = res.items["push-config"] as Partial<PushConfig> | undefined;
        if (push) {
          setPushConfig({
            serverKey: String(push.serverKey ?? ""),
            senderId: String(push.senderId ?? ""),
            serviceAccountJson: String(push.serviceAccountJson ?? ""),
          });
        }

        // In-app config
        const inapp = res.items["inapp-config"] as Partial<InAppConfig> | undefined;
        if (inapp) {
          setInAppConfig({
            retentionDays: Number(inapp.retentionDays) || DEFAULT_INAPP.retentionDays,
            autoMarkReadDays: Number(inapp.autoMarkReadDays) || DEFAULT_INAPP.autoMarkReadDays,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: ChannelId) => {
    setState((prev) => ({ ...prev, [id]: !prev[id] }));
    setDirty(true);
  };

  const handleSaveChannels = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await savePlatformSettingsDraft("notification-channels", state);
      toast.success("Channel toggles saved");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save channel settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Loading channel settings…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <p style={s.title}>Notification Channels</p>
        <p style={s.desc}>
          Toggle channels on/off, then click <strong>Configure</strong> on each card to set credentials.
        </p>
      </div>

      <div style={s.list}>
        {CHANNEL_DEFS.map((ch) => {
          const active = state[ch.id] ?? ch.defaultActive;
          const isExpanded = expandedId === ch.id;
          const canConfigure = Boolean(ch.configSection);
          return (
            <div key={ch.id} style={s.cardWrap}>
              <div style={s.card}>
                <div style={s.iconArea}>{ch.icon}</div>
                <div style={s.info}>
                  <p style={s.channelName}>{ch.name}</p>
                  <p style={s.channelDesc}>{ch.description}</p>
                </div>
                <div style={s.cardRight}>
                  <span style={{ ...s.badgeBase, ...(active ? s.badgeActive : s.badgeInactive) }}>
                    <span style={{ ...s.dotBase, ...(active ? s.dotActive : s.dotInactive) }} />
                    {active ? "Active" : "Inactive"}
                  </span>

                  {canConfigure && (
                    <button
                      style={s.configBtn}
                      onClick={() => setExpandedId(isExpanded ? null : ch.id)}
                    >
                      <Settings2 size={13} />
                      Configure
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}

                  <Toggle on={active} onToggle={() => toggle(ch.id)} />
                </div>
              </div>

              {isExpanded && ch.id === "webhook" && (
                <WebhookConfigPanel
                  config={webhookConfig}
                  setConfig={setWebhookConfig}
                />
              )}
              {isExpanded && ch.id === "push" && (
                <PushConfigPanel config={pushConfig} setConfig={setPushConfig} />
              )}
              {isExpanded && ch.id === "inapp" && (
                <InAppConfigPanel config={inappConfig} setConfig={setInAppConfig} />
              )}
            </div>
          );
        })}
      </div>

      <button
        style={{
          ...s.saveBtn,
          opacity: saving || !dirty ? 0.55 : 1,
          cursor: saving || !dirty ? "not-allowed" : "pointer",
        }}
        onClick={handleSaveChannels}
        disabled={saving || !dirty}
      >
        {saving ? "Saving…" : dirty ? "Save Channel Toggles" : "Toggles Saved"}
      </button>
    </div>
  );
}

// ── Webhook config panel ────────────────────────────────────────────────────

function WebhookConfigPanel({
  config,
  setConfig,
}: {
  config: WebhookConfig;
  setConfig: (c: WebhookConfig) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const toggleEvent = (event: string) => {
    setConfig({
      ...config,
      events: config.events.includes(event)
        ? config.events.filter((e) => e !== event)
        : [...config.events, event],
    });
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await savePlatformSettingsDraft("webhook-config", {
        url: config.url.trim(),
        secret: config.secret.trim(),
        events: config.events,
      });
      toast.success("Webhook configuration saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save webhook config");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (testing) return;
    if (!config.url.trim()) {
      toast.error("Enter a webhook URL first");
      return;
    }
    try {
      setTesting(true);
      const result = await sendWebhookTest({
        url: config.url.trim(),
        secret: config.secret.trim() || undefined,
      });
      if (result.delivered) {
        toast.success(`Webhook delivered (HTTP ${result.status})`);
      } else {
        toast.error(`Endpoint responded with HTTP ${result.status} ${result.statusText}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Webhook test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={s.configPanel}>
      <p style={s.configTitle}>Webhook Configuration</p>

      <Field label="Webhook URL *">
        <input
          style={s.input}
          value={config.url}
          onChange={(e) => setConfig({ ...config, url: e.target.value })}
          placeholder="https://example.com/sureride-webhook"
        />
      </Field>

      <Field label="Signing Secret (HMAC-SHA256)">
        <input
          style={s.input}
          value={config.secret}
          onChange={(e) => setConfig({ ...config, secret: e.target.value })}
          placeholder="A long random string"
        />
        <span style={s.fieldHint}>
          We sign every payload with this secret and send the result in the{" "}
          <code style={s.code}>X-SureRide-Signature</code> header. Use it to verify the
          request on your end.
        </span>
      </Field>

      <Field label="Subscribed Events">
        <div style={s.eventChips}>
          {WEBHOOK_EVENT_OPTIONS.map((evt) => {
            const on = config.events.includes(evt);
            return (
              <button
                key={evt}
                type="button"
                style={{ ...s.chip, ...(on ? s.chipActive : s.chipInactive) }}
                onClick={() => toggleEvent(evt)}
              >
                {evt}
              </button>
            );
          })}
        </div>
        <span style={s.fieldHint}>
          {config.events.length === 0
            ? "No events selected — webhook will not fire."
            : `${config.events.length} event${config.events.length === 1 ? "" : "s"} selected.`}
        </span>
      </Field>

      <div style={s.actionRow}>
        <button
          style={{ ...s.testBtn, opacity: testing ? 0.5 : 1 }}
          onClick={handleTest}
          disabled={testing}
        >
          <Send size={13} />
          {testing ? "Sending…" : "Send Test Payload"}
        </button>
        <button
          style={{ ...s.smallSaveBtn, opacity: saving ? 0.5 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Webhook Config"}
        </button>
      </div>
    </div>
  );
}

// ── Push config panel ───────────────────────────────────────────────────────

function PushConfigPanel({
  config,
  setConfig,
}: {
  config: PushConfig;
  setConfig: (c: PushConfig) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testToken, setTestToken] = useState("");
  const [devices, setDevices] = useState<AdminDeviceToken[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  // Hydrate the device picker on mount. Soft-fail: if the call dies the
  // admin can still paste a token manually.
  useEffect(() => {
    let mounted = true;
    setDevicesLoading(true);
    listAdminDeviceTokens()
      .then((res) => {
        if (!mounted) return;
        setDevices(res.items);
      })
      .catch(() => {
        if (!mounted) return;
        // Soft-fail — paste-mode still works.
      })
      .finally(() => {
        if (mounted) setDevicesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await savePlatformSettingsDraft("push-config", {
        serverKey: config.serverKey.trim(),
        senderId: config.senderId.trim(),
        serviceAccountJson: config.serviceAccountJson.trim(),
      });
      toast.success("Push configuration saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save push config");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (testing) return;
    const hasV1 = !!config.serviceAccountJson.trim();
    const hasLegacy = !!config.serverKey.trim();
    if (!hasV1 && !hasLegacy) {
      toast.error("Paste either Service Account JSON (recommended) or a legacy Server Key");
      return;
    }
    if (!testToken.trim()) {
      toast.error("Enter a device token to test");
      return;
    }
    try {
      setTesting(true);
      const result = await sendPushTest({
        // Backend prefers v1 when both are present
        serviceAccountJson: hasV1 ? config.serviceAccountJson.trim() : "",
        serverKey: hasLegacy ? config.serverKey.trim() : "",
        deviceToken: testToken.trim(),
      });
      if (result.delivered) {
        toast.success("Test push sent — check the device");
      } else {
        toast.error(`FCM responded with HTTP ${result.status}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Push test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={s.configPanel}>
      <p style={s.configTitle}>Firebase Cloud Messaging</p>

      <div style={s.infoBox}>
        <Info size={13} />
        <span>
          <strong>Use Service Account JSON</strong> (HTTP v1, required for projects
          created after June 2024). Download it from <strong>Firebase Console → Project
          Settings → Service Accounts → Generate New Private Key</strong>.
          Legacy Server Key still works if your project has it.
        </span>
      </div>

      <Field label="Service Account JSON (recommended)">
        <textarea
          style={s.textarea}
          rows={6}
          value={config.serviceAccountJson}
          onChange={(e) => setConfig({ ...config, serviceAccountJson: e.target.value })}
          placeholder={`{\n  "type": "service_account",\n  "project_id": "your-project",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",\n  "client_email": "...iam.gserviceaccount.com",\n  ...\n}`}
        />
      </Field>

      <div style={s.grid2}>
        <Field label="Legacy Server Key (only if your project has it)">
          <input
            style={s.input}
            type="password"
            value={config.serverKey}
            onChange={(e) => setConfig({ ...config, serverKey: e.target.value })}
            placeholder="Leave blank if using Service Account JSON"
          />
        </Field>
        <Field label="Sender ID (display only)">
          <input
            style={s.input}
            value={config.senderId}
            onChange={(e) => setConfig({ ...config, senderId: e.target.value })}
            placeholder="e.g. 123456789012"
          />
        </Field>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          Pick a registered device {devices.length > 0 ? `(${devices.length})` : ""}
        </span>
        <select
          style={s.input}
          value={testToken}
          onChange={(e) => setTestToken(e.target.value)}
          disabled={devicesLoading || devices.length === 0}
        >
          <option value="">
            {devicesLoading
              ? "Loading devices…"
              : devices.length === 0
                ? "No registered devices yet — paste a token below"
                : "Select a device…"}
          </option>
          {devices.map((d) => (
            <option key={d.id} value={d.token}>
              {d.ownerName} · {d.platform} · {d.tokenPreview} · last seen{" "}
              {new Date(d.lastSeenAt).toLocaleDateString()}
            </option>
          ))}
        </select>

        <span
          style={{
            fontSize: 11,
            color: "var(--muted-foreground)",
            textAlign: "center",
            opacity: 0.75,
          }}
        >
          — or paste a raw token —
        </span>

        <div style={s.testRow}>
          <input
            style={{ ...s.input, flex: 1 }}
            value={testToken}
            onChange={(e) => setTestToken(e.target.value)}
            placeholder="Paste a device FCM token to test"
          />
          <button
            style={{ ...s.testBtn, opacity: testing ? 0.5 : 1 }}
            onClick={handleTest}
            disabled={testing}
          >
            <Send size={13} />
            {testing ? "Sending…" : "Send Test Push"}
          </button>
        </div>
      </div>

      <div style={s.actionRow}>
        <a
          href="https://console.firebase.google.com"
          target="_blank"
          rel="noopener noreferrer"
          style={s.externalLink}
        >
          Open Firebase Console <ExternalLink size={11} />
        </a>
        <button
          style={{ ...s.smallSaveBtn, opacity: saving ? 0.5 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Push Config"}
        </button>
      </div>
    </div>
  );
}

// ── In-app config panel ────────────────────────────────────────────────────

function InAppConfigPanel({
  config,
  setConfig,
}: {
  config: InAppConfig;
  setConfig: (c: InAppConfig) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await savePlatformSettingsDraft("inapp-config", {
        retentionDays: Number(config.retentionDays) || DEFAULT_INAPP.retentionDays,
        autoMarkReadDays:
          Number(config.autoMarkReadDays) || DEFAULT_INAPP.autoMarkReadDays,
      });
      toast.success("In-app configuration saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save in-app config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.configPanel}>
      <p style={s.configTitle}>In-App Notification Behavior</p>

      <div style={s.infoBox}>
        <Info size={13} />
        <span>
          Notifications are persisted in the database. Settings below control how long
          they live and when they auto-fade from the user&apos;s inbox.
        </span>
      </div>

      <div style={s.grid2}>
        <Field label="Retention (days)">
          <input
            style={s.input}
            type="number"
            min={1}
            max={365}
            value={config.retentionDays}
            onChange={(e) => setConfig({ ...config, retentionDays: Number(e.target.value) || 0 })}
          />
          <span style={s.fieldHint}>Hard delete read notifications after this many days.</span>
        </Field>
        <Field label="Auto-mark-read after (days)">
          <input
            style={s.input}
            type="number"
            min={1}
            max={config.retentionDays || 365}
            value={config.autoMarkReadDays}
            onChange={(e) =>
              setConfig({ ...config, autoMarkReadDays: Number(e.target.value) || 0 })
            }
          />
          <span style={s.fieldHint}>
            Mark unread notifications as read after this many days (keeps the badge clean).
          </span>
        </Field>
      </div>

      <div style={s.actionRow}>
        <span style={s.previewMeta}>
          Retention: {config.retentionDays}d · Auto-read: {config.autoMarkReadDays}d
        </span>
        <button
          style={{ ...s.smallSaveBtn, opacity: saving ? 0.5 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save In-App Config"}
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: on ? "var(--brand-primary)" : "var(--glass-08)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 900, display: "flex", flexDirection: "column", gap: 18 },
  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: {
    width: 22, height: 22, borderRadius: "50%",
    border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },

  header: { display: "flex", flexDirection: "column", gap: 4 },
  title: { fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: 0 },
  desc: { fontSize: 13, color: "var(--muted-foreground)", margin: 0 },

  list: { display: "flex", flexDirection: "column", gap: 10 },

  cardWrap: {
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    overflow: "hidden",
    background: "var(--surface-1)",
  },

  card: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 18px",
  },
  iconArea: {
    width: 40, height: 40, borderRadius: 10,
    background: "var(--glass-08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  channelName: { margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  channelDesc: { margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" },

  cardRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },

  badgeBase: {
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    display: "flex", alignItems: "center", gap: 5,
  },
  badgeActive: { background: "rgba(34,197,94,0.12)", color: "#22c55e" },
  badgeInactive: { background: "var(--glass-06)", color: "var(--muted-foreground)" },
  dotBase: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  dotActive: { background: "#22c55e" },
  dotInactive: { background: "var(--muted-foreground)" },

  configBtn: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 10px", borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    cursor: "pointer", fontSize: 11.5, fontWeight: 600,
  },

  // Config panel
  configPanel: {
    padding: "18px 20px",
    background: "var(--surface-2)",
    borderTop: "1px solid var(--input-border)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  configTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--foreground)" },

  infoBox: {
    display: "flex", alignItems: "flex-start", gap: 8,
    padding: "10px 12px",
    background: "color-mix(in srgb, var(--brand-primary) 6%, transparent)",
    border: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)",
    borderRadius: 8,
    fontSize: 12, color: "var(--foreground)", lineHeight: 1.55,
  },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },

  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  fieldHint: { fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5 },
  code: {
    fontFamily: "monospace", fontSize: 11,
    padding: "1px 5px", borderRadius: 4,
    background: "var(--surface-1)", border: "1px solid var(--input-border)",
  },
  input: {
    height: 40, padding: "0 12px", borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-1))",
    color: "var(--foreground)", fontSize: 13,
    outline: "none", width: "100%", boxSizing: "border-box",
  },
  textarea: {
    padding: "10px 12px", borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-1))",
    color: "var(--foreground)", fontSize: 12,
    outline: "none", width: "100%", boxSizing: "border-box",
    resize: "vertical", fontFamily: "monospace", lineHeight: 1.55,
  },

  // Event chips
  eventChips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: {
    padding: "5px 11px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
    cursor: "pointer", transition: "all 0.15s", fontFamily: "monospace",
  },
  chipActive: {
    background: "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
    color: "var(--brand-primary)",
    border: "1px solid color-mix(in srgb, var(--brand-primary) 40%, transparent)",
  },
  chipInactive: {
    background: "var(--surface-1)",
    color: "var(--muted-foreground)",
    border: "1px solid var(--input-border)",
  },

  // Test
  testRow: { display: "flex", gap: 8 },

  // Action row
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 4 },
  testBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    cursor: "pointer", fontSize: 12, fontWeight: 600,
    flexShrink: 0,
  },
  smallSaveBtn: {
    padding: "8px 18px", borderRadius: 10,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    cursor: "pointer", fontSize: 12, fontWeight: 700,
  },
  externalLink: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "var(--brand-primary)",
    textDecoration: "none",
  },
  previewMeta: { fontSize: 11.5, color: "var(--muted-foreground)" },

  // Main save button
  saveBtn: {
    background: "var(--brand-primary)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 22px",
    border: "none",
    fontWeight: 700,
    fontSize: 14,
    alignSelf: "flex-start",
  },
};
