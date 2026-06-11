"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getProviderProfile,
  updateProviderProfile,
  type ProviderProfile,
} from "@/src/lib/providerApi";
import { useCountryDialCodes } from "@/src/hooks/useCountryDialCodes";
import Image from "next/image";
import logoIcon from "@/src/assets/logo_icon.png";

// ── Required fields for a "complete" profile ─────────────────────────────────
function isComplete(f: ProfileForm): boolean {
  return !!(
    f.phone.trim() &&
    f.contactPersonName.trim() &&
    f.businessAddress.trim()
  );
}

type ProfileForm = {
  phone: string;
  contactPersonName: string;
  contactPersonRole: string;
  contactPersonPhone: string;
  businessAddress: string;
  dialCode: string;
};

const EMPTY: ProfileForm = {
  phone: "",
  contactPersonName: "",
  contactPersonRole: "",
  contactPersonPhone: "",
  businessAddress: "",
  dialCode: "+1",
};

// ── Progress steps indicator ──────────────────────────────────────────────────
const FIELDS: { key: keyof ProfileForm; label: string; required?: boolean }[] = [
  { key: "phone", label: "Business phone", required: true },
  { key: "contactPersonName", label: "Primary contact name", required: true },
  { key: "businessAddress", label: "Business address", required: true },
];

