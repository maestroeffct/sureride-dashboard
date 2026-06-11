"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  CalendarCheck,
  UserPlus,
  Building2,
  ClipboardList,
  BellOff,
  Loader2,
  CheckCheck,
  CreditCard,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import type { Notification, NotificationKind } from "@/src/hooks/useNotifications";

// ── relative time ────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── per-kind config ───────────────────────────────────────────────────────────
const KIND_CONFIG: Record<
  NotificationKind,
  { Icon: React.ElementType; bg: string; color: string; label: string }
> = {
  booking: { Icon: CalendarCheck, bg: "rgba(59,130,246,0.12)", color: "#3b82f6", label: "Booking" },
  provider: { Icon: Building2, bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Provider" },
  providerRequest: { Icon: ClipboardList, bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Request" },
  user: { Icon: UserPlus, bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", label: "New User" },
  car: { Icon: Car, bg: "rgba(236,72,153,0.12)", color: "#ec4899", label: "Fleet" },
  payment: { Icon: CreditCard, bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Payment" },
  payout: { Icon: Wallet, bg: "rgba(34,197,94,0.12)", color: "#22c55e", label: "Payout" },
  kyc: { Icon: ShieldCheck, bg: "rgba(20,184,166,0.12)", color: "#14b8a6", label: "KYC" },
};

// ── props ─────────────────────────────────────────────────────────────────────
type Props = {
  notifications: Notification[];
  readSet: Set<string>;
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
};

export default function NotificationPanel({
  notifications,
  readSet,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: Props) {
  const router = useRouter();

  const handleClick = (n: Notification) => {
    onMarkRead(n.id);
    onClose();
    router.push(n.href);
  };

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.headerTitle}>Notifications</span>
          {unreadCount > 0 && (
            <span style={s.badge}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button style={s.markAllBtn} onClick={onMarkAllRead} title="Mark all as read">
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Body */}
      <div style={s.body}>
        {loading && notifications.length === 0 ? (
          <div style={s.empty}>
            <Loader2 size={22} style={{ opacity: 0.4, animation: "spin 1s linear infinite" }} />
            <span style={s.emptyText}>Loading…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={s.empty}>
            <BellOff size={24} style={{ opacity: 0.3 }} />
            <span style={s.emptyText}>No recent activity</span>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = readSet.has(n.id);
            const cfg = KIND_CONFIG[n.kind];
            return (
              <button
                key={n.id}
                style={{ ...s.item, ...(isRead ? s.itemRead : {}) }}
                onClick={() => handleClick(n)}
              >
                {/* Icon */}
                <div style={{ ...s.iconWrap, background: cfg.bg }}>
                  <cfg.Icon size={15} color={cfg.color} />
                </div>

                {/* Text */}
                <div style={s.itemText}>
                  <div style={s.itemTop}>
                    <span style={{ ...s.itemTitle, ...(isRead ? s.itemTitleRead : {}) }}>
                      {n.title}
                    </span>
                    <span style={s.itemTime}>{relativeTime(n.createdAt)}</span>
                  </div>
                  <span style={s.itemSub}>{n.subtitle}</span>
                  <span style={{ ...s.kindTag, color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Unread dot */}
                {!isRead && <span style={s.unreadDot} />}
              </button>
            );
          })
        )}
      </div>

      {/* Footer — view all */}
      <div style={s.footer}>
        <button
          style={s.viewAllBtn}
          onClick={() => {
            onClose();
            router.push("/notifications");
          }}
        >
          View all notifications
          <span style={{ fontSize: 13, lineHeight: 1 }}>→</span>
        </button>
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  panel: {
    position: "absolute",
    top: 52,
    right: 0,
    width: 340,
    maxHeight: 480,
    display: "flex",
    flexDirection: "column",
    borderRadius: 16,
    background: "var(--topbar-dropdown-bg)",
    backdropFilter: "blur(14px)",
    border: "1px solid var(--topbar-dropdown-border)",
    boxShadow: "var(--topbar-dropdown-shadow)",
    zIndex: 50,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 12px",
    borderBottom: "1px solid var(--topbar-chip-border)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 650,
    color: "var(--topbar-dropdown-fg)",
  },
  badge: {
    minWidth: 20,
    height: 20,
    padding: "0 6px",
    borderRadius: 999,
    background: "#ef4444",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  markAllBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    border: "none",
    background: "transparent",
    color: "var(--topbar-icon-color)",
    fontSize: 12,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 8,
  },
  body: {
    overflowY: "auto",
    flex: 1,
    padding: "6px",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "40px 0",
    color: "var(--topbar-icon-color)",
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.6,
  },
  item: {
    position: "relative",
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "10px 10px",
    borderRadius: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.12s",
  },
  itemRead: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemText: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  itemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 650,
    color: "var(--topbar-dropdown-fg)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemTitleRead: {
    fontWeight: 500,
  },
  itemTime: {
    fontSize: 11,
    color: "var(--topbar-icon-color)",
    flexShrink: 0,
    opacity: 0.7,
  },
  itemSub: {
    fontSize: 12,
    color: "var(--topbar-icon-color)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  kindTag: {
    display: "inline-flex",
    alignSelf: "flex-start",
    marginTop: 4,
    padding: "2px 7px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#3b82f6",
    flexShrink: 0,
  },
  footer: {
    borderTop: "1px solid var(--input-border)",
    padding: "10px 12px",
    background: "var(--surface-2)",
    flexShrink: 0,
  },
  viewAllBtn: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--brand-primary)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "background 0.15s",
  },
};
