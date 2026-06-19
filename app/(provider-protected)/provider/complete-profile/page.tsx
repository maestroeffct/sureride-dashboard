"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  getProviderProfile,
  updateProviderProfile,
  type ProviderProfile,
} from "@/src/lib/providerApi";
import CountryDialPicker from "@/src/components/common/CountryDialPicker";
import Image from "next/image";
import logoIcon from "@/src/assets/logo_icon.png";

// ── Zod schema (client) ──────────────────────────────────────────────────────
// Phone is the *local* part (digits only, no '+'). Dial code lives on its own.
// Address requires 10+ characters and at least one space — a single word like
// "Lagos" isn't a real business address.
const PHONE_DIGITS = /^[0-9]{7,15}$/;
const NAME_RE = /^[A-Za-z][A-Za-z\s'.-]{1,}$/;

const CompleteProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(PHONE_DIGITS, "Enter 7–15 digits — no spaces, no symbols"),
  contactPersonName: z
    .string()
    .trim()
    .min(2, "Enter the full name (at least 2 characters)")
    .max(120, "Name is too long")
    .regex(NAME_RE, "Use letters, spaces, apostrophes and hyphens only"),
  contactPersonRole: z.string().trim().max(80).optional(),
  contactPersonPhone: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || PHONE_DIGITS.test(v),
      "Enter 7–15 digits — no spaces, no symbols",
    ),
  businessAddress: z
    .string()
    .trim()
    .min(10, "Business address must be at least 10 characters")
    .max(255, "Address is too long")
    .refine(
      (v) => v.includes(" "),
      "Address should include street, city and state",
    ),
  dialCode: z.string(),
});

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

function validateForm(form: ProfileForm): FormErrors {
  const parsed = CompleteProfileSchema.safeParse(form);
  if (parsed.success) return {};
  const errs: FormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof ProfileForm;
    if (!errs[key]) errs[key] = issue.message;
  }
  return errs;
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
  // Default to Nigeria — primary market. Picker is searchable so users
  // anywhere else can swap in 2 keystrokes.
  dialCode: "+234",
};

// ── Progress steps indicator ──────────────────────────────────────────────────
const FIELDS: { key: keyof ProfileForm; label: string; required?: boolean }[] = [
  { key: "phone", label: "Business phone", required: true },
  { key: "contactPersonName", label: "Primary contact name", required: true },
  { key: "businessAddress", label: "Business address", required: true },
];

