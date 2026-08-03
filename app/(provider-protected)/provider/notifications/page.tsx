"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/src/lib/providerOpsApi";

export default function ProviderNotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listNotifications({ limit: 100, unreadOnly: tab === "unread" });
      setRows(res.items);
      setUnread(res.unreadCount);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const readOne = async (n: NotificationRow) => {
    if (n.readAt) return;
    try {
      await markNotificationRead(n.id);
      setRows((r) => r.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      toast.success("Marked all as read");
      void load();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const remove = async (n: NotificationRow) => {
    if (!confirm("Delete this notification?")) return;
    try {
      await deleteNotification(n.id);
      setRows((r) => r.filter((x) => x.id !== n.id));
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}>
            <Bell size={20} color="var(--brand-primary)" /> Notifications
            {unread > 0 && <span style={s.badge}>{unread} new</span>}
          </h1>
          <p style={s.sub}>Booking updates, admin messages, payout events, fine alerts.</p>
        </div>
        {unread > 0 && (
          <button style={s.markAllBtn} onClick={readAll}>
            <CheckCheck size={14} /> Mark all as read
          </button>
        )}
      </header>

      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === "all" ? s.tabActive : {}) }} onClick={() => setTab("all")}>All</button>
        <button style={{ ...s.tab, ...(tab === "unread" ? s.tabActive : {}) }} onClick={() => setTab("unread")}>Unread</button>
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={s.empty}>Nothing here. You're all caught up.</div>
      ) : (
        <div style={s.list}>
          {rows.map((n) => (
            <article
              key={n.id}
              style={{ ...s.card, ...(n.readAt ? {} : s.cardUnread) }}
              onClick={() => void readOne(n)}
            >
              <div style={s.rowTop}>
                <strong style={{ fontSize: 14 }}>{n.title}</strong>
                <div style={s.rowActions}>
                  <span style={s.date}>{new Date(n.createdAt).toLocaleString()}</span>
                  <button style={s.iconBtn} title="Delete" onClick={(e) => { e.stopPropagation(); void remove(n); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{n.body}</p>
              {n.event && <span style={s.event}>{n.event}</span>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13 },
  badge: { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "var(--brand-primary)", color: "#022c22" },
  markAllBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  tabs: { display: "flex", gap: 6, borderBottom: "1px solid var(--input-border)" },
  tab: { padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)", borderBottom: "2px solid transparent" },
  tabActive: { color: "var(--brand-primary)", borderBottomColor: "var(--brand-primary)" },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 14, cursor: "pointer" },
  cardUnread: { borderLeft: "3px solid var(--brand-primary)", background: "color-mix(in srgb, var(--brand-primary) 4%, var(--surface-1))" },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  rowActions: { display: "flex", alignItems: "center", gap: 10 },
  date: { fontSize: 11, color: "var(--muted-foreground)" },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4 },
  event: { display: "inline-block", marginTop: 6, padding: "2px 8px", fontSize: 10, background: "var(--surface-2)", borderRadius: 4, color: "var(--muted-foreground)", letterSpacing: 0.5, textTransform: "uppercase" },
};
