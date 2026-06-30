"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Fingerprint,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  activateLicense,
  getLicenseInfo,
  reverifyLicense,
  type LicenseInfo,
  type LicenseStatus,
} from "@/src/lib/licenseApi";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";

/**
 * Read + manage the install's license. Admins land here from the topbar
 * banner when status isn't ACTIVE, and from Platform Settings ▸ License
 * for routine checks.
 */
export default function LicensePage() {
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [reverifying, setReverifying] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLicenseInfo();
      setInfo(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load license");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReverify = async () => {
    try {
      setReverifying(true);
      const res = await reverifyLicense();
      setInfo(res);
      toast.success(
        res.status === "ACTIVE"
          ? "License is active"
          : `Status: ${res.status}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-verify failed");
    } finally {
      setReverifying(false);
    }
  };

  const handleUpdateKey = async () => {
    if (newKey.trim().length < 8) {
      toast.error("Key looks too short");
      return;
    }
    try {
      setUpdating(true);
      const res = await activateLicense({
        licenseKey: newKey.trim(),
        domain:
          typeof window !== "undefined" ? window.location.hostname : undefined,
      });
      setInfo(res);
      if (res.status === "ACTIVE") {
        toast.success("License updated");
        setEditing(false);
        setNewKey("");
      } else {
        toast.error(res.message ?? `Activation failed (${res.status})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const copy = (value: string, label: string) => {
    void navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  };

  const tone = statusTone(info?.status);

  return (
    <div style={s.page}>
      <div>
        <h1 style={s.title}>
          <ShieldCheck size={20} color="var(--brand-primary)" /> License
        </h1>
        <p style={s.subtitle}>
          Status of this install&rsquo;s SureRide license. Renew, paste a new
          key, or force a re-check against the license server.
        </p>
      </div>

      {/* Hero status card */}
      <article
        style={{
          ...s.statusCard,
          borderColor: tone.borderColor,
          background: tone.bg,
        }}
      >
        <div style={s.statusLeft}>
          <span style={{ ...s.statusIcon, color: tone.fg }}>{tone.icon}</span>
          <div>
            <p style={s.statusLabel}>License status</p>
            <strong style={{ ...s.statusValue, color: tone.fg }}>
              {info?.status ?? "—"}
            </strong>
            <p style={s.statusHint}>{statusHint(info)}</p>
          </div>
        </div>
        <div style={s.statusActions}>
          <button
            type="button"
            className="hover-soft"
            style={s.secondaryBtn}
            onClick={() => void handleReverify()}
            disabled={reverifying}
          >
            <RefreshCw size={14} />
            {reverifying ? "Checking…" : "Re-verify now"}
          </button>
          <button
            type="button"
            className="hover-soft"
            style={s.primaryBtn}
            onClick={() => setEditing((v) => !v)}
          >
            <KeyRound size={14} />
            {editing ? "Cancel" : "Update key"}
          </button>
        </div>
      </article>

      {editing ? (
        <div style={s.editKeyCard}>
          <label style={s.fieldLabel}>New license key</label>
          <input
            style={s.input}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
            placeholder="SR-XXXX-XXXX-XXXX-XXXX"
          />
          <button
            type="button"
            style={s.primaryBtn}
            onClick={() => void handleUpdateKey()}
            disabled={updating || newKey.trim().length < 8}
          >
            {updating ? "Activating…" : "Activate new key"}
          </button>
          <p style={s.warning}>
            Replacing the key here counts as a new activation. If your previous
            key was on its install-cap, contact support to release a slot first.
          </p>
        </div>
      ) : null}

      {/* KPIs */}
      <KpiGrid>
        <KpiCard
          label="Plan"
          value={info?.plan ?? "—"}
          subtext={info?.productCode ?? ""}
          icon={<ShieldCheck size={18} />}
          tone="var(--brand-primary)"
        />
        <KpiCard
          label="Customer"
          value={info?.customerName ?? "—"}
          subtext={info?.customerEmail ?? ""}
          icon={<ShieldCheck size={18} />}
          tone="#22c55e"
        />
        <KpiCard
          label="Expires"
          value={
            info?.expiresAt
              ? new Date(info.expiresAt).toLocaleDateString()
              : "Never"
          }
          subtext={
            info?.expiresAt
              ? daysUntil(info.expiresAt) + " from today"
              : "Perpetual license"
          }
          icon={<Clock size={18} />}
          tone={info?.expiresAt && daysUntilNumber(info.expiresAt) < 30 ? "#f59e0b" : "#7c3aed"}
        />
        <KpiCard
          label="Domains"
          value={info?.allowedDomains.length ?? 0}
          subtext={
            (info?.allowedDomains.length ?? 0) === 0
              ? "No domain lock"
              : info?.allowedDomains.join(", ") ?? ""
          }
          icon={<ExternalLink size={18} />}
          tone="#3b82f6"
        />
      </KpiGrid>

      {/* Details */}
      <div style={s.detailsCard}>
        <h2 style={s.cardTitle}>Install details</h2>
        <div style={s.detailGrid}>
          <DetailRow
            label="Installation fingerprint"
            value={info?.installationId ?? ""}
            mono
            icon={<Fingerprint size={14} />}
            onCopy={() =>
              info?.installationId &&
              copy(info.installationId, "Installation ID")
            }
            hint="Quote this when contacting support."
          />
          <DetailRow
            label="License key"
            value={info?.keyPreview ?? "Not set"}
            mono
            icon={<KeyRound size={14} />}
            hint={
              info?.keyPreview
                ? "Stored encrypted; only first/last 4 shown."
                : "Use Update key above to enter a key."
            }
          />
          <DetailRow
            label="Last verified"
            value={
              info?.lastVerifiedOkAt
                ? new Date(info.lastVerifiedOkAt).toLocaleString()
                : "Never"
            }
            icon={<CheckCircle2 size={14} />}
          />
          <DetailRow
            label="Last attempt"
            value={
              info?.lastVerifyAttemptAt
                ? new Date(info.lastVerifyAttemptAt).toLocaleString()
                : "Never"
            }
            icon={<RefreshCw size={14} />}
          />
        </div>
        {info?.lastError ? (
          <div style={s.errorRow}>
            <XCircle size={14} />
            <span>
              <strong>Last error:</strong> {info.lastError}
            </span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted-foreground)" }}>Loading…</p>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  hint,
  icon,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>
        {icon} {label}
      </span>
      <div style={s.detailValueRow}>
        <span
          style={{
            ...s.detailValue,
            ...(mono
              ? {
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                }
              : {}),
          }}
        >
          {value}
        </span>
        {onCopy ? (
          <button
            type="button"
            className="hover-soft"
            onClick={onCopy}
            style={s.copyBtn}
            title="Copy"
          >
            <Copy size={12} />
          </button>
        ) : null}
      </div>
      {hint ? <p style={s.detailHint}>{hint}</p> : null}
    </div>
  );
}

function statusTone(status?: LicenseStatus) {
  const accent = (color: string) => ({
    fg: color,
    bg: `color-mix(in srgb, ${color} 8%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 38%, transparent)`,
  });
  switch (status) {
    case "ACTIVE":
      return { ...accent("#22c55e"), icon: <CheckCircle2 size={26} /> };
    case "DEGRADED":
      return { ...accent("#f59e0b"), icon: <AlertTriangle size={26} /> };
    case "EXPIRED":
      return { ...accent("#f59e0b"), icon: <Clock size={26} /> };
    case "INVALID":
      return { ...accent("#ef4444"), icon: <ShieldAlert size={26} /> };
    case "UNLICENSED":
    default:
      return { ...accent("#94a3b8"), icon: <KeyRound size={26} /> };
  }
}

function statusHint(info: LicenseInfo | null): string {
  if (!info) return "Loading…";
  switch (info.status) {
    case "ACTIVE":
      return "License is active and verified.";
    case "DEGRADED":
      return "License server is unreachable but we're still in the 7-day grace window. Verify will retry automatically.";
    case "EXPIRED":
      return "License has reached its expiry date. Renew to restore full access.";
    case "INVALID":
      return "Server rejected the key — revoked, mismatched product/domain, or past hard kill window. Contact support.";
    case "UNLICENSED":
      return "No license key has been entered yet.";
  }
}

function daysUntilNumber(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / 86400000);
}

function daysUntil(iso: string): string {
  const days = daysUntilNumber(iso);
  if (days < 0) return `${-days} days ago`;
  if (days === 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100 },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 750,
    letterSpacing: -0.4,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "var(--muted-foreground)",
    fontSize: 13,
    maxWidth: 720,
  },

  statusCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderRadius: 16,
    border: "1px solid var(--input-border)",
    gap: 18,
    flexWrap: "wrap",
  },
  statusLeft: { display: "flex", gap: 14, alignItems: "center" },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: "color-mix(in srgb, currentColor 18%, transparent)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statusLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "var(--muted-foreground)",
  },
  statusValue: { fontSize: 22, fontWeight: 700, letterSpacing: -0.2 },
  statusHint: {
    margin: "4px 0 0",
    color: "var(--foreground)",
    fontSize: 13,
    maxWidth: 520,
    lineHeight: 1.5,
  },
  statusActions: { display: "flex", gap: 10, flexWrap: "wrap" },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    border: "none",
    background: "var(--brand-primary)",
    color: "#022c22",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  editKeyCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    background: "var(--surface-1)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  fieldLabel: {
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
  warning: { margin: 0, fontSize: 12, color: "var(--muted-foreground)" },

  detailsCard: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 700 },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },
  detailRow: { display: "flex", flexDirection: "column", gap: 4 },
  detailLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValueRow: { display: "inline-flex", alignItems: "center", gap: 6 },
  detailValue: { fontSize: 14, color: "var(--foreground)" },
  detailHint: {
    margin: "2px 0 0",
    fontSize: 11,
    color: "var(--muted-foreground)",
  },
  copyBtn: {
    background: "transparent",
    border: "1px solid var(--input-border)",
    borderRadius: 6,
    color: "var(--muted-foreground)",
    cursor: "pointer",
    padding: "4px 6px",
    display: "inline-flex",
    alignItems: "center",
  },

  errorRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10,
    color: "#fca5a5",
    fontSize: 12,
  },
};