export default function CompleteProviderProfilePage() {
  const router = useRouter();
  const { countries } = useCountryDialCodes();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [form, setForm] = useState<ProfileForm>(EMPTY);

  useEffect(() => {
    getProviderProfile()
      .then((p: ProviderProfile) => {
        setProviderName(p.name ?? "");
        setForm({
          phone: p.phone ?? "",
          contactPersonName: p.contactPersonName ?? "",
          contactPersonRole: p.contactPersonRole ?? "",
          contactPersonPhone: p.contactPersonPhone ?? "",
          businessAddress: p.businessAddress ?? "",
          dialCode: "+1",
        });
      })
      .catch(() => {
        /* ignore — still show form */
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof ProfileForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!isComplete(form)) {
      toast.error("Please fill in all required fields");
      return;
    }

    const rawPhone = form.phone.trim();
    const fullPhone = rawPhone.startsWith("+") ? rawPhone : `${form.dialCode}${rawPhone}`;

    try {
      setSaving(true);
      await updateProviderProfile({
        phone: fullPhone,
        contactPersonName: form.contactPersonName.trim(),
        contactPersonRole: form.contactPersonRole.trim() || undefined,
        contactPersonPhone: form.contactPersonPhone.trim() || fullPhone,
        businessAddress: form.businessAddress.trim(),
      });
      toast.success("Profile completed! Welcome to your dashboard.");
      router.replace("/provider");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Count how many required fields are done
  const filledCount = FIELDS.filter(
    (f) => f.required && (form[f.key] as string).trim().length > 0,
  ).length;
  const requiredCount = FIELDS.filter((f) => f.required).length;
  const progressPct = (filledCount / requiredCount) * 100;

  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.panel}>
        <div style={s.panelInner}>
          <div style={s.logoRow}>
            <Image src={logoIcon} alt="Sureride" priority style={s.logo} />
            <span style={s.logoLabel}>Sureride</span>
          </div>

          <div style={s.panelText}>
            <span style={s.stepLabel}>Profile setup</span>
            <h1 style={s.panelTitle}>
              Almost there,<br />
              {providerName || "Provider"}
            </h1>
            <p style={s.panelSub}>
              Complete your profile to unlock your provider dashboard. This
              information helps riders and admins verify your business.
            </p>
          </div>

          {/* Progress */}
          <div style={s.progressSection}>
            <div style={s.progressHeader}>
              <span style={s.progressLabel}>Profile completion</span>
              <span style={s.progressPct}>{Math.round(progressPct)}%</span>
            </div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
            </div>
            <div style={s.fieldChecklist}>
              {FIELDS.filter((f) => f.required).map((f) => {
                const done = (form[f.key] as string).trim().length > 0;
                return (
                  <div key={f.key} style={s.checkRow}>
                    <span
                      style={{
                        ...s.checkDot,
                        background: done ? "var(--brand-secondary)" : "var(--input-border)",
                      }}
                    />
                    <span
                      style={{
                        ...s.checkLabel,
                        color: done ? "var(--foreground)" : "var(--muted-foreground)",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {f.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={s.formSide}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h2 style={s.formTitle}>Complete your profile</h2>
            <p style={s.formSub}>
              Fields marked <span style={{ color: "#ef4444" }}>*</span> are
              required to access your dashboard.
            </p>
          </div>

          {/* Business phone */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Business phone <span style={s.required}>*</span>
            </label>
            <div style={s.phoneRow}>
              <select
                value={form.dialCode}
                onChange={(e) => set("dialCode", e.target.value)}
                style={{ ...s.input, width: 110, flexShrink: 0 }}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.dialCode}>
                    {c.dialCode} {c.code}
                  </option>
                ))}
              </select>
              <input
                style={s.input}
                type="tel"
                placeholder="8012345678"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/[^0-9+]/g, ""))}
              />
            </div>
          </div>

          {/* Contact person name */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Primary contact name <span style={s.required}>*</span>
            </label>
            <input
              style={s.input}
              placeholder="Full name of the person managing this account"
              value={form.contactPersonName}
              onChange={(e) => set("contactPersonName", e.target.value)}
            />
          </div>

          {/* Contact role (optional) */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Contact role / title</label>
            <select
              style={s.input}
              value={form.contactPersonRole}
              onChange={(e) => set("contactPersonRole", e.target.value)}
            >
              <option value="">Select a role (optional)</option>
              <option value="Owner / Director">Owner / Director</option>
              <option value="General Manager">General Manager</option>
              <option value="Operations Manager">Operations Manager</option>
              <option value="Fleet Manager">Fleet Manager</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Customer Service Manager">Customer Service Manager</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Marketing Manager">Marketing Manager</option>
              <option value="Logistics Coordinator">Logistics Coordinator</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Business address */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Business address <span style={s.required}>*</span>
            </label>
            <input
              style={s.input}
              placeholder="Street, City, State, Country"
              value={form.businessAddress}
              onChange={(e) => set("businessAddress", e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            style={{
              ...s.submitBtn,
              opacity: !isComplete(form) || saving ? 0.5 : 1,
              cursor: !isComplete(form) || saving ? "not-allowed" : "pointer",
            }}
            onClick={handleSave}
            disabled={!isComplete(form) || saving}
          >
            {saving ? "Saving…" : "Complete Profile & Go to Dashboard →"}
          </button>

          <p style={s.note}>
            You can add more details (operating hours, payout accounts, documents)
            from your Settings page after setup.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {
  loadingScreen: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--background)",
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid var(--input-border)",
    borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 1.1fr",
    background: "var(--background)",
  },

  // Left panel
  panel: {
    background: "var(--surface-1)",
    borderRight: "1px solid var(--input-border)",
    display: "flex",
    alignItems: "stretch",
  },
  panelInner: {
    padding: "48px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 40,
    width: "100%",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
    objectFit: "contain",
  },
  logoLabel: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  panelText: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "var(--brand-primary)",
  },
  panelTitle: {
    fontSize: 34,
    fontWeight: 750,
    lineHeight: 1.15,
    letterSpacing: -0.5,
    color: "var(--foreground)",
    margin: 0,
  },
  panelSub: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "var(--muted-foreground)",
    margin: 0,
    maxWidth: 360,
  },

  // Progress
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  progressPct: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--brand-primary)",
  },
  progressBar: {
    height: 6,
    borderRadius: 999,
    background: "var(--input-border)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "var(--brand-primary)",
    transition: "width 0.4s ease",
  },
  fieldChecklist: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background 0.25s",
  },
  checkLabel: {
    fontSize: 13,
    transition: "color 0.25s, text-decoration 0.25s",
  },

  // Right form
  formSide: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    overflowY: "auto",
  },
  formCard: {
    width: "100%",
    maxWidth: 460,
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "var(--foreground)",
  },
  formSub: {
    fontSize: 13,
    color: "var(--muted-foreground)",
    margin: 0,
    lineHeight: 1.55,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--foreground)",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 14,
    outline: "none",
  },
  phoneRow: {
    display: "flex",
    gap: 10,
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    color: "var(--muted-foreground)",
    textAlign: "center",
    lineHeight: 1.55,
    margin: 0,
  },
};
