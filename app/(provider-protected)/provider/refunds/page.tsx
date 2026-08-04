"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, CircleDollarSign, Clock, RotateCcw, X, XCircle } from "lucide-react";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";
import {
  listRefunds,
  respondRefund,
  type RefundRow,
  type RefundStatus,
} from "@/src/lib/providerOpsApi";

const FILTERS: { value: RefundStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAID", label: "Paid" },
];

export default function RefundsPage() {
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [status, setStatus] = useState<RefundStatus | "">("PENDING");
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<{ row: RefundRow; decision: "APPROVED" | "REJECTED" } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listRefunds({ status: status || undefined });
      setRows(res.items);
    } catch (e: any) { toast.error(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const kpi = useMemo(() => {
    let pending = 0, approvedValue = 0, rejected = 0, paidValue = 0;
    for (const r of rows) {
      if (r.status === "PENDING") pending += 1;
      if (r.status === "APPROVED") approvedValue += r.amount;
      if (r.status === "REJECTED") rejected += 1;
      if (r.status === "PAID") paidValue += r.amount;
    }
    return { pending, approvedValue, rejected, paidValue };
  }, [rows]);

  return (
    <div style={s.page}>
      <header>
        <h1 style={s.title}><RotateCcw size={20} color="var(--brand-primary)" /> Refund Requests</h1>
        <p style={s.sub}>Customers can request a refund after a rental. Approve or reject with a written response — admin has final override.</p>
      </header>

      <KpiGrid>
        <KpiCard label="Pending" value={kpi.pending} subtext="Awaiting your response" icon={<Clock size={18} />} tone="#f59e0b" />
        <KpiCard label="Approved (value)" value={`₦${kpi.approvedValue.toLocaleString()}`} subtext="Awaiting refund payout" icon={<CheckCircle2 size={18} />} tone="#22c55e" />
        <KpiCard label="Paid Out" value={`₦${kpi.paidValue.toLocaleString()}`} subtext="Refunded to customers" icon={<CircleDollarSign size={18} />} tone="var(--brand-primary)" />
        <KpiCard label="Rejected" value={kpi.rejected} subtext="Denied by you" icon={<XCircle size={18} />} tone="#ef4444" />
      </KpiGrid>

      <div style={s.filters}>
        <select style={s.select} value={status} onChange={(e) => setStatus(e.target.value as any)}>
          {FILTERS.map((f) => <option key={f.value || "all"} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {loading ? <div style={s.empty}>Loading…</div>
        : rows.length === 0 ? <div style={s.empty}>No refund requests in this view.</div>
        : (
          <div style={s.list}>
            {rows.map((r) => (
              <article key={r.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <strong>{r.user.firstName} {r.user.lastName}</strong>
                    <div style={s.meta}>{r.user.email} · booking {r.booking.id.slice(0, 8)} · {r.booking.car.brand} {r.booking.car.model}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: 18 }}>{r.currency} {r.amount.toLocaleString()}</strong>
                    <div style={statusStyle(r.status)}>{r.status}</div>
                  </div>
                </div>
                <div style={s.reason}><strong style={{ fontSize: 12 }}>Reason</strong><p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.5 }}>{r.reason}</p></div>
                {r.providerResponse && <div style={s.res}>Your response: {r.providerResponse}</div>}
                {r.adminNote && <div style={{ ...s.res, color: "#fde68a" }}>Admin note: {r.adminNote}</div>}
                {r.status === "PENDING" && (
                  <div style={s.actions}>
                    <button style={{ ...s.btn, ...s.reject }} onClick={() => setResponding({ row: r, decision: "REJECTED" })}><XCircle size={13} /> Reject</button>
                    <button style={{ ...s.btn, ...s.approve }} onClick={() => setResponding({ row: r, decision: "APPROVED" })}><CheckCircle2 size={13} /> Approve</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

      {responding && (
        <RespondModal
          row={responding.row}
          decision={responding.decision}
          onClose={() => setResponding(null)}
          onDone={() => { setResponding(null); void load(); }}
        />
      )}
    </div>
  );
}

function RespondModal({
  row, decision, onClose, onDone,
}: { row: RefundRow; decision: "APPROVED" | "REJECTED"; onClose: () => void; onDone: () => void }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (msg.trim().length < 3) return toast.error("Explain your decision");
    try {
      setBusy(true);
      await respondRefund(row.id, decision, msg.trim());
      toast.success(`Refund ${decision.toLowerCase()}`);
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}><strong>{decision === "APPROVED" ? "Approve" : "Reject"} refund — {row.currency} {row.amount.toLocaleString()}</strong><button style={m.close} onClick={onClose}><X size={16} /></button></div>
        <div style={m.body}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>Customer will see your response. Admin may override.</p>
          <textarea style={{ ...m.input, height: 100 }} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={decision === "APPROVED" ? "e.g. Approved — refund will be issued to your card within 3 business days." : "e.g. Rejected — the vehicle was returned in the same condition it was delivered."} />
        </div>
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={m.primary} onClick={submit} disabled={busy}>{busy ? "Sending…" : `Confirm ${decision.toLowerCase()}`}</button>
        </div>
      </div>
    </div>
  );
}

function statusStyle(st: RefundStatus): CSSProperties {
  const base: CSSProperties = { display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginTop: 4 };
  const map: Record<RefundStatus, [string, string]> = {
    PENDING: ["rgba(250,204,21,0.14)", "#fde68a"],
    APPROVED: ["rgba(34,197,94,0.14)", "#86efac"],
    REJECTED: ["rgba(239,68,68,0.14)", "#fca5a5"],
    PAID: ["rgba(34,197,94,0.18)", "#86efac"],
  };
  const [bg, color] = map[st];
  return { ...base, background: bg, color };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1100 },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  filters: { display: "flex", gap: 10 },
  select: { height: 42, minWidth: 180, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 13 },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  reason: { padding: 10, background: "var(--surface-2)", borderRadius: 8 },
  res: { fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" },
  actions: { display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--input-border)" },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid" },
  approve: { background: "var(--brand-primary)", color: "#022c22", border: "none" },
  reject: { borderColor: "rgba(239,68,68,0.35)", color: "#fca5a5", background: "transparent" },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 560, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" as any },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
