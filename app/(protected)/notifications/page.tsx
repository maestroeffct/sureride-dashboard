"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  ArrowUpRight,
  Loader2,
  Inbox,
  CalendarCheck,
  Building2,
  ClipboardList,
  UserPlus,
  CreditCard,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  type AdminInboxNotification,
} from "@/src/lib/adminNotificationsApi";

type FilterTab = "all" | "unread";

// ── Event → visual config ───────────────────────────────────────────────────

type EventStyle = { Icon: React.ElementType; color: string; bg: string; label: string };

function eventStyle(event: string): EventStyle {
  if (event.startsWith("admin.user") || event.startsWith("user."))
    return { Icon: UserPlus, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", label: "User" };
  if (event.startsWith("admin.provider.suspended") || event === "provider.suspended")
    return { Icon: Building2, color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Provider" };
  if (event.startsWith("admin.provider") || event.startsWith("provider."))
    return { Icon: ClipboardList, color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Provider" };
  if (event.startsWith("admin.kyc") || event.startsWith("kyc."))
    return { Icon: ShieldCheck, color: "#14b8a6", bg: "rgba(20,184,166,0.12)", label: "KYC" };
  if (event.startsWith("admin.payment") || event.startsWith("payment."))
    return { Icon: CreditCard, color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Payment" };
  if (event.startsWith("admin.payout") || event.startsWith("payout."))
    return { Icon: Wallet, color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Payout" };
  if (event.startsWith("booking."))
    return { Icon: CalendarCheck, color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Booking" };
  return { Icon: Bell, color: "#64748b", bg: "rgba(100,116,139,0.12)", label: "Notification" };
}

// ── Date grouping ───────────────────────────────────────────────────────────

function groupKey(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  if (d >= weekAgo) return "Earlier this week";
  return "Earlier";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function hrefFromNotification(n: AdminInboxNotification): string | null {
  const data = n.data ?? {};
  if (typeof data.href === "string") return data.href;
  return null;
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminInboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<FilterTab>("all");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    try {
      const data = await listAdminNotifications({ limit: 100 });
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "unread") return items.filter((n) => n.readAt === null);
    return items;
  }, [items, tab]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminInboxNotification[]>();
    for (const n of filtered) {
      const key = groupKey(n.createdAt);
      const arr = map.get(key) ?? [];
      arr.push(n);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleOpen = useCallback(
    async (n: AdminInboxNotification) => {
      // Optimistic read
      if (!n.readAt) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        try {
          await markAdminNotificationRead(n.id);
        } catch {
          // reconcile on next load
        }
      }
      const href = hrefFromNotification(n);
      if (href) router.push(href);
    },
    [router],
  );

  const handleToggleRead = useCallback(async (n: AdminInboxNotification) => {
    if (!n.readAt) {
      // Currently unread → mark read
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markAdminNotificationRead(n.id);
      } catch {
        // ignore
      }
    } else {
      // Already read — we don't have an unread endpoint, so just refresh
      toast("Use 'Refresh' to reload", { icon: "ℹ" });
    }
  }, []);

  const handleDelete = useCallback(async (n: AdminInboxNotification) => {
    const ok = window.confirm("Delete this notification? This cannot be undone.");
    if (!ok) return;
    const wasUnread = n.readAt === null;
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await deleteAdminNotification(n.id);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
      void load();
    }
  }, [load]);

  const handleMarkAll = useCallback(async () => {
    if (unreadCount === 0) return;
    setItems((prev) =>
      prev.map((x) =>
        x.readAt ? x : { ...x, readAt: new Date().toISOString() },
      ),
    );
    setUnreadCount(0);
    try {
      const r = await markAllAdminNotificationsRead();
      toast.success(`${r.updated} marked read`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      void load();
    }
  }, [unreadCount, load]);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.titleRow}>
            <Bell size={20} color="var(--brand-primary)" />
            <h1 style={s.title}>Notifications</h1>
            {unreadCount > 0 ? (
              <span style={s.unreadBadge}>{unreadCount}</span>
            ) : null}
          </div>
          <p style={s.subtitle}>
            All platform alerts in one place — signups, KYC submissions, failed payments, and more.
          </p>
        </div>

        <div style={s.headerActions}>
          <button
            style={s.iconBtn}
            onClick={() => void load(true)}
            title="Refresh"
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
            ) : (
              <RefreshCw size={15} />
            )}
          </button>
          <button
            style={{
              ...s.markAllBtn,
              opacity: unreadCount === 0 ? 0.5 : 1,
              cursor: unreadCount === 0 ? "not-allowed" : "pointer",
            }}
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {(["all", "unread"] as FilterTab[]).map((t) => (
          <button
            key={t}
            style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t === "all" ? `All (${items.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={s.body}>
        {loading ? (
          <div style={s.centerState}>
            <Loader2
              size={32}
              color="var(--brand-primary)"
              style={{ animation: "spin 0.8s linear infinite" }}
            />
            <span style={s.centerStateText}>Loading notifications…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.centerState}>
            <Inbox size={40} color="var(--muted-foreground)" strokeWidth={1.5} />
            <p style={s.emptyTitle}>
              {tab === "unread" ? "No unread notifications" : "You're all caught up"}
            </p>
            <p style={s.emptyHint}>
              {tab === "unread"
                ? "Switch to All to see everything in your inbox."
                : "Notifications about signups, bookings, and payments will appear here."}
            </p>
          </div>
        ) : (
          grouped.map(([groupName, groupItems]) => (
            <div key={groupName} style={s.group}>
              <p style={s.groupHeader}>{groupName}</p>
              <div style={s.groupList}>
                {groupItems.map((n) => {
                  const style = eventStyle(n.event);
                  const unread = n.readAt === null;
                  const href = hrefFromNotification(n);
                  return (
                    <div
                      key={n.id}
                      style={{
                        ...s.item,
                        ...(unread ? s.itemUnread : {}),
                      }}
                    >
                      <div style={{ ...s.iconCircle, background: style.bg }}>
                        <style.Icon size={18} color={style.color} />
                      </div>

                      <div style={s.itemBody}>
                        <div style={s.itemTopRow}>
                          <span style={s.itemTitle}>{n.title}</span>
                          <span style={s.itemTime}>{relativeTime(n.createdAt)}</span>
                        </div>
                        <p style={s.itemMessage}>{n.body}</p>
                        <div style={s.itemFooter}>
                          <span style={{ ...s.pill, color: style.color, background: style.bg }}>
                            {style.label}
                          </span>
                          {href ? (
                            <button style={s.linkBtn} onClick={() => void handleOpen(n)}>
                              View {style.label.toLowerCase()}
                              <ArrowUpRight size={12} />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div style={s.itemActions}>
                        {unread ? (
                          <button
                            style={s.actionBtn}
                            title="Mark as read"
                            onClick={() => void handleToggleRead(n)}
                          >
                            <Check size={14} />
                          </button>
                        ) : null}
                        <button
                          style={{ ...s.actionBtn, color: "#ef4444" }}
                          title="Delete"
                          onClick={() => void handleDelete(n)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: {
    height: "100%",
    overflowY: "auto",
    padding: "24px 32px 40px",
    maxWidth: 1080,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 750,
    color: "var(--foreground)",
    letterSpacing: -0.3,
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "var(--muted-foreground)",
    maxWidth: 540,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    padding: "0 7px",
    borderRadius: 11,
    background: "var(--brand-primary)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  headerActions: { display: "flex", gap: 10, alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  markAllBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
  },

  tabs: {
    display: "flex",
    gap: 4,
    padding: 4,
    borderRadius: 10,
    background: "var(--surface-2)",
    width: "fit-content",
  },
  tab: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  },
  tabActive: {
    background: "var(--surface-1)",
    color: "var(--foreground)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },

  body: { display: "flex", flexDirection: "column", gap: 16, minHeight: 200 },

  centerState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "60px 24px",
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
  },
  centerStateText: { fontSize: 13, color: "var(--muted-foreground)" },
  emptyTitle: {
    margin: "8px 0 0",
    fontSize: 16,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  emptyHint: {
    margin: 0,
    fontSize: 13,
    color: "var(--muted-foreground)",
    maxWidth: 380,
    textAlign: "center",
    lineHeight: 1.55,
  },

  group: { display: "flex", flexDirection: "column", gap: 8 },
  groupHeader: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "var(--muted-foreground)",
    padding: "0 4px",
  },
  groupList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  item: {
    display: "flex",
    gap: 14,
    padding: "16px 18px",
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    alignItems: "flex-start",
    transition: "background 0.15s",
  },
  itemUnread: {
    background: "color-mix(in srgb, var(--brand-primary) 4%, var(--surface-1))",
    borderColor: "color-mix(in srgb, var(--brand-primary) 25%, var(--input-border))",
  },

  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  itemBody: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 },
  itemTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--foreground)",
  },
  itemTime: {
    fontSize: 11,
    color: "var(--muted-foreground)",
    flexShrink: 0,
  },
  itemMessage: {
    margin: 0,
    fontSize: 13,
    color: "var(--muted-foreground)",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  itemFooter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  pill: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 999,
  },
  linkBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "transparent",
    border: "none",
    color: "var(--brand-primary)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: 0,
  },

  itemActions: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
