"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
} from "@/src/lib/platformSettingsDraftApi";

type NotifEvent = {
  id: string;
  name: string;
  description: string;
  preview: string;
  subject: string;
  body: string;
};

type TemplateOverride = { subject?: string; body?: string };
type TemplatesPayload = Record<string, TemplateOverride>;

// ⚠️ Event IDs MUST match the dispatcher's event names with `.` replaced by `_`
// (e.g. dispatcher event `user.registered` → template ID `user_registered`).
// Variables in {{curly}} are substituted by the dispatcher per event — see
// utils/notification-dispatcher.ts in the backend for the full list.

const DEFAULT_EVENTS: NotifEvent[] = [
  // ── User lifecycle ──────────────────────────────────────────────────────
  { id: "user_registered", name: "Welcome Email (User Signup)", description: "Sent when a new user signs up via the mobile app.", preview: "Welcome to SureRide, {{name}}!", subject: "Welcome to SureRide, {{name}}!", body: "Hi {{name}},\n\nThanks for signing up — welcome to SureRide.\n\nTo unlock booking you'll need to complete your KYC. You can browse vehicles in the meantime.\n\nIf you didn't sign up, please ignore this email." },
  { id: "password_reset", name: "Password Reset", description: "Sent when a user requests a password reset.", preview: "Reset your SureRide password.", subject: "Password Reset Request", body: "Hi {{name}},\n\nClick the link below to reset your password:\n\n{{link}}\n\nThis link expires in 30 minutes." },

  // ── KYC ────────────────────────────────────────────────────────────────
  { id: "kyc_submitted", name: "KYC Submitted", description: "Sent when a user submits KYC documents.", preview: "Your KYC documents have been received.", subject: "KYC Documents Received", body: "Hi {{name}},\n\nWe've received your KYC documents and they're being reviewed. You'll be notified once verified — usually within 24 hours." },
  { id: "kyc_approved", name: "KYC Approved", description: "Sent when KYC is successfully verified.", preview: "Your identity has been verified.", subject: "KYC Approved – Identity Verified", body: "Hi {{name}},\n\nYour identity verification has been approved.\n\nYou now have full access to the platform." },
  { id: "kyc_rejected", name: "KYC Rejected", description: "Sent when KYC documents are rejected.", preview: "Your KYC submission was rejected.", subject: "KYC Rejected – Action Required", body: "Hi {{name}},\n\nUnfortunately, your KYC documents were rejected.\n\nReason: {{reason}}\n\nPlease resubmit with the correct documents." },

  // ── Bookings ───────────────────────────────────────────────────────────
  { id: "booking_created", name: "Booking Created", description: "Sent the moment a booking is created (before payment).", preview: "Your booking #{{id}} has been created.", subject: "Booking Created – #{{id}}", body: "Hi {{name}},\n\nYour booking #{{id}} from {{start}} to {{end}} has been created. Complete payment to confirm it.\n\nThanks for choosing SureRide." },
  { id: "booking_confirmed", name: "Booking Confirmed", description: "Sent when a booking's payment succeeds OR the collection booking is confirmed.", preview: "Your booking #{{id}} is confirmed!", subject: "Booking Confirmed – #{{id}}", body: "Hi {{name}},\n\nYour booking #{{id}} for {{car}} from {{start}} to {{end}} has been confirmed.\n\nThank you for choosing SureRide!" },
  { id: "booking_cancelled", name: "Booking Cancelled", description: "Sent when a booking is cancelled by either party.", preview: "Your booking #{{id}} has been cancelled.", subject: "Booking Cancelled – #{{id}}", body: "Hi {{name}},\n\nYour booking #{{id}} has been cancelled.\n\nIf this was unexpected, please contact support." },
  { id: "booking_completed", name: "Booking Completed", description: "Sent when a rental is completed.", preview: "Trip completed — thanks!", subject: "Trip Completed – #{{id}}", body: "Hi {{name}},\n\nYour rental #{{id}} has been completed. Thanks for riding with SureRide — we'd love a quick review!" },

  // ── Payments ───────────────────────────────────────────────────────────
  { id: "payment_received", name: "Payment Received", description: "Sent when a payment is received successfully.", preview: "Payment received for #{{id}}.", subject: "Payment Received – #{{id}}", body: "Hi {{name}},\n\nWe've received your payment for booking #{{id}}. You're all set." },
  { id: "payment_failed", name: "Payment Failed", description: "Sent when a payment attempt fails or is declined.", preview: "Payment failed for #{{id}}.", subject: "Payment Failed – #{{id}}", body: "Hi {{name}},\n\nWe couldn't process your payment for booking #{{id}}.\n\nReason: {{reason}}\n\nPlease try a different card or contact your bank." },

  // ── Providers ──────────────────────────────────────────────────────────
  { id: "provider_registered", name: "Provider Registered", description: "Sent when a new provider signs up.", preview: "Welcome — your provider account is being reviewed.", subject: "Welcome to SureRide, {{name}}", body: "Hi {{name}},\n\nThanks for registering as a provider on SureRide. Our team will review your application shortly.\n\nYou can complete your business profile in the meantime." },
  { id: "provider_approved", name: "Provider Approved", description: "Sent to provider when their account is approved.", preview: "Your provider account is approved!", subject: "Your Provider Account is Approved", body: "Hi {{name}},\n\nYour provider account has been reviewed and approved.\n\nYou can now list vehicles and accept bookings." },
  { id: "provider_suspended", name: "Provider Suspended", description: "Sent to provider when their account is suspended.", preview: "Your provider account has been suspended.", subject: "Provider Account Suspended", body: "Hi {{name}},\n\nYour provider account has been suspended.\n\nReason: {{reason}}\n\nPlease contact support for assistance." },

  // ── Payouts ────────────────────────────────────────────────────────────
  { id: "payout_initiated", name: "Payout Initiated", description: "Sent when admin creates a payout for a provider.", preview: "A payout of ₦{{amount}} has been initiated.", subject: "Payout Initiated – ₦{{amount}}", body: "Hi {{name}},\n\nA payout of ₦{{amount}} has been initiated to your registered bank account. You'll receive it within 1–2 business days." },
  { id: "payout_completed", name: "Payout Completed", description: "Sent when a payout is marked paid.", preview: "Payout of ₦{{amount}} completed.", subject: "Payout Completed – ₦{{amount}}", body: "Hi {{name}},\n\nYour payout of ₦{{amount}} has been processed.\n\nReference: {{reference}}\n\nThanks for being part of SureRide." },
];

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 },
  header: { fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: 0 },
  headerDesc: { fontSize: 13, color: "var(--muted-foreground)", margin: "4px 0 0" },
  list: { display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--input-border)", borderRadius: 16, overflow: "hidden", background: "var(--surface-1)" },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid var(--input-border)",
    gap: 16,
  },
  rowLast: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    gap: 16,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 },
  rowDesc: { fontSize: 12, color: "var(--muted-foreground)", margin: "2px 0 0" },
  rowPreview: {
    fontSize: 12,
    color: "var(--fg-65)",
    fontStyle: "italic",
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  editBtn: {
    background: "var(--glass-06)",
    color: "var(--foreground)",
    border: "1px solid var(--input-border)",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  expandArea: {
    background: "var(--surface-2)",
    borderBottom: "1px solid var(--input-border)",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  expandTitle: { fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: 0 },
  input: {
    height: 44,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-1))",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  } as CSSProperties,
  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-1))",
    color: "var(--foreground)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 120,
    fontFamily: "inherit",
  } as CSSProperties,
  label: { fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 5 },
  saveBtn: {
    background: "var(--brand-primary)",
    color: "#fff",
    borderRadius: 10,
    padding: "9px 20px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
    alignSelf: "flex-start",
  },
  spinner: {
    width: 22, height: 22, borderRadius: "50%",
    border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },
};

