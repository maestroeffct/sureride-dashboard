"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  getProviderVerificationStatus,
  type ProviderVerificationStatus,
} from "@/src/lib/providerApi";

type Variant = "compact" | "full";

type Props = {
  // What capability the calling page cares about. If the provider already has
  // it, the banner doesn't render at all.
  capability?: "listing" | "payouts" | "any";
  // compact = small horizontal bar (good for top of a list page)
  // full    = larger card (good for dashboard overview)
  variant?: Variant;
};

export default function VerificationBanner({
  capability = "any",
  variant = "compact",
}: Props) {
  const [status, setStatus] = useState<ProviderVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getProviderVerificationStatus();
        setStatus(res);
      } catch {
        // Silent — banner just doesn't show on error. Provider can still
        // navigate the dashboard.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !status) return null;

  // Decide whether to show the banner based on what capability the page needs
  const blocksThisPage =
    capability === "listing"
      ? !status.canListCars
      : capability === "payouts"
        ? !status.canReceivePayouts
        : !status.canListCars || !status.canReceivePayouts;

  if (!blocksThisPage) return null;

  const isWaiting =
    status.blockerMessage?.toLowerCase().includes("waiting") ?? false;
  const Icon = isWaiting ? Clock : AlertTriangle;
  const accent = isWaiting ? "#f59e0b" : "#ef4444";

  if (variant === "compact") {
    return (
      <div
        style={{
          ...s.compact,
          borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
          background: `color-mix(in srgb, ${accent} 8%, transparent)`,
        }}
      >
        <Icon size={18} color={accent} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={s.compactTitle}>
            {capability === "payouts"
              ? "Bank account needed to receive payouts"
              : "Account verification required to list cars"}
          </p>
          <p style={s.compactSub}>{status.blockerMessage}</p>
        </div>
        <Link href="/provider/verification" style={s.compactLink}>
          Complete now
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  // Full variant — show the checklist
  return (
    <div style={s.full}>
      <div style={s.fullHeader}>
        <div style={{ ...s.iconBox, background: `${accent}22`, color: accent }}>
          <Icon size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={s.fullTitle}>Verify your business to start operating</p>
          <p style={s.fullSub}>{status.blockerMessage}</p>
        </div>
        <Link href="/provider/verification" style={s.fullCta}>
          Open Verification Center →
        </Link>
      </div>

      <div style={s.checklist}>
        <ChecklistItem
          label="Basic profile (phone, contact name, business address)"
          done={status.requirements.basicProfile.done}
          extra={
            status.requirements.basicProfile.missing.length > 0
              ? `Missing: ${status.requirements.basicProfile.missing.join(", ")}`
              : undefined
          }
        />
        <ChecklistItem
          label="Required documents (CAC certificate, government ID)"
          done={status.requirements.documents.done}
          extra={
            status.requirements.documents.missing.length > 0
              ? `Missing: ${status.requirements.documents.missing.join(", ")}`
              : status.requirements.documents.uploaded.length > 0 &&
                  !status.requirements.documents.done
                ? "Submitted — awaiting admin review"
                : undefined
          }
        />
        <ChecklistItem
          label="Admin verification"
          done={status.isAdminVerified}
          extra={
            !status.isAdminVerified && status.requirements.documents.done
              ? "Documents reviewed — awaiting admin approval"
              : undefined
          }
        />
        <ChecklistItem
          label="Bank account (required for payouts only)"
          done={
            status.requirements.bankAccount.done &&
            status.requirements.bankAccount.verified
          }
          extra={
            !status.requirements.bankAccount.done
              ? "Add your bank details to start receiving payouts"
              : !status.requirements.bankAccount.verified
                ? "Bank added — awaiting admin verification"
                : undefined
          }
        />
      </div>
    </div>
  );
}

function ChecklistItem({
  label,
  done,
  extra,
}: {
  label: string;
  done: boolean;
  extra?: string;
}) {
  return (
    <div style={s.checkRow}>
      <div
        style={{
          ...s.checkDot,
          background: done
            ? "var(--brand-secondary)"
            : "var(--input-border)",
          color: done ? "#fff" : "var(--muted-foreground)",
        }}
      >
        {done && <CheckCircle2 size={11} strokeWidth={3} />}
      </div>
      <div style={{ flex: 1 }}>
        <span
          style={{
            ...s.checkLabel,
            color: done ? "var(--muted-foreground)" : "var(--foreground)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {label}
        </span>
        {extra && <p style={s.checkExtra}>{extra}</p>}
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  compact: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid",
    marginBottom: 16,
  },
  compactTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  compactSub: {
    margin: "2px 0 0",
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  compactLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--brand-primary)",
    textDecoration: "none",
    flexShrink: 0,
  },

  full: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  fullHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fullTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  fullSub: {
    margin: "3px 0 0",
    fontSize: 12.5,
    color: "var(--muted-foreground)",
  },
  fullCta: {
    background: "var(--brand-primary)",
    color: "#fff",
    padding: "9px 16px",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    textDecoration: "none",
    flexShrink: 0,
  },

  checklist: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingTop: 8,
    borderTop: "1px solid var(--input-border)",
  },
  checkRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  checkLabel: { fontSize: 13 },
  checkExtra: {
    margin: "3px 0 0",
    fontSize: 11.5,
    color: "var(--muted-foreground)",
  },
};
