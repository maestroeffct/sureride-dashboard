"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, Clock, Receipt, X } from "lucide-react";
import {
  disputeProviderFine,
  listProviderFines,
  type ProviderFineRow,
  type ProviderFineStatus,
} from "@/src/lib/providerOpsApi";

const STATUSES: { value: ProviderFineStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "DISPUTED", label: "Disputed" },
  { value: "WAIVED", label: "Waived" },
];

export default function ProviderFinesPage() {
  const [rows, setRows] = useState<ProviderFineRow[]>([]);
  const [summary, setSummary] = useState({
    totalOutstanding: 0,
    pendingCount: 0,
    overdueCount: 0,
    paidValue: 0,
  });
  const [filter, setFilter] = useState<ProviderFineStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [disputing, setDisputing] = useState<ProviderFineRow | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listProviderFines({ status: filter || undefined, limit: 100 });
      setRows(res.items);
      setSummary(res.summary);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load fines");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={s.page}>
      <header>
        <h1 style={s.title}><Receipt size={20} color="var(--brand-primary)" /> Fines</h1>
        <p style={s.sub}>
          Penalties issued by admin against your account — traffic, late return,
          damage, cleaning, missed pickup. Pay promptly to avoid your fleet
          being suspended.
        </p>
      </header>

      <div style={s.kpiGrid}>
        <Kpi label="Outstanding" value={summary.totalOutstanding.toLocaleString()} tone="#f59e0b" />
        <Kpi label="Pending" value={summary.pendingCount} tone="#f59e0b" />
        <Kpi label="Overdue" value={summary.overdueCount} tone="#ef4444" />
        <Kpi label="Paid (all time)" value={summary.paidValue.toLocaleString()} tone="#22c55e" />
      </div>

      <div style={s.filters}>
        <select style={s.select} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          {STATUSES.map((f) => <option key={f.value || "all"} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={s.empty}>No fines match this view. 🎉</div>
      ) : (
        <div style={s.list}>
          {rows.map((r) => (
            <article key={r.id} style={s.card}>
              <div style={s.cardTop}>
                <div>
                  <strong style={s.amount}>{r.currency} {r.amount.toLocaleString()}</strong>
                  <div style={s.meta}>
                    Issued {new Date(r.createdAt).toLocaleDateString()} by {r.issuedByAdminEmail}
                    {r.booking ? ` · booking ${r.booking.id.slice(0, 8)}` : ""}
                  </div>
                </div>
                <span style={statusStyle(r.status)}>{r.status}</span>
              </div>
              <div style={s.reason}>
                <strong style={{ fontSize: 12, letterSpacing: 0.3 }}>{r.category.replace(/_/g, " ")}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.5 }}>{r.reason}</p>
              </div>
              {r.adminNote ? <div style={s.note}>Admin note: {r.adminNote}</div> : null}
              {r.dueDate && (r.status === "PENDING" || r.status === "OVERDUE") ? (
                <div style={s.due}>
                  <Clock size={12} /> Due {new Date(r.dueDate).toLocaleDateString()}
                </div>
              ) : null}
              {(r.status === "PENDING" || r.status === "OVERDUE") && (
                <div style={s.actions}>
                  <button style={s.disputeBtn} onClick={() => setDisputing(r)}>
                    <AlertTriangle size={13} /> Dispute
                  </button>
                </div>
              )}
              {r.status === "DISPUTED" && (
                <div style={{ ...s.due, color: "#c4b5fd" }}>
                  <CheckCircle2 size={12} /> Dispute submitted — awaiting admin review
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {disputing && (
        <DisputeModal
          fine={disputing}
          onClose={() => setDisputing(null)}
          onDone={() => {
            setDisputing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div style={s.kpi}>
      <span style={s.kpiLabel}>{label}</span>
      <strong style={{ ...s.kpiValue, color: tone }}>{value}</strong>
    </div>
  );
}

function DisputeModal({
  fine, onClose, onDone,
}: {
  fine: ProviderFineRow; onClose: () => void; onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (reason.trim().length < 10) return toast.error("Describe why you're disputing (10+ chars)");
    try {
      setBusy(true);
      await disputeProviderFine(fine.id, reason.trim());
      toast.success("Dispute submitted");
      onDone();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to dispute");
    } finally { setBusy(false); }
  };
  return (
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}>
          <strong>Dispute Fine — {fine.currency} {fine.amount.toLocaleString()}</strong>
          <button style={m.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={m.body}>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 0 }}>
            Admin will review your reason and either uphold or waive the fine.
            Provide as much context as possible.
          </p>
          <textarea
            style={{ ...m.input, height: 120 }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Vehicle was returned on time — attach dashcam footage"
          />
        </div>
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={m.primary} onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit dispute"}</button>
        </div>
      </div>
    </div>
  );
}

function statusStyle(st: ProviderFineStatus): CSSProperties {
  const base: CSSProperties = { padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
  switch (st) {
    case "PAID": return { ...base, background: "rgba(34,197,94,0.14)", color: "#86efac" };
    case "PENDING": return { ...base, background: "rgba(250,204,21,0.14)", color: "#fde68a" };
    case "OVERDUE": return { ...base, background: "rgba(239,68,68,0.14)", color: "#fca5a5" };
    case "DISPUTED": return { ...base, background: "rgba(124,58,237,0.16)", color: "#c4b5fd" };
    case "WAIVED": return { ...base, background: "rgba(148,163,184,0.18)", color: "#cbd5e1" };
  }
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100 },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  kpi: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 4 },
  kpiLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)" },
  kpiValue: { fontSize: 22, fontWeight: 750 },
  filters: { display: "flex", gap: 10 },
  select: { height: 42, minWidth: 160, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 13 },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 10 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  amount: { fontSize: 20, fontWeight: 750 },
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 },
  reason: { padding: 12, background: "var(--surface-2)", borderLeft: "3px solid var(--brand-primary)", borderRadius: 8 },
  note: { fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" },
  due: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fca5a5" },
  actions: { display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--input-border)" },
  disputeBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(239,68,68,0.35)", background: "transparent", color: "#fca5a5" },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 520, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 10 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" as any },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
