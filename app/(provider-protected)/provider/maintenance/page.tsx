"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { Plus, Wrench, X, Trash2 } from "lucide-react";
import {
  createMaintenance,
  deleteMaintenance,
  listMaintenance,
  type MaintenanceRow,
  type MaintenanceType,
} from "@/src/lib/providerOpsApi";
import { listProviderCars } from "@/src/lib/providerApi";

type CarLite = { id: string; brand: string; model: string; licensePlate?: string | null };

const TYPES: { value: MaintenanceType; label: string }[] = [
  { value: "OIL_CHANGE", label: "Oil change" },
  { value: "TYRE", label: "Tyres" },
  { value: "BRAKES", label: "Brakes" },
  { value: "BODYWORK", label: "Bodywork" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "FULL_SERVICE", label: "Full service" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "OTHER", label: "Other" },
];

export default function MaintenancePage() {
  const [rows, setRows] = useState<MaintenanceRow[]>([]);
  const [cars, setCars] = useState<CarLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [logs, carsRes] = await Promise.all([
        listMaintenance({ carId: filter || undefined }),
        listProviderCars({ limit: 500 }),
      ]);
      setRows(logs.items);
      setCars(carsRes.items ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load maintenance");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const remove = async (r: MaintenanceRow) => {
    if (!confirm("Delete this maintenance record?")) return;
    try { await deleteMaintenance(r.id); toast.success("Deleted"); void load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}><Wrench size={20} color="var(--brand-primary)" /> Maintenance</h1>
          <p style={s.sub}>Service history per vehicle. Log oil changes, tyre replacements, bodywork, inspections — and block dates while the car is off-road.</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpen(true)}><Plus size={15} /> Log service</button>
      </header>

      <div style={s.filters}>
        <select style={s.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All cars</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.licensePlate ?? "no plate"}</option>)}
        </select>
      </div>

      {loading ? <div style={s.empty}>Loading…</div>
        : rows.length === 0 ? <div style={s.empty}>No maintenance logged. Add one to start tracking service history.</div>
        : (
          <div style={s.list}>
            {rows.map((r) => (
              <article key={r.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <strong>{TYPES.find((t) => t.value === r.type)?.label ?? r.type}</strong>
                    <div style={s.meta}>{r.car.brand} {r.car.model} {r.car.licensePlate ? `· ${r.car.licensePlate}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: 15 }}>{new Date(r.serviceDate).toLocaleDateString()}</strong>
                    {r.cost != null && <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{r.currency} {r.cost.toLocaleString()}</div>}
                  </div>
                </div>
                {r.notes && <p style={s.notes}>{r.notes}</p>}
                <div style={s.footer}>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                    {r.odometerKm != null ? `${r.odometerKm.toLocaleString()} km · ` : ""}{r.workshop ?? "—"}
                    {r.unavailability.length > 0 && <span style={{ marginLeft: 10, color: "#fca5a5" }}>Car blocked</span>}
                  </div>
                  <button style={s.iconBtn} onClick={() => void remove(r)}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        )}

      {open && <LogModal cars={cars} onClose={() => setOpen(false)} onDone={() => { setOpen(false); void load(); }} />}
    </div>
  );
}

function LogModal({ cars, onClose, onDone }: { cars: CarLite[]; onClose: () => void; onDone: () => void }) {
  const [carId, setCarId] = useState("");
  const [type, setType] = useState<MaintenanceType>("OIL_CHANGE");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [odometerKm, setOdometerKm] = useState("");
  const [cost, setCost] = useState("");
  const [workshop, setWorkshop] = useState("");
  const [notes, setNotes] = useState("");
  const [blockUntil, setBlockUntil] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!carId) return toast.error("Pick a car");
    try {
      setBusy(true);
      await createMaintenance({
        carId,
        type,
        serviceDate,
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
        cost: cost ? Number(cost) : undefined,
        workshop: workshop || undefined,
        notes: notes || undefined,
        blockCarUntil: blockUntil || undefined,
      });
      toast.success("Logged");
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}><strong>Log maintenance</strong><button style={m.close} onClick={onClose}><X size={16} /></button></div>
        <div style={m.body}>
          <Field label="Car"><select style={m.input} value={carId} onChange={(e) => setCarId(e.target.value)}><option value="">Select…</option>{cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.licensePlate ?? "no plate"}</option>)}</select></Field>
          <div style={m.grid2}>
            <Field label="Type"><select style={m.input} value={type} onChange={(e) => setType(e.target.value as MaintenanceType)}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
            <Field label="Service date"><input style={m.input} type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></Field>
          </div>
          <div style={m.grid2}>
            <Field label="Odometer (km)"><input style={m.input} type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} /></Field>
            <Field label="Cost (NGN)"><input style={m.input} type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
          </div>
          <Field label="Workshop"><input style={m.input} value={workshop} onChange={(e) => setWorkshop(e.target.value)} placeholder="e.g. Coscharis Motors, Lekki" /></Field>
          <Field label="Notes"><textarea style={{ ...m.input, height: 70 }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <Field label="Block car until (optional)"><input style={m.input} type="date" value={blockUntil} onChange={(e) => setBlockUntil(e.target.value)} /></Field>
        </div>
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={m.primary} onClick={submit} disabled={busy}>{busy ? "Saving…" : "Log service"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={m.label}>{label}</label>{children}</div>;
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1100 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  filters: { display: "flex", gap: 10 },
  select: { height: 42, minWidth: 220, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 13 },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  notes: { margin: 0, padding: 10, background: "var(--surface-2)", borderRadius: 8, fontSize: 13, lineHeight: 1.5 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid var(--input-border)" },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#fca5a5" },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 560, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
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
