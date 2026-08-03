"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { CalendarClock, Plus, Trash2, X } from "lucide-react";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  listAvailability,
  type UnavailabilityReason,
  type UnavailabilityRow,
} from "@/src/lib/providerOpsApi";
import { listProviderCars } from "@/src/lib/providerApi";

type CarLite = { id: string; brand: string; model: string; licensePlate?: string | null };

const REASONS: { value: UnavailabilityReason; label: string }[] = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OWNER_USE", label: "Owner using car" },
  { value: "INSURANCE_LAPSE", label: "Insurance lapsed" },
  { value: "OTHER", label: "Other" },
];

export default function AvailabilityPage() {
  const [rows, setRows] = useState<UnavailabilityRow[]>([]);
  const [cars, setCars] = useState<CarLite[]>([]);
  const [carFilter, setCarFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [blocks, carsRes] = await Promise.all([
        listAvailability({ carId: carFilter || undefined }),
        listProviderCars({ limit: 500 }),
      ]);
      setRows(blocks.items);
      setCars(carsRes.items ?? []);
    } catch (e: any) { toast.error(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, [carFilter]);

  useEffect(() => { void load(); }, [load]);

  const remove = async (r: UnavailabilityRow) => {
    if (!confirm("Remove this block? The car will be bookable again in this window.")) return;
    try { await deleteAvailabilityBlock(r.id); toast.success("Removed"); void load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}><CalendarClock size={20} color="var(--brand-primary)" /> Availability</h1>
          <p style={s.sub}>Block a car for a period — service, personal use, expired paperwork. Blocks prevent bookings but don't hide the car from your fleet.</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpen(true)}><Plus size={15} /> New block</button>
      </header>

      <div style={s.filters}>
        <select style={s.select} value={carFilter} onChange={(e) => setCarFilter(e.target.value)}>
          <option value="">All cars</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.licensePlate ?? "no plate"}</option>)}
        </select>
      </div>

      {loading ? <div style={s.empty}>Loading…</div>
        : rows.length === 0 ? <div style={s.empty}>No blocks. All cars are bookable in the visible window.</div>
        : (
          <div style={s.list}>
            {rows.map((r) => (
              <article key={r.id} style={s.card}>
                <div style={s.left}>
                  <strong>{r.car.brand} {r.car.model}</strong>
                  <div style={s.meta}>{r.car.licensePlate ?? "no plate"}</div>
                </div>
                <div style={s.mid}>
                  <div><strong>{new Date(r.startAt).toLocaleDateString()}</strong> → <strong>{new Date(r.endAt).toLocaleDateString()}</strong></div>
                  <span style={s.badge(r.reason)}>{REASONS.find((x) => x.value === r.reason)?.label ?? r.reason}</span>
                </div>
                <div style={s.right}>
                  {r.note && <div style={s.note}>{r.note}</div>}
                  <button style={s.iconBtn} onClick={() => void remove(r)}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        )}

      {open && <BlockModal cars={cars} onClose={() => setOpen(false)} onDone={() => { setOpen(false); void load(); }} />}
    </div>
  );
}

function BlockModal({ cars, onClose, onDone }: { cars: CarLite[]; onClose: () => void; onDone: () => void }) {
  const [carId, setCarId] = useState("");
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 10));
  const [endAt, setEndAt] = useState("");
  const [reason, setReason] = useState<UnavailabilityReason>("OTHER");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!carId) return toast.error("Pick a car");
    if (!endAt) return toast.error("End date required");
    try {
      setBusy(true);
      await createAvailabilityBlock({ carId, startAt, endAt, reason, note: note || undefined });
      toast.success("Block created");
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div style={mo.backdrop} onClick={() => !busy && onClose()}>
      <div style={mo.card} onClick={(e) => e.stopPropagation()}>
        <div style={mo.header}><strong>Block car dates</strong><button style={mo.close} onClick={onClose}><X size={16} /></button></div>
        <div style={mo.body}>
          <label style={mo.label}>Car</label>
          <select style={mo.input} value={carId} onChange={(e) => setCarId(e.target.value)}>
            <option value="">Select…</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.licensePlate ?? "no plate"}</option>)}
          </select>
          <div style={mo.grid2}>
            <div><label style={mo.label}>From</label><input style={mo.input} type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></div>
            <div><label style={mo.label}>To</label><input style={mo.input} type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></div>
          </div>
          <label style={mo.label}>Reason</label>
          <select style={mo.input} value={reason} onChange={(e) => setReason(e.target.value as UnavailabilityReason)}>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <label style={mo.label}>Note (optional)</label>
          <input style={mo.input} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div style={mo.footer}>
          <button style={mo.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={mo.primary} onClick={submit} disabled={busy}>{busy ? "Blocking…" : "Block"}</button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1100 } as CSSProperties,
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" } as CSSProperties,
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" } as CSSProperties,
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 } as CSSProperties,
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" } as CSSProperties,
  filters: { display: "flex", gap: 10 } as CSSProperties,
  select: { height: 42, minWidth: 220, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 13 } as CSSProperties,
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 } as CSSProperties,
  list: { display: "flex", flexDirection: "column", gap: 10 } as CSSProperties,
  card: { display: "grid", gridTemplateColumns: "1fr 1.4fr 1.4fr", gap: 16, alignItems: "center", background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 14 } as CSSProperties,
  left: {} as CSSProperties,
  mid: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13 } as CSSProperties,
  right: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 } as CSSProperties,
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 } as CSSProperties,
  note: { fontSize: 12, color: "var(--muted-foreground)", flex: 1, textAlign: "right" as any } as CSSProperties,
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#fca5a5" } as CSSProperties,
  badge: (reason: UnavailabilityReason): CSSProperties => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: reason === "MAINTENANCE" ? "rgba(59,130,246,0.14)" : reason === "OWNER_USE" ? "rgba(148,163,184,0.14)" : reason === "INSURANCE_LAPSE" ? "rgba(239,68,68,0.14)" : "rgba(148,163,184,0.14)",
    color: reason === "MAINTENANCE" ? "#93c5fd" : reason === "OWNER_USE" ? "#cbd5e1" : reason === "INSURANCE_LAPSE" ? "#fca5a5" : "#cbd5e1",
    alignSelf: "flex-start",
  }),
};

const mo: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 520, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit" },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
