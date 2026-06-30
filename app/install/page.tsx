"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  activateLicense,
  getLicenseInfo,
  type LicenseInfo,
} from "@/src/lib/licenseApi";

/**
 * First-run setup wizard. Two steps only — we delegate everything that's
 * already self-serve in the dashboard (storage credentials, payment
 * gateways, FCM, etc.) to the Platform Settings surfaces the buyer will
 * see after they sign in.
 *
 *   Step 1: paste license key → activate
 *   Step 2: nudge to sign in / create the first admin via login flow
 *
 * The page is public — no auth — but redirects away once the install is
 * already ACTIVE so admins can't accidentally re-trigger setup.
 */

type Step = "license" | "done";

export default function InstallWizardPage() {
  const router = useRouter();
  const [bootChecking, setBootChecking] = useState(true);
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [step, setStep] = useState<Step>("license");
  const [licenseKey, setLicenseKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Hydrate once. If install is already ACTIVE, get out of the way.
  const hydrate = useCallback(async () => {
    try {
      const res = await getLicenseInfo();
      setInfo(res);
      if (res.status === "ACTIVE" || res.status === "DEGRADED") {
        // Already set up — admins shouldn't see the wizard again.
        router.replace("/login");
      }
    } catch {
      // backend unreachable — show the wizard anyway so the user can at
      // least see something instead of a blank screen.
    } finally {
      setBootChecking(false);
    }
  }, [router]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const onActivate = async () => {
    const trimmed = licenseKey.trim();
    if (trimmed.length < 8) {
      toast.error("License key looks too short — should be SR-XXXX-XXXX-XXXX-XXXX");
      return;
    }
    try {
      setSubmitting(true);
      const res = await activateLicense({
        licenseKey: trimmed,
        domain:
          typeof window !== "undefined" ? window.location.hostname : undefined,
      });
      setInfo(res);
      if (res.status === "ACTIVE") {
        toast.success("License activated");
        setStep("done");
      } else {
        toast.error(res.message ?? `Activation failed (${res.status})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (bootChecking) {
    return (
      <div style={s.page}>
        <div style={s.loading}>
          <Loader2 size={20} className="hover-soft" /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <header style={s.header}>
          <div style={s.brand}>
            <ShieldCheck size={20} color="var(--brand-primary)" />
            <span style={s.brandText}>SureRide Setup</span>
          </div>
          <div style={s.steps}>
            <StepDot label="License" active={step === "license"} done={step === "done"} />
            <span style={s.stepLine} />
            <StepDot label="Done" active={step === "done"} done={false} />
          </div>
        </header>

        {step === "license" ? (
          <div style={s.body}>
            <h1 style={s.title}>Activate this install</h1>
            <p style={s.subtitle}>
              Paste the license key from your purchase email. We&rsquo;ll verify it
              against the SureRide license server and remember it on this install.
            </p>

            <div style={s.field}>
              <label style={s.label}>License key</label>
              <input
                style={s.input}
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="SR-XXXX-XXXX-XXXX-XXXX"
                autoFocus
              />
            </div>

            {info?.installationId ? (
              <p style={s.installLine}>
                Installation fingerprint:{" "}
                <code style={s.code}>{info.installationId}</code>
                <br />
                <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                  Quote this when contacting support.
                </span>
              </p>
            ) : null}

            {info?.lastError ? (
              <div style={s.errorBox}>
                <XCircle size={14} /> Last attempt failed: {info.lastError}
              </div>
            ) : null}

            <button
              type="button"
              style={s.primary}
              onClick={onActivate}
              disabled={submitting || licenseKey.trim().length < 8}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} /> Activating…
                </>
              ) : (
                <>
                  <KeyRound size={14} /> Activate
                </>
              )}
            </button>

            <p style={s.help}>
              Don&rsquo;t have a key yet?{" "}
              <a
                href="https://surerideautoservices.com/buy"
                target="_blank"
                rel="noreferrer"
                style={s.link}
              >
                Get one <ExternalLink size={12} />
              </a>
            </p>
          </div>
        ) : (
          <div style={s.body}>
            <div style={s.successIcon}>
              <CheckCircle2 size={42} color="var(--brand-primary)" />
            </div>
            <h1 style={s.title}>You&rsquo;re all set</h1>
            <p style={s.subtitle}>
              License is active. Sign in with your admin account to finish
              configuring storage, payment gateways, notifications, and your
              first provider. Everything from here on out lives in Platform
              Settings.
            </p>

            <div style={s.summary}>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Customer</span>
                <span>{info?.customerName ?? "—"}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Plan</span>
                <span>{info?.plan ?? "—"}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Expires</span>
                <span>
                  {info?.expiresAt
                    ? new Date(info.expiresAt).toLocaleDateString()
                    : "Never"}
                </span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Installation</span>
                <code style={s.code}>{info?.installationId}</code>
              </div>
            </div>

            <button
              type="button"
              style={s.primary}
              onClick={() => router.push("/login")}
            >
              Go to sign in <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDot({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div style={s.stepDotWrap}>
      <span
        style={{
          ...s.stepDot,
          background: done
            ? "var(--brand-primary)"
            : active
              ? "color-mix(in srgb, var(--brand-primary) 18%, transparent)"
              : "var(--surface-2)",
          color: done
            ? "#022c22"
            : active
              ? "var(--brand-primary)"
              : "var(--muted-foreground)",
          borderColor: active || done ? "var(--brand-primary)" : "var(--input-border)",
        }}
      >
        {done ? <CheckCircle2 size={12} /> : null}
      </span>
      <span
        style={{
          ...s.stepLabel,
          color: active || done ? "var(--foreground)" : "var(--muted-foreground)",
          fontWeight: active ? 700 : 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background:
      "radial-gradient(ellipse at top, color-mix(in srgb, var(--brand-primary) 12%, transparent), transparent 50%), var(--background)",
  },
  card: {
    width: "100%",
    maxWidth: 540,
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 18,
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid var(--input-border)",
  },
  brand: { display: "flex", alignItems: "center", gap: 8 },
  brandText: { fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  steps: { display: "flex", alignItems: "center", gap: 10 },
  stepLine: { width: 24, height: 1, background: "var(--input-border)" },
  stepDotWrap: { display: "flex", alignItems: "center", gap: 6 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "1px solid var(--input-border)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
  },
  stepLabel: { fontSize: 12 },

  body: { padding: 28, display: "flex", flexDirection: "column", gap: 16 },
  title: { margin: 0, fontSize: 22, fontWeight: 750, letterSpacing: -0.3 },
  subtitle: {
    margin: 0,
    fontSize: 14,
    color: "var(--muted-foreground)",
    lineHeight: 1.6,
  },
  field: { display: "flex", flexDirection: "column", gap: 6, marginTop: 6 },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 14,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    outline: "none",
    letterSpacing: 1,
  },
  installLine: { margin: 0, fontSize: 12, color: "var(--muted-foreground)" },
  code: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 11,
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8,
    color: "#fca5a5",
    fontSize: 12,
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    padding: "0 22px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#022c22",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
  help: {
    margin: 0,
    fontSize: 12,
    color: "var(--muted-foreground)",
    textAlign: "center",
  },
  link: {
    color: "var(--brand-primary)",
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },

  successIcon: { display: "flex", justifyContent: "center", marginBottom: 4 },
  summary: {
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 13 },
  summaryLabel: { color: "var(--muted-foreground)" },

  loading: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--muted-foreground)",
    fontSize: 14,
  },
};
