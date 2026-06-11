"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminInboxNotification,
} from "@/src/lib/adminNotificationsApi";
import { alertNewNotification } from "@/src/lib/notificationAlerts";

export type NotificationKind =
  | "booking"
  | "provider"
  | "user"
  | "car"
  | "providerRequest"
  | "payment"
  | "payout"
  | "kyc";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  status: string;
  createdAt: string;
  href: string;
};

// Safety-net polling — SSE delivers the real-time push. This polls only
// every 5 minutes to reconcile state if the stream silently dies.
const POLL_MS = 5 * 60 * 1000;

// Where the SSE stream lives. Mirrors NEXT_PUBLIC_API_BASE_URL.
function buildStreamUrl(token: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/admin/notifications/stream?token=${encodeURIComponent(token)}`;
}

// Payload shape from the backend SSE stream
type StreamPayload = {
  id: string;
  userId: string | null;
  providerId: string | null;
  adminId: string | null;
  event: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  createdAt: string;
};

function streamPayloadToInbox(p: StreamPayload): AdminInboxNotification {
  return {
    id: p.id,
    userId: p.userId,
    providerId: p.providerId,
    adminId: p.adminId,
    event: p.event,
    title: p.title,
    body: p.body,
    data: p.data,
    readAt: null,
    createdAt: p.createdAt,
  };
}

// Map dispatcher events → the kind chip that NotificationPanel renders
function kindForEvent(event: string): NotificationKind {
  if (event.startsWith("admin.user")) return "user";
  if (event.startsWith("admin.provider.suspended")) return "provider";
  if (event.startsWith("admin.provider")) return "providerRequest";
  if (event.startsWith("admin.kyc")) return "kyc";
  if (event.startsWith("admin.payment")) return "payment";
  if (event.startsWith("admin.payout")) return "payout";
  if (event.startsWith("user")) return "user";
  if (event.startsWith("provider")) return "provider";
  if (event.startsWith("booking")) return "booking";
  if (event.startsWith("payment")) return "payment";
  if (event.startsWith("payout")) return "payout";
  if (event.startsWith("kyc")) return "kyc";
  return "user";
}

// Map an AdminInboxNotification → the legacy Notification shape the bell expects
function toNotification(item: AdminInboxNotification): Notification {
  const data = item.data ?? {};
  const href =
    typeof data.href === "string"
      ? data.href
      : hrefFallback(kindForEvent(item.event));
  return {
    id: item.id,
    kind: kindForEvent(item.event),
    title: item.title,
    subtitle: item.body,
    status: item.readAt ? "read" : "new",
    createdAt: item.createdAt,
    href,
  };
}

function hrefFallback(kind: NotificationKind): string {
  switch (kind) {
    case "booking": return "/rentals/bookings";
    case "provider":
    case "providerRequest":
      return "/rentals/providers";
    case "user":
    case "kyc":
      return "/rentals/users";
    case "payment":
      return "/rentals/finance";
    case "payout":
      return "/rentals/payouts";
    case "car":
      return "/rentals/cars";
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  // `loading` is only true for the very first fetch — subsequent polls
  // don't flip it back to true, so the panel never flashes "Loading…"
  // after data has appeared.
  const [loading, setLoading] = useState(true);

  // Tracks notification IDs we've already shown alerts for. Both the poller
  // and the SSE handler write into it, so the same notification can't fire
  // twice (e.g. SSE delivered it then the poller refetched).
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Skip alerting on the first load — admins shouldn't get spammed with
  // chimes for old unread notifications when they open the dashboard.
  const isFirstLoadRef = useRef(true);

  // Stable alert helper — used by both the poller and the SSE listener.
  const fireAlert = useCallback((item: AdminInboxNotification) => {
    if (seenIdsRef.current.has(item.id)) return;
    seenIdsRef.current.add(item.id);
    if (isFirstLoadRef.current) return; // seed only on first load

    const href =
      typeof item.data === "object" &&
      item.data &&
      typeof (item.data as { href?: unknown }).href === "string"
        ? (item.data as { href: string }).href
        : "/notifications";

    alertNewNotification({
      title: item.title,
      body: item.body,
      href,
      onVisible: () => {
        toast(item.title, { icon: "🔔", duration: 4500 });
      },
    });
  }, []);

  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await listAdminNotifications({ limit: 30 });
      const mapped = data.items.map(toNotification);
      setNotifications(mapped);
      setUnreadCount(data.unreadCount);
      // Build read set from the items the server says are read
      setReadSet(
        new Set(
          data.items
            .filter((item) => item.readAt !== null)
            .map((item) => item.id),
        ),
      );

      // ── Detect new unread items since last fetch ──────────────────────
      // Reconciles state if the SSE stream missed something. Pre-seed the
      // seen set with read items (so they can't ever trigger a chime).
      const newUnread = data.items.filter(
        (item) => item.readAt === null && !seenIdsRef.current.has(item.id),
      );
      data.items
        .filter((item) => item.readAt !== null)
        .forEach((item) => seenIdsRef.current.add(item.id));

      // Cap alerts — if a backlog arrived at once (backend restart, SSE
      // outage), show one summary toast instead of N chimes.
      if (newUnread.length > 3 && !isFirstLoadRef.current) {
        newUnread.forEach((i) => seenIdsRef.current.add(i.id));
        alertNewNotification({
          title: `${newUnread.length} new notifications`,
          body: newUnread[0].title,
          href: "/notifications",
          onVisible: () => {
            toast(`${newUnread.length} new notifications`, {
              icon: "🔔",
              duration: 4000,
            });
          },
        });
      } else {
        newUnread.forEach(fireAlert);
      }

      isFirstLoadRef.current = false;
    } catch {
      // silently fail — topbar should never hard-error
    } finally {
      // Always flip loading off — covers Strict Mode double-mount, slow
      // first response, errors, anything.
      setLoading(false);
    }
  }, [fireAlert]);

  // Initial load
  useEffect(() => {
    void fetchNotifications(true);
  }, [fetchNotifications]);

  // Polling — silent (doesn't toggle loading)
  useEffect(() => {
    const id = setInterval(() => {
      void fetchNotifications(false);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Refetch when the window regains focus — picks up new notifications
  // instantly when the admin tabs back to the dashboard.
  useEffect(() => {
    const onFocus = () => void fetchNotifications(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchNotifications]);

  // ── SSE real-time stream ────────────────────────────────────────────────
  // Replaces polling for sub-second delivery. The poller stays as a 5-min
  // safety net for reconciliation when the stream silently drops.
  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const token = window.localStorage.getItem("sureride_admin_token")?.trim();
    if (!token) return;
    const url = buildStreamUrl(token);
    if (!url) return;

    const es = new EventSource(url);

    es.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as StreamPayload;
        const inboxItem = streamPayloadToInbox(payload);

        // Prepend to local list (optimistic) — keeps the cap at 30 to match
        // the inbox API's limit, so the panel doesn't grow without bound.
        setNotifications((prev) => [
          toNotification(inboxItem),
          ...prev.filter((n) => n.id !== inboxItem.id),
        ].slice(0, 30));

        // Unread count → just increment; we'll re-sync on the next poll.
        setUnreadCount((c) => c + 1);

        // Fire alert (sound + OS toast / in-page toast)
        fireAlert(inboxItem);
      } catch {
        // malformed event — drop it; poller will recover the state
      }
    });

    // Connection-management: EventSource auto-reconnects, but log dropouts
    // so they're visible in DevTools if something is misconfigured.
    es.onerror = () => {
      // EventSource readyState 2 = CLOSED; 0 = CONNECTING (transient).
      // We don't surface anything to the user — polling covers the gap.
      if (process.env.NODE_ENV !== "production") {
        console.warn("[notifications] SSE error, readyState =", es.readyState);
      }
    };

    return () => {
      es.close();
    };
  }, [fireAlert]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setReadSet((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markAdminNotificationRead(id);
    } catch {
      // Reconcile on next poll if it failed
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic
    setReadSet(new Set(notifications.map((n) => n.id)));
    setUnreadCount(0);
    try {
      await markAllAdminNotificationsRead();
    } catch {
      // Will reconcile on next fetch
    }
  }, [notifications]);

  return {
    notifications,
    readSet,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  };
}
