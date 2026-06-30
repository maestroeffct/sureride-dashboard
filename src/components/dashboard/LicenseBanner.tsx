"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import {
  getLicenseInfo,
  type LicenseInfo,
  type LicenseStatus,
} from "@/src/lib/licenseApi";

/**
 * Cross-app banner that surfaces a non-ACTIVE license. Mounts in the
 * protected layout so admins / providers always see it. Polls every
 * 5 minutes to catch a server-side revocation without requiring page
 * reload.
 *
 * Hidden on /install (the setup wizard handles its own messaging) and
 * any /provider/auth or /admin/auth routes (banner shouldn't leak the
 * license state to unauth'd contexts).
 */
export default function LicenseBanner() {
  const pathname = usePathname() ?? "";
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const skip =
    pathname.startsWith("/install") ||
    pathname.startsWith("/provider/auth") ||
    pathname.startsWith("/admin/auth") ||
    pathname.startsWith("/login");

  useEffect(() => {
    if (skip) return;
    let mounted = true;
    const fetchOnce = () => {
      getLicenseInfo()
        .then((res) => {
          if (mounted) setInfo(res);
        })
        .catch(() => {
          // Soft-fail — backend unreachable shouldn't render a banner.
        });
    };
    fetchOnce();
    const id = setInterval(fetchOnce, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [skip]);

  if (skip || !info) return null;
  if (info.status === "ACTIVE") return null;
  if (dismissed && info.status === "DEGRADED") return null; // Allow dismiss for soft warnings

  const tone = bannerTone(info.status);

  return (
    <div
      style={{
        ...s.banner,
        background: tone.bg,
        borderColor: tone.border,
        color: tone.fg,
      }}
    >
      <span style={s.iconWrap}>{tone.icon}</span>
      <div style={s.text}>
        <strong>{messageTitle(info.status)}</strong>
        <span style={s.detail}>{messageDetail(info)}</span>
      </div>
      <Link
        href="/rentals/platform/license"
        style={{ ...s.cta, color: tone.fg, borderColor: tone.border }}
      >
        Open License page
      </Link>
      {info.status === "DEGRADED" ? (
        <button
          type="button"
          style={{ ...s.dismiss, color: tone.fg }}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss for this session"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

function bannerTone(status: LicenseStatus) {
  switch (status) {
    case "DEGRADED":
      return {
        bg: "rgba(245,158,11,0.10)",
        border: "rgba(245,158,11,0.45)",
        fg: "#fcd34d",
        icon: <AlertTriangle size={16} />,
      };
    case "EXPIRED":
    case "INVALID":
    case "UNLICENSED":
    default:
      return {
        bg: "rgba(239,68,68,0.10)",
        border: "rgba(239,68,68,0.45)",
        fg: "#fca5a5",
        icon: <ShieldAlert size={16} />,
      };
  }
}

function messageTitle(status: LicenseStatus): string {
  switch (status) {
    case "DEGRADED":
      return "License server unreachable";
    case "EXPIRED":
      return "License expired";
    case "INVALID":
      return "License invalid";
    case "UNLICENSED":
      return "Not activated";
    default:
      return "";
  }
}

function messageDetail(info: LicenseInfo): string {
  switch (info.status) {
    case "DEGRADED":
      return "We're still in the 7-day grace window; everything works but verify is failing. Will retry automatically.";
    case "EXPIRED":
      return "Renew your license to restore full admin + provider access.";
    case "INVALID":
      return info.lastError ?? "Server rejected the key. Contact support.";
    case "UNLICENSED":
      return "Enter a license key to unlock admin + provider routes.";
    default:
      return "";
  }
}

const s: Record<string, CSSProperties> = {
  banner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 18px",
    border: "1px solid",
    fontSize: 13,
    fontWeight: 500,
  },
  iconWrap: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
  },
  text: { display: "flex", flexDirection: "column", flex: 1, gap: 2 },
  detail: { fontSize: 12, opacity: 0.85, fontWeight: 400 },
  cta: {
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid",
    whiteSpace: "nowrap",
  },
  dismiss: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 4,
  },
};