export default function NotificationMessagesPage() {
  const [events, setEvents] = useState<NotifEvent[]>(DEFAULT_EVENTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPlatformSettingsDraft();
        const raw = res.items["notification-messages"] as TemplatesPayload | undefined;
        if (raw && typeof raw === "object") {
          setEvents((prev) =>
            prev.map((ev) => {
              const override = raw[ev.id];
              if (!override) return ev;
              return {
                ...ev,
                subject: typeof override.subject === "string" ? override.subject : ev.subject,
                body: typeof override.body === "string" ? override.body : ev.body,
              };
            }),
          );
        }
      } catch {
        // fall back to defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const update = (id: string, field: "subject" | "body", value: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const save = async (id: string) => {
    if (savingId) return;
    const target = events.find((e) => e.id === id);
    if (!target) return;
    try {
      setSavingId(id);
      // Load latest stored map (or empty), merge in this one
      const res = await listPlatformSettingsDraft();
      const current = (res.items["notification-messages"] as TemplatesPayload) ?? {};
      const next: TemplatesPayload = {
        ...current,
        [id]: { subject: target.subject, body: target.body },
      };
      await savePlatformSettingsDraft(
        "notification-messages",
        next as Record<string, unknown>,
      );
      toast.success(`Saved: ${target.name}`);
      setExpandedId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save template");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 40 }}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Loading notification templates…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div>
        <p style={s.header}>Notification Messages</p>
        <p style={s.headerDesc}>Edit templates for each notification event.</p>
      </div>

      <div style={s.list}>
        {events.map((ev, idx) => {
          const isLast = idx === events.length - 1;
          const isExpanded = expandedId === ev.id;
          const isSaving = savingId === ev.id;
          return (
            <div key={ev.id}>
              <div style={isLast && !isExpanded ? s.rowLast : s.row}>
                <div style={s.rowInfo}>
                  <p style={s.rowName}>{ev.name}</p>
                  <p style={s.rowDesc}>{ev.description}</p>
                </div>
                <span style={s.rowPreview}>{ev.preview}</span>
                <button style={s.editBtn} onClick={() => toggle(ev.id)}>
                  {isExpanded ? "Close" : "Edit"}
                </button>
              </div>
              {isExpanded && (
                <div style={{ ...s.expandArea, ...(isLast ? { borderBottom: "none" } : {}) }}>
                  <p style={s.expandTitle}>Edit: {ev.name}</p>
                  <div style={s.fieldWrap}>
                    <span style={s.label}>Subject</span>
                    <input
                      style={s.input}
                      value={ev.subject}
                      onChange={(e) => update(ev.id, "subject", e.target.value)}
                    />
                  </div>
                  <div style={s.fieldWrap}>
                    <span style={s.label}>Body</span>
                    <textarea
                      style={s.textarea}
                      value={ev.body}
                      onChange={(e) => update(ev.id, "body", e.target.value)}
                    />
                  </div>
                  <button
                    style={{
                      ...s.saveBtn,
                      opacity: isSaving ? 0.55 : 1,
                      cursor: isSaving ? "not-allowed" : "pointer",
                    }}
                    onClick={() => save(ev.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving…" : "Save Template"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
