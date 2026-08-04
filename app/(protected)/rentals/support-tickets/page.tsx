"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Search,
  Send,
  X,
} from "lucide-react";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";
import {
  getAdminSupportTicket,
  listAdminSupportTickets,
  postAdminSupportMessage,
  type AdminSupportMessage,
  type AdminSupportRow,
  type AdminSupportRowWithThread,
  type SupportStatus,
} from "@/src/lib/adminSupportApi";

const STATUS_OPTIONS: { value: SupportStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "ANSWERED", label: "Answered" },
  { value: "CLOSED", label: "Closed" },
];

const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT: "Account",
  PAYOUTS: "Payouts",
  BOOKINGS: "Bookings",
  DOCUMENTS: "Documents",
  TECHNICAL: "Technical",
  OTHER: "Other",
};

export default function AdminSupportTicketsPage() {
  const [rows, setRows] = useState<AdminSupportRow[]>([]);
  const [status, setStatus] = useState<SupportStatus | "">("OPEN");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState<AdminSupportRow | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAdminSupportTickets({ status: status || undefined });
      setRows(res.items);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.subject, r.message, r.provider?.name, r.provider?.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term)),
    );
  }, [rows, search]);

  const kpi = useMemo(() => {
    let open = 0, answered = 0, closed = 0;
    for (const r of rows) {
      if (r.status === "OPEN") open += 1;
      else if (r.status === "ANSWERED") answered += 1;
      else if (r.status === "CLOSED") closed += 1;
    }
    return { open, answered, closed, total: rows.length };
  }, [rows]);

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}>
            <MessageSquare size={22} color="var(--brand-primary)" /> Support Tickets
          </h1>
          <p style={s.sub}>
            Providers open tickets from their portal. Replies go back into
            their inbox and email them automatically — every conversation is
            preserved on this page.
          </p>
        </div>
      </header>

      <KpiGrid>
        <KpiCard label="Open" value={kpi.open} subtext="Awaiting first reply" icon={<Clock size={18} />} tone="#f59e0b" />
        <KpiCard label="Answered" value={kpi.answered} subtext="You replied — awaiting close" icon={<CheckCircle2 size={18} />} tone="#22c55e" />
        <KpiCard label="Closed" value={kpi.closed} subtext="Resolved conversations" icon={<CheckCircle2 size={18} />} tone="#94a3b8" />
        <KpiCard label="Total" value={kpi.total} subtext="In current filter" icon={<MessageSquare size={18} />} tone="var(--brand-primary)" />
      </KpiGrid>

      <div style={s.filtersRow}>
        <div style={s.searchBox}>
          <Search size={16} color="var(--fg-60)" />
          <input
            style={s.searchInput}
            placeholder="Search subject, message, provider…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select style={s.select} value={status} onChange={(e) => setStatus(e.target.value as any)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value || "all"} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div style={bookingsTableTheme.card}>
        <div style={bookingsTableTheme.tableWrap}>
          <table style={bookingsTableTheme.table}>
            <thead>
              <tr style={bookingsTableTheme.theadRow}>
                <th style={bookingsTableTheme.th}>Ticket</th>
                <th style={bookingsTableTheme.th}>Provider</th>
                <th style={bookingsTableTheme.th}>Category</th>
                <th style={bookingsTableTheme.th}>Opened</th>
                <th style={bookingsTableTheme.th}>Status</th>
                <th style={bookingsTableTheme.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={s.emptyCell}>Loading tickets…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <div style={s.emptyState}>
                      <div style={s.emptyIcon}><MessageSquare size={22} color="var(--muted-foreground)" /></div>
                      <strong style={{ fontSize: 15 }}>No tickets in this view</strong>
                      <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "6px 0 0" }}>
                        Providers open tickets from Help & Support in the provider portal.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} style={bookingsTableTheme.tr}>
                    <td style={bookingsTableTheme.td}>
                      <div style={bookingsTableTheme.twoLine}>
                        <span style={bookingsTableTheme.primaryText}>{r.subject}</span>
                        <span style={{ ...bookingsTableTheme.secondaryText, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message}</span>
                      </div>
                    </td>
                    <td style={bookingsTableTheme.td}>
                      <div style={bookingsTableTheme.twoLine}>
                        <span style={bookingsTableTheme.primaryText}>{r.provider.name}</span>
                        <span style={bookingsTableTheme.secondaryText}>{r.provider.email}</span>
                      </div>
                    </td>
                    <td style={bookingsTableTheme.td}>{CATEGORY_LABELS[r.category] ?? r.category}</td>
                    <td style={bookingsTableTheme.td}>{new Date(r.createdAt).toLocaleString()}</td>
                    <td style={bookingsTableTheme.td}><span style={statusPill(r.status)}>{r.status}</span></td>
                    <td style={bookingsTableTheme.tdRight}>
                      <button
                        style={{ ...bookingsTableTheme.iconBtn, cursor: "pointer", padding: "0 14px", width: "auto" }}
                        onClick={() => setReplying(r)}
                        title={r.status === "OPEN" ? "Reply" : "View conversation"}
                      >
                        {r.status === "OPEN" ? <><Send size={13} /> <span style={{ marginLeft: 6, fontSize: 12 }}>Reply</span></> : <span style={{ fontSize: 12 }}>View</span>}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {replying && (
        <ReplyModal
          ticket={replying}
          onClose={() => setReplying(null)}
          onDone={() => { setReplying(null); void load(); }}
        />
      )}
    </div>
  );
}

