"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  acceptProviderInvite,
  getProviderInvitePreview,
  type ProviderInvitePreview,
} from "@/src/lib/providerApi";

const AcceptSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    phone: z.string().trim().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type AcceptForm = z.infer<typeof AcceptSchema>;

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  FLEET_MANAGER: "Fleet Manager",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  CUSTOMER_SERVICE: "Customer Service",
};

function AcceptInviteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [preview, setPreview] = useState<ProviderInvitePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AcceptForm, string>>>({});

  const [form, setForm] = useState<AcceptForm>({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirm: "",
  });

  useEffect(() => {
    if (!token) {
      setLoadError("Missing invite token. Check the link in your email.");
      setLoading(false);
      return;
    }
    getProviderInvitePreview(token)
      .then((p) => {
        setPreview(p);
        setForm((prev) => ({
          ...prev,
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone ?? "",
        }));
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Invalid invite");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const set = <K extends keyof AcceptForm>(k: K, v: AcceptForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = AcceptSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Partial<Record<keyof AcceptForm, string>> = {};
      for (const i of parsed.error.issues) {
        fe[i.path[0] as keyof AcceptForm] = i.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);
      const response = await acceptProviderInvite({
        token,
        password: parsed.data.password,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || undefined,
      });

      localStorage.setItem("sureride_provider_token", response.token);
      localStorage.setItem(
        "sureride_provider_user",
        JSON.stringify({
          id: response.staff.id,
          name: `${response.staff.firstName} ${response.staff.lastName}`.trim(),
          email: response.staff.email,
          status: "ACTIVE",
        }),
      );
      document.cookie = `sureride_provider_token=${response.token}; path=/; samesite=lax`;

      toast.success("Welcome aboard!");
      router.replace("/provider");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete signup",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.spinner} />
      </div>
    );
  }

  if (loadError || !preview) {
    return (
      <div style={s.center}>
        <div style={s.errorCard}>
          <h2 style={s.errorTitle}>Invite unavailable</h2>
          <p style={s.errorBody}>
            {loadError ?? "We couldn't load your invite."}
          </p>
          <button
            style={s.primaryBtn}
            onClick={() => router.replace("/provider/login")}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>
          You're invited to {preview.providerName}
        </h1>
        <p style={s.sub}>
          {preview.email} · {ROLE_LABEL[preview.role] ?? preview.role}
        </p>

        <form style={s.form} onSubmit={handleSubmit} noValidate>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>First name</label>
              <input
                style={{ ...s.input, ...(errors.firstName ? s.inputError : {}) }}
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
              {errors.firstName && <span style={s.err}>{errors.firstName}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Last name</label>
              <input
                style={{ ...s.input, ...(errors.lastName ? s.inputError : {}) }}
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
              {errors.lastName && <span style={s.err}>{errors.lastName}</span>}
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Phone (optional)</label>
            <input
              style={s.input}
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+234 801 234 5678"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.pwdWrap}>
              <input
                type={showPwd ? "text" : "password"}
                style={{
                  ...s.input,
                  paddingRight: 40,
                  ...(errors.password ? s.inputError : {}),
                }}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                style={s.pwdToggle}
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span style={s.err}>{errors.password}</span>}
          </div>

          <div style={s.field}>
            <label style={s.label}>Confirm password</label>
            <input
              type={showPwd ? "text" : "password"}
              style={{ ...s.input, ...(errors.confirm ? s.inputError : {}) }}
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
            />
            {errors.confirm && <span style={s.err}>{errors.confirm}</span>}
          </div>

          <button style={s.primaryBtn} type="submit" disabled={submitting}>
            {submitting ? "Setting up…" : "Accept invite & sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div style={s.center}><div style={s.spinner} /></div>}>
      <AcceptInviteInner />
    </Suspense>
  );
}

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#f8fafc",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  sub: { margin: 0, color: "#64748b", fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 12, marginTop: 8 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#334155" },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
  },
  inputError: { borderColor: "#dc2626" },
  err: { fontSize: 12, color: "#dc2626" },
  pwdWrap: { position: "relative" },
  pwdToggle: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 4,
    color: "#64748b",
  },
  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 10,
    background: "#0f766e",
    color: "#fff",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 15,
  },
  errorCard: {
    maxWidth: 420,
    background: "#fff",
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: 24,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  errorTitle: { margin: 0, fontSize: 18, color: "#991b1b", fontWeight: 700 },
  errorBody: { margin: 0, color: "#7f1d1d" },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0f766e",
    animation: "spin 0.8s linear infinite",
  },
};
