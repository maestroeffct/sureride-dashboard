"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, HelpCircle, MessageSquare, Plus, X } from "lucide-react";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";
import {
  closeSupportTicket,
  createSupportTicket,
  listSupportTickets,
  type SupportCategory,
  type SupportRow,
  type SupportStatus,
} from "@/src/lib/providerOpsApi";

const CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "ACCOUNT", label: "Account" },
  { value: "PAYOUTS", label: "Payouts" },
  { value: "BOOKINGS", label: "Bookings" },
  { value: "DOCUMENTS", label: "Documents / verification" },
  { value: "TECHNICAL", label: "Technical issue" },
  { value: "OTHER", label: "Other" },
];

const FAQ = [
  { q: "How long do payouts take?", a: "Payouts are processed within 3 business days after admin approves your request. The bank transfer itself takes 1–3 additional days depending on your bank." },
  { q: "What happens if I dispute a fine?", a: "Admin will review your dispute. If upheld, the fine is waived. If not, it becomes payable again and may go overdue." },
  { q: "Can I temporarily block a car?", a: "Yes — use the Availability page to block a car for owner use, maintenance, or paperwork issues. Blocks stop new bookings but keep the car in your fleet." },
  { q: "My insurance is expiring. What now?", a: "Update the Insurance section with the new policy details before the expiry date. Cars with lapsed insurance are automatically hidden from customer search." },
];

export default function SupportPage() {
  const [rows, setRows] = useState<SupportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<SupportStatus | "">("");

  const load = useCallback(async () => {
    try { setLoading(true); setRows((await listSupportTickets({ status: filter || undefined })).items); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);

  const close = async (id: string) => {
    if (!confirm("Close this ticket?")) return;
    try { await closeSupportTicket(id); void load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const kpi = useMemo(() => {
    let open = 0, answered = 0, closed = 0;
    for (const r of rows) {
      if (r.status === "OPEN") open += 1;
      else if (r.status === "ANSWERED") answered += 1;
      else if (r.status === "CLOSED") closed += 1;
    }
    // Average admin response time in hours for answered tickets.
    const answeredWithReply = rows.filter((r) => r.adminReplyAt);
    const avgHrs = answeredWithReply.length
      ? Math.round(
          answeredWithReply.reduce(
            (acc, r) =>
              acc +
              (new Date(r.adminReplyAt!).getTime() - new Date(r.createdAt).getTime()) /
                (1000 * 60 * 60),
            0,
          ) / answeredWithReply.length,
        )
      : null;
    return { open, answered, closed, total: rows.length, avgHrs };
  }, [rows]);

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}><HelpCircle size={20} color="var(--brand-primary)" /> Help &amp; Support</h1>
          <p style={s.sub}>Common questions below. If you can't find your answer, open a ticket — admin responds within 24 hours on business days.</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpen(true)}><Plus size={15} /> New ticket</button>
      </header>

      <KpiGrid>
        <KpiCard label="Open" value={kpi.open} subtext="Awaiting admin reply" icon={<Clock size={18} />} tone="#f59e0b" />
        <KpiCard label="Answered" value={kpi.answered} subtext="Admin replied — awaiting your close" icon={<CheckCircle2 size={18} />} tone="#22c55e" />
        <KpiCard label="Closed" value={kpi.closed} subtext="Resolved conversations" icon={<MessageSquare size={18} />} tone="#94a3b8" />
        <KpiCard label="Avg Response" value={kpi.avgHrs != null ? `${kpi.avgHrs}h` : "—"} subtext="First reply time" icon={<Clock size={18} />} tone="var(--brand-primary)" />
      </KpiGrid>

      <section>
        <h2 style={s.h2}>Frequently asked</h2>
        <div style={s.faqGrid}>
          {FAQ.map((f) => (
            <details key={f.q} style={s.faq}>
              <summary style={s.faqQ}>{f.q}</summary>
              <p style={s.faqA}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <div style={s.subHead}>
          <h2 style={s.h2}><MessageSquare size={16} /> Your tickets</h2>
          <select style={s.select} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="ANSWERED">Answered</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        {loading ? <div style={s.empty}>Loading…</div>
          : rows.length === 0 ? <div style={s.empty}>No tickets yet.</div>
          : (
            <div style={s.list}>
              {rows.map((t) => (
                <article key={t.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div>
                      <strong>{t.subject}</strong>
                      <div style={s.meta}>{CATEGORIES.find((c) => c.value === t.category)?.label} · opened {new Date(t.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style={statusStyle(t.status)}>{t.status}</span>
                  </div>
                  <p style={{ margin: 0, padding: 10, background: "var(--surface-2)", borderRadius: 8, fontSize: 13, lineHeight: 1.5 }}>{t.message}</p>
                  {t.adminReply && (
                    <div style={s.reply}>
                      <strong style={{ fontSize: 12 }}>Support reply · {t.adminReplyBy ?? "admin"} · {t.adminReplyAt ? new Date(t.adminReplyAt).toLocaleString() : ""}</strong>
                      <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5 }}>{t.adminReply}</p>
                    </div>
                  )}
                  {t.status !== "CLOSED" && (
                    <div style={s.actions}>
                      <button style={s.linkBtn} onClick={() => void close(t.id)}>Close ticket</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
      </section>

      {open && <NewTicket onClose={() => setOpen(false)} onDone={() => { setOpen(false); void load(); }} />}
    </div>
  );
}

function NewTicket({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportCategory>("OTHER");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (subject.trim().length < 3) return toast.error("Subject required");
    if (message.trim().length < 10) return toast.error("Message must be 10+ chars");
    try { setBusy(true); await createSupportTicket({ subject: subject.trim(), message: message.trim(), category }); toast.success("Ticket sent"); onDone(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}><strong>New support ticket</strong><button style={m.close} onClick={onClose}><X size={16} /></button></div>
        <div style={m.body}>
          <label style={m.label}>Subject</label>
          <input style={m.input} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <label style={m.label}>Category</label>
          <select style={m.input} value={category} onChange={(e) => setCategory(e.target.value as SupportCategory)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <label style={m.label}>Message</label>
          <textarea style={{ ...m.input, height: 140 }} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={m.primary} onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send"}</button>
        </div>
      </div>
    </div>
  );
}

function statusStyle(st: SupportStatus): CSSProperties {
  const base: CSSProperties = { padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
  const map: Record<SupportStatus, [string, string]> = {
    OPEN: ["rgba(250,204,21,0.14)", "#fde68a"],
    ANSWERED: ["rgba(34,197,94,0.14)", "#86efac"],
    CLOSED: ["rgba(148,163,184,0.18)", "#cbd5e1"],
  };
  const [bg, color] = map[st];
  return { ...base, background: bg, color };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1000 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  h2: { margin: "0 0 12px", fontSize: 15, fontWeight: 700, display: "inline-flex", gap: 8, alignItems: "center" },
  subHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  select: { height: 38, minWidth: 140, padding: "0 10px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 12 },
  faqGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 10 },
  faq: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 10, padding: 14 },
  faqQ: { cursor: "pointer", fontWeight: 600, fontSize: 13 },
  faqA: { margin: "10px 0 0", color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.55 },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  reply: { padding: 12, background: "color-mix(in srgb, var(--brand-primary) 8%, var(--surface-2))", borderRadius: 8, borderLeft: "3px solid var(--brand-primary)" },
  actions: { display: "flex", justifyContent: "flex-end" },
  linkBtn: { background: "transparent", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: 12, textDecoration: "underline" },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 540, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" as any },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