export default function CompleteProviderProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  // Field-level errors. Show only after the user has interacted with that
  // field (touched) — avoids screaming at users before they've typed.
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});

  useEffect(() => {
    getProviderProfile()
      .then((p: ProviderProfile) => {
        setProviderName(p.name ?? "");
        const ownerSession = p.session?.isOwner ?? true;
        setIsOwner(ownerSession);

        // Split a stored E.164-ish phone into (dialCode, localDigits) so the
        // user doesn't see "+234" twice on the form.
        const stored = (p.phone ?? "").trim();
        let dialCode = "+234";
        let localPhone = stored;
        if (stored.startsWith("+")) {
          // Match the longest prefix that looks like a dial code (1–4 digits).
          const m = stored.match(/^(\+\d{1,4})(\d*)$/);
          if (m) {
            dialCode = m[1];
            localPhone = m[2];
          } else {
            localPhone = "";
          }
        }

        setForm({
          phone: localPhone,
          contactPersonName: p.contactPersonName ?? "",
          // Owners always show as "Owner / Director" — locked
          contactPersonRole: ownerSession
            ? "Owner / Director"
            : p.contactPersonRole ?? "",
          contactPersonPhone: p.contactPersonPhone ?? "",
          businessAddress: p.businessAddress ?? "",
          dialCode,
        });
      })
      .catch(() => {
        /* ignore — still show form */
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof ProfileForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // Live-compute errors so the button can be disabled atomically with the
  // schema, not just on non-emptiness.
  const errors = useMemo(() => validateForm(form), [form]);
  const formValid = Object.keys(errors).length === 0;

  const handleSave = async () => {
    if (!formValid) {
      // Mark every field touched so the inline errors show up.
      setTouched({
        phone: true,
        contactPersonName: true,
        contactPersonRole: true,
        contactPersonPhone: true,
        businessAddress: true,
        dialCode: true,
      });
      const firstError = Object.values(errors)[0];
      toast.error(firstError ?? "Please fix the highlighted fields");
      return;
    }

    const fullPhone = `${form.dialCode}${form.phone.trim()}`;

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

  // Count how many required fields *validate* (not just non-empty) so the
  // progress bar reflects real correctness.
  const filledCount = FIELDS.filter(
    (f) => f.required && !errors[f.key],
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
              <CountryDialPicker
                value={form.dialCode}
                onChange={(dialCode) => set("dialCode", dialCode)}
                width={130}
              />
              <input
                style={{
                  ...s.input,
                  ...(touched.phone && errors.phone ? s.inputError : {}),
                }}
                type="tel"
                inputMode="numeric"
                placeholder="8012345678"
                value={form.phone}
                onChange={(e) =>
                  set("phone", e.target.value.replace(/[^0-9]/g, ""))
                }
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              />
            </div>
            {touched.phone && errors.phone && (
              <span style={s.errText}>{errors.phone}</span>
            )}
          </div>

          {/* Contact person name */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Primary contact name <span style={s.required}>*</span>
            </label>
            <input
              style={{
                ...s.input,
                ...(touched.contactPersonName && errors.contactPersonName
                  ? s.inputError
                  : {}),
              }}
              placeholder="Full name of the person managing this account"
              value={form.contactPersonName}
              onChange={(e) => set("contactPersonName", e.target.value)}
              onBlur={() =>
                setTouched((t) => ({ ...t, contactPersonName: true }))
              }
            />
            {touched.contactPersonName && errors.contactPersonName && (
              <span style={s.errText}>{errors.contactPersonName}</span>
            )}
          </div>

          {/* Contact role (optional) */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Contact role / title</label>
            {isOwner ? (
              <input
                style={{ ...s.input, background: "#f3f4f6", cursor: "not-allowed" }}
                value="Owner / Director"
                disabled
                readOnly
                title="This account is the business owner and cannot change role."
              />
            ) : (
              <select
                style={s.input}
                value={form.contactPersonRole}
                onChange={(e) => set("contactPersonRole", e.target.value)}
              >
                <option value="">Select a role (optional)</option>
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
            )}
          </div>

          {/* Business address */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              Business address <span style={s.required}>*</span>
              <span style={s.helperHint}>
                {" "}— minimum 10 characters
              </span>
            </label>
            <input
              style={{
                ...s.input,
                ...(touched.businessAddress && errors.businessAddress
                  ? s.inputError
                  : {}),
              }}
              placeholder="Street, City, State, Country"
              value={form.businessAddress}
              onChange={(e) => set("businessAddress", e.target.value)}
              onBlur={() =>
                setTouched((t) => ({ ...t, businessAddress: true }))
              }
            />
            {touched.businessAddress && errors.businessAddress && (
              <span style={s.errText}>{errors.businessAddress}</span>
            )}
          </div>

          {/* Submit */}
          <button
            style={{
              ...s.submitBtn,
              opacity: !formValid || saving ? 0.5 : 1,
              cursor: !formValid || saving ? "not-allowed" : "pointer",
            }}
            onClick={handleSave}
            disabled={!formValid || saving}
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
  inputError: {
    borderColor: "#dc2626",
    boxShadow: "0 0 0 2px rgba(220,38,38,0.18)",
  },
  errText: {
    color: "#f87171",
    fontSize: 12,
    marginTop: 4,
  },
  helperHint: {
    color: "var(--muted, #94a3b8)",
    fontSize: 11,
    fontWeight: 400,
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
