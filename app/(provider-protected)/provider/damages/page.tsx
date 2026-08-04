"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { AlertOctagon, CheckCircle2, CircleDollarSign, Clock, Plus, X } from "lucide-react";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";
import {
  createDamage,
  listDamages,
  type DamageClaimRow,
  type DamageClaimStatus,
} from "@/src/lib/providerOpsApi";
import { listProviderBookings } from "@/src/lib/providerApi";

type BookingLite = {
  id: string;
  pickupAt: string;
  returnAt: string;
  car?: { brand: string; model: string; licensePlate?: string | null };
  user?: { firstName: string; lastName: string; email: string };
};

const STATUS_FILTERS: { value: DamageClaimStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function DamagesPage() {
  const [rows, setRows] = useState<DamageClaimRow[]>([]);
  const [status, setStatus] = useState<DamageClaimStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listDamages({ status: status || undefined });
      setRows(res.items);
    } catch (e: any) { toast.error(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const kpi = useMemo(() => {
    let open = 0, approvedValue = 0, paidValue = 0, rejected = 0;
    for (const r of rows) {
      if (r.status === "OPEN" || r.status === "UNDER_REVIEW") open += 1;
      if (r.status === "APPROVED") approvedValue += r.estimatedCost;
      if (r.status === "PAID") paidValue += r.estimatedCost;
      if (r.status === "REJECTED") rejected += 1;
    }
    return { total: rows.length, open, approvedValue, paidValue, rejected };
  }, [rows]);

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}><AlertOctagon size={20} color="var(--brand-primary)" /> Damage Claims</h1>
          <p style={s.sub}>Log damage to a vehicle discovered after a rental. Admin reviews the claim and may convert it into a fine against the customer.</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpen(true)}><Plus size={15} /> File claim</button>
      </header>

      <KpiGrid>
        <KpiCard label="Open Claims" value={kpi.open} subtext="Awaiting admin review" icon={<Clock size={18} />} tone="#f59e0b" />
        <KpiCard label="Approved Value" value={`₦${kpi.approvedValue.toLocaleString()}`} subtext="Awaiting payout" icon={<CheckCircle2 size={18} />} tone="#22c55e" />
        <KpiCard label="Paid Value" value={`₦${kpi.paidValue.toLocaleString()}`} subtext="Recovered from customers" icon={<CircleDollarSign size={18} />} tone="var(--brand-primary)" />
        <KpiCard label="Rejected" value={kpi.rejected} subtext={`of ${kpi.total} total`} icon={<AlertOctagon size={18} />} tone="#ef4444" />
      </KpiGrid>

      <div style={s.filters}>
        <select style={s.select} value={status} onChange={(e) => setStatus(e.target.value as any)}>
          {STATUS_FILTERS.map((f) => <option key={f.value || "all"} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {loading ? <div style={s.empty}>Loading…</div>
        : rows.length === 0 ? <div style={s.empty}>No damage claims. Good driving!</div>
        : (
          <div style={s.list}>
            {rows.map((r) => (
              <article key={r.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <strong>{r.booking.car.brand} {r.booking.car.model}</strong>
                    <div style={s.meta}>
                      {r.booking.user ? `${r.booking.user.firstName} ${r.booking.user.lastName} · ${r.booking.user.email}` : "—"}
                      {` · returned ${new Date(r.booking.returnAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: 18 }}>{r.currency} {r.estimatedCost.toLocaleString()}</strong>
                    <div style={statusStyle(r.status)}>{r.status.replace(/_/g, " ")}</div>
                  </div>
                </div>
                <p style={s.desc}>{r.description}</p>
                {r.resolutionNote && <div style={s.res}>Resolution: {r.resolutionNote}</div>}
                {r.fine && <div style={{ ...s.res, color: "#fde68a" }}>Fine issued: {r.fine.amount.toLocaleString()} · {r.fine.status}</div>}
              </article>
            ))}
          </div>
        )}

      {open && <NewClaimModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); void load(); }} />}
    </div>
  );
}

function NewClaimModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [bookings, setBookings] = useState<BookingLite[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listProviderBookings({ status: "COMPLETED", limit: 100 })
      .then((r) => setBookings(r.items as any))
      .catch(() => setBookings([]));
  }, []);

  const submit = async () => {
    if (!bookingId) return toast.error("Pick a booking");
    const cost = Number(estimatedCost);
    if (!cost || cost <= 0) return toast.error("Estimated cost required");
    if (description.trim().length < 10) return toast.error("Describe the damage (10+ chars)");
    try {
      setBusy(true);
      await createDamage({ bookingId, description: description.trim(), estimatedCost: cost });
      toast.success("Claim filed");
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}><strong>File damage claim</strong><button style={m.close} onClick={onClose}><X size={16} /></button></div>
        <div style={m.body}>
          <label style={m.label}>Booking</label>
          <select style={m.input} value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
            <option value="">Select a completed rental…</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.car ? `${b.car.brand} ${b.car.model}` : "—"} · {new Date(b.pickupAt).toLocaleDateString()} → {new Date(b.returnAt).toLocaleDateString()} · {b.user?.firstName ?? "—"}
              </option>
            ))}
          </select>
          <label style={m.label}>Estimated cost (NGN)</label>
          <input style={m.input} type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
          <label style={m.label}>Description</label>
          <textarea style={{ ...m.input, height: 100 }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dent on passenger door, ~30cm. Scratched paintwork on rear bumper." />
        </div>
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={m.primary} onClick={submit} disabled={busy}>{busy ? "Filing…" : "File claim"}</button>
        </div>
      </div>
    </div>
  );
}

function statusStyle(st: DamageClaimStatus): CSSProperties {
  const base: CSSProperties = { display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginTop: 4 };
  const map: Record<DamageClaimStatus, [string, string]> = {
    OPEN: ["rgba(250,204,21,0.14)", "#fde68a"],
    UNDER_REVIEW: ["rgba(59,130,246,0.14)", "#93c5fd"],
    APPROVED: ["rgba(34,197,94,0.14)", "#86efac"],
    PAID: ["rgba(34,197,94,0.18)", "#86efac"],
    REJECTED: ["rgba(239,68,68,0.14)", "#fca5a5"],
    CANCELLED: ["rgba(148,163,184,0.18)", "#cbd5e1"],
  };
  const [bg, color] = map[st];
  return { ...base, background: bg, color };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1100 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  filters: { display: "flex", gap: 10 },
  select: { height: 42, minWidth: 180, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 13 },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  desc: { margin: 0, padding: 10, background: "var(--surface-2)", borderRadius: 8, fontSize: 13, lineHeight: 1.5 },
  res: { fontSize: 12, color: "var(--muted-foreground)" },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 560, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit" },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
