"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { X, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { createAdminUser } from "@/src/lib/usersApi";
import type { UserProfileStatus } from "@/src/types/adminUser";

/**
 * Overlay form for admins to add a user without leaving the Users table.
 * Mirrors /rentals/users/new but as a modal — admins keep the table in
 * view while creating, and on success the parent calls `onCreated()` to
 * refresh the list in place.
 */

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  password: string;
  isActive: boolean;
  isVerified: boolean;
  profileStatus: UserProfileStatus;
  sendInvite: boolean;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCountry: "+234",
  phoneNumber: "",
  dateOfBirth: "",
  nationality: "Nigeria",
  password: "",
  isActive: true,
  isVerified: false,
  profileStatus: "INCOMPLETE",
  sendInvite: true,
};

export default function AddUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Reset the form whenever the modal is freshly opened so leftover data
  // from a previous edit session doesn't linger.
  useEffect(() => {
    if (open) setForm(INITIAL_FORM);
  }, [open]);

  // Escape-to-close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, submitting]);

  if (!open) return null;

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.sendInvite && !form.password.trim()) {
      toast.error("Password is required when Send Invite is off");
      return;
    }
    if (!form.dateOfBirth) {
      toast.error("Date of birth is required");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createAdminUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneCountry: form.phoneCountry.trim(),
        phoneNumber: form.phoneNumber.trim(),
        dateOfBirth: form.dateOfBirth,
        nationality: form.nationality.trim(),
        password: form.password.trim() || undefined,
        isActive: form.isActive,
        isVerified: form.isVerified,
        profileStatus: form.profileStatus,
        sendInvite: form.sendInvite,
      });

      if (response.inviteEmailSent) {
        toast.success("User created and invite sent");
      } else {
        toast.success("User created");
      }
      onCreated();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.backdrop} onClick={() => !submitting && onClose()}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.titleRow}>
            <span style={s.titleIcon}>
              <UserPlus size={18} />
            </span>
            <h2 style={s.title}>Add New User</h2>
          </div>
          <button
            type="button"
            style={s.closeBtn}
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form style={s.body} onSubmit={onSubmit}>
          <div style={s.grid2}>
            <Field label="First Name *">
              <input
                style={s.input}
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
              />
            </Field>
            <Field label="Last Name *">
              <input
                style={s.input}
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Email *">
            <input
              type="email"
              style={s.input}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="email@example.com"
              required
            />
          </Field>

          <div style={s.grid2Phone}>
            <Field label="Phone Country *">
              <input
                style={s.input}
                value={form.phoneCountry}
                onChange={(e) => updateField("phoneCountry", e.target.value)}
                placeholder="+234"
                required
              />
            </Field>
            <Field label="Phone Number *">
              <input
                style={s.input}
                value={form.phoneNumber}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
                placeholder="8012345678"
                required
              />
            </Field>
          </div>

          <div style={s.grid2}>
            <Field label="Date of Birth *">
              <input
                type="date"
                style={s.input}
                value={form.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                required
              />
            </Field>
            <Field label="Nationality">
              <input
                style={s.input}
                value={form.nationality}
                onChange={(e) => updateField("nationality", e.target.value)}
              />
            </Field>
          </div>

          <div style={s.grid2}>
            <Field label="Profile Status">
              <select
                style={s.input}
                value={form.profileStatus}
                onChange={(e) =>
                  updateField("profileStatus", e.target.value as UserProfileStatus)
                }
              >
                <option value="INCOMPLETE">INCOMPLETE</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </Field>
            <Field label="Password (optional)">
              <input
                type="password"
                style={s.input}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
            </Field>
          </div>

          <div style={s.checkRow}>
            <Check
              checked={form.sendInvite}
              onChange={(v) => updateField("sendInvite", v)}
              label="Send invite email"
            />
            <Check
              checked={form.isActive}
              onChange={(v) => updateField("isActive", v)}
              label="Active account"
            />
            <Check
              checked={form.isVerified}
              onChange={(v) => updateField("isVerified", v)}
              label="Mark as verified"
            />
          </div>

          <p style={s.helper}>
            If <b>Send invite email</b> is off, you must enter a password.
          </p>

          <div style={s.footer}>
            <button
              type="button"
              style={s.btnSecondary}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" style={s.btnPrimary} disabled={submitting}>
              {submitting ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <span style={s.label}>{label}</span>
      {children}
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label style={s.check}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={s.checkbox}
      />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  );
}

const s: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.65)",
    zIndex: 80,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 24px",
    backdropFilter: "blur(2px)",
    overflowY: "auto",
  },
  modal: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    width: "100%",
    maxWidth: 720,
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 22px",
    borderBottom: "1px solid var(--input-border)",
  },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "rgba(34,197,94,0.12)",
    color: "var(--brand-secondary)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: "var(--foreground)" },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--muted-foreground)",
    padding: 6,
    borderRadius: 6,
  },
  body: {
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  grid2Phone: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 14,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 14,
    outline: "none",
  },
  checkRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    paddingTop: 4,
    borderTop: "1px solid var(--input-border)",
    marginTop: 4,
  },
  check: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "var(--foreground)",
    cursor: "pointer",
  },
  checkbox: {
    accentColor: "var(--brand-secondary)",
    width: 16,
    height: 16,
  },
  helper: {
    margin: 0,
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 12,
    borderTop: "1px solid var(--input-border)",
  },
  btnSecondary: {
    padding: "9px 16px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  btnPrimary: {
    padding: "9px 22px",
    borderRadius: 10,
    border: "none",
    background: "var(--brand-secondary)",
    color: "#022c22",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
};