function ReplyModal({ ticket: initial, onClose, onDone }: {
  ticket: AdminSupportRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [ticket, setTicket] = useState<AdminSupportRowWithThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminSupportTicket(initial.id);
      setTicket(res.ticket);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [initial.id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [ticket?.messages.length]);

  const send = async () => {
    if (reply.trim().length < 1) return;
    try {
      setSending(true);
      const res = await postAdminSupportMessage(initial.id, reply.trim());
      setTicket(res.ticket);
      setReply("");
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Failed to send"); }
    finally { setSending(false); }
  };

  const canSend = ticket?.status !== "CLOSED";

  return (
    <div style={t.backdrop} onClick={() => !sending && onClose()}>
      <div style={t.card} onClick={(e) => e.stopPropagation()}>
        <div style={t.header}>
          <div>
            <strong style={{ fontSize: 16 }}>{initial.subject}</strong>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
              {initial.provider.name} · {initial.provider.email} · opened {new Date(initial.createdAt).toLocaleString()}
            </div>
          </div>
          <button style={t.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={t.thread} ref={scrollRef}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>Loading…</div>
          ) : ticket?.messages.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>No messages yet.</div>
          ) : (
            ticket?.messages.map((msg) => <Bubble key={msg.id} m={msg} />)
          )}
        </div>
        {canSend ? (
          <div style={t.composer}>
            <textarea
              style={t.input}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your response — provider sees it in Help & Support + gets emailed."
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button style={t.sendBtn} disabled={sending || reply.trim().length < 1} onClick={() => void send()}>
              <Send size={14} /> {sending ? "Sending…" : "Send"}
            </button>
          </div>
        ) : (
          <div style={{ padding: 16, textAlign: "center", color: "var(--muted-foreground)", borderTop: "1px solid var(--input-border)", fontSize: 13 }}>
            This ticket is closed.
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ m }: { m: AdminSupportMessage }) {
  const mine = m.author === "ADMIN";
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <div style={{ maxWidth: "80%" }}>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", textAlign: mine ? "right" : "left", marginBottom: 4 }}>
          {mine ? "You (admin)" : m.authorName ?? m.authorEmail ?? "Provider"} · {new Date(m.createdAt).toLocaleString()}
        </div>
        <div style={{
          padding: "10px 14px",
          borderRadius: 12,
          background: mine ? "var(--brand-primary)" : "var(--surface-2)",
          color: mine ? "#022c22" : "var(--foreground)",
          fontSize: 14,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          borderBottomRightRadius: mine ? 4 : 12,
          borderBottomLeftRadius: mine ? 12 : 4,
        }}>
          {m.body}
        </div>
      </div>
    </div>
  );
}

function statusPill(st: SupportStatus): CSSProperties {
  const base: CSSProperties = { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
  const map: Record<SupportStatus, [string, string]> = {
    OPEN: ["rgba(250,204,21,0.14)", "#fde68a"],
    ANSWERED: ["rgba(34,197,94,0.14)", "#86efac"],
    CLOSED: ["rgba(148,163,184,0.18)", "#cbd5e1"],
  };
  const [bg, color] = map[st];
  return { ...base, background: bg, color };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1400 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.4, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  filtersRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  searchBox: { flex: "1 1 320px", minWidth: 280, height: 44, borderRadius: 12, border: "1px solid var(--glass-08)", background: "var(--glass-04)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--foreground)", fontSize: 14, height: "100%" },
  select: { height: 44, minWidth: 160, padding: "0 12px", borderRadius: 12, border: "1px solid var(--glass-08)", background: "var(--glass-04)", color: "var(--foreground)", fontSize: 13 },
  emptyCell: { padding: 30, textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 },
  emptyState: { padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  emptyIcon: { width: 60, height: 60, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 620, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 22px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 22, display: "flex", flexDirection: "column", gap: 14 },
  label: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" as any },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};

const t: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card: { width: "100%", maxWidth: 700, height: "min(760px, 90vh)", background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 22px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  thread: { flex: 1, overflowY: "auto", padding: "18px 22px", background: "color-mix(in srgb, var(--surface-2) 60%, transparent)" },
  composer: { display: "flex", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--input-border)", background: "var(--surface-1)" },
  input: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none" as any, minHeight: 44 },
  sendBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
