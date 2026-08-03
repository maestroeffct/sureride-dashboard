"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { Ban, Calendar, CalendarClock, Clock, Copy, Plus, Trash2, X } from "lucide-react";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  listAvailability,
  type UnavailabilityReason,
  type UnavailabilityRow,
  getBusinessHours,
  saveBusinessHours,
  type BusinessHoursDay,
} from "@/src/lib/providerOpsApi";
import { listProviderCars } from "@/src/lib/providerApi";

type CarLite = { id: string; brand: string; model: string; licensePlate?: string | null };

const REASONS: { value: UnavailabilityReason; label: string }[] = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "OWNER_USE", label: "Owner using car" },
  { value: "INSURANCE_LAPSE", label: "Insurance lapsed" },
  { value: "OTHER", label: "Other" },
];

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Generate half-hour slots for the time dropdowns.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const value = `${String(h).padStart(2, "0")}:${m}`;
  const suffix = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { value, label: `${displayH}:${m} ${suffix}` };
});

const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
];

export default function AvailabilityPage() {
  return (
    <div style={s.page}>
      <header>
        <h1 style={s.title}><CalendarClock size={22} color="var(--brand-primary)" /> Availability Management</h1>
        <p style={s.sub}>Manage dates and hours when vehicles are available for rental</p>
      </header>
      <BlockedDatesSection />
      <WorkingHoursSection />
    </div>
  );
}

// ─── Blocked Dates ────────────────────────────────────────────────────────
function BlockedDatesSection() {
  const [rows, setRows] = useState<UnavailabilityRow[]>([]);
  const [cars, setCars] = useState<CarLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [blocks, carsRes] = await Promise.all([
        listAvailability({}),
        listProviderCars({ limit: 500 }),
      ]);
      setRows(blocks.items);
      setCars(carsRes.items ?? []);
    } catch (e: any) { toast.error(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const remove = async (r: UnavailabilityRow) => {
    if (!confirm("Remove this block? The car will be bookable again in this window.")) return;
    try { await deleteAvailabilityBlock(r.id); toast.success("Removed"); void load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <section style={s.card}>
      <div style={s.sectionHead}>
        <div>
          <h2 style={s.h2}><Ban size={16} color="var(--brand-primary)" /> Blocked Dates</h2>
          <p style={s.sectionSub}>Prevent bookings on specific dates</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpen(true)}><Plus size={15} /> Block Dates</button>
      </div>

      {loading ? (
        <div style={s.emptyPad}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={s.emptyCentered}>
          <div style={s.emptyIcon}><Calendar size={22} color="var(--muted-foreground)" /></div>
          <strong style={{ fontSize: 15 }}>No blocked dates</strong>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "6px 0 0" }}>Block date ranges to prevent rentals on specific days</p>
        </div>
      ) : (
        <div style={s.blockList}>
          {rows.map((r) => (
            <div key={r.id} style={s.blockRow}>
              <div style={s.blockLeft}>
                <strong>{r.car.brand} {r.car.model}</strong>
                <div style={s.muted}>{r.car.licensePlate ?? "no plate"}</div>
              </div>
              <div style={s.blockMid}>
                <div><strong>{new Date(r.startAt).toLocaleDateString()}</strong> → <strong>{new Date(r.endAt).toLocaleDateString()}</strong></div>
                <span style={reasonBadge(r.reason)}>{REASONS.find((x) => x.value === r.reason)?.label ?? r.reason}</span>
              </div>
              <div style={s.blockRight}>
                {r.note && <span style={s.muted}>{r.note}</span>}
                <button style={s.iconDanger} onClick={() => void remove(r)} title="Remove"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <BlockModal cars={cars} onClose={() => setOpen(false)} onDone={() => { setOpen(false); void load(); }} />
      )}
    </section>
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
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}><strong>Block car dates</strong><button style={m.close} onClick={onClose}><X size={16} /></button></div>
        <div style={m.body}>
          <label style={m.label}>Car</label>
          <select style={m.input} value={carId} onChange={(e) => setCarId(e.target.value)}>
            <option value="">Select…</option>
            {cars.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model} · {c.licensePlate ?? "no plate"}</option>)}
          </select>
          <div style={m.grid2}>
            <div><label style={m.label}>From</label><input style={m.input} type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></div>
            <div><label style={m.label}>To</label><input style={m.input} type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></div>
          </div>
          <label style={m.label}>Reason</label>
          <select style={m.input} value={reason} onChange={(e) => setReason(e.target.value as UnavailabilityReason)}>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <label style={m.label}>Note (optional)</label>
          <input style={m.input} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={m.primary} onClick={submit} disabled={busy}>{busy ? "Blocking…" : "Block"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Working Hours ────────────────────────────────────────────────────────
function WorkingHoursSection() {
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [isAlways247, setIsAlways247] = useState(false);
  const [days, setDays] = useState<BusinessHoursDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBusinessHours();
      setTimezone(res.timezone);
      setIsAlways247(res.isAlways247);
      setDays(res.hours);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const setDay = (dayOfWeek: number, patch: Partial<BusinessHoursDay>) => {
    setDays((d) => d.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)));
  };

  const copyToAll = (dayOfWeek: number) => {
    const src = days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!src) return;
    setDays((d) => d.map((r) => (r.isOpen ? { ...r, openTime: src.openTime, closeTime: src.closeTime } : r)));
    toast.success("Copied to all open days");
  };

  const reset = () => {
    if (!confirm("Reset all days to Monday–Friday 9:00 AM–5:00 PM?")) return;
    setDays(Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i + 1,
      isOpen: i < 5,
      openTime: "09:00",
      closeTime: "17:00",
    })));
    setIsAlways247(false);
  };

  const save = async () => {
    try {
      setSaving(true);
      await saveBusinessHours({ timezone, isAlways247, hours: days });
      toast.success("Working hours saved");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={s.emptyPad}>Loading working hours…</div>;

  return (
    <section style={s.card}>
      <div style={s.sectionHead}>
        <div>
          <h2 style={s.h2}><Clock size={16} color="var(--brand-primary)" /> Working Hours</h2>
          <p style={s.sectionSub}>Set when your business accepts bookings. Customers can only select pickup and drop-off times during open hours.</p>
        </div>
      </div>

      <div style={s.alwaysRow}>
        <div>
          <strong>24/7 Always Open</strong>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "4px 0 0" }}>Allow bookings at any hour, any day.</p>
        </div>
        <Switch checked={isAlways247} onChange={setIsAlways247} />
      </div>

      {!isAlways247 && (
        <>
          <div style={{ margin: "18px 0 6px" }}>
            <label style={m.label}>Timezone</label>
            <select style={m.input} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "6px 0 0" }}>All times are in this timezone. Customers in different timezones will see converted times.</p>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={s.weeklyHead}>Weekly Schedule</div>
            <div style={s.daysList}>
              {days.map((d) => (
                <div key={d.dayOfWeek} style={s.dayRow}>
                  <div style={s.dayLeft}>
                    <Switch checked={d.isOpen} onChange={(v) => setDay(d.dayOfWeek, { isOpen: v })} />
                    <strong style={{ minWidth: 100 }}>{DAY_LABELS[d.dayOfWeek - 1]}</strong>
                  </div>
                  {d.isOpen ? (
                    <>
                      <div style={s.dayTimes}>
                        <select style={s.timeSelect} value={d.openTime ?? "09:00"} onChange={(e) => setDay(d.dayOfWeek, { openTime: e.target.value })}>
                          {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <span style={{ color: "var(--muted-foreground)" }}>to</span>
                        <select style={s.timeSelect} value={d.closeTime ?? "17:00"} onChange={(e) => setDay(d.dayOfWeek, { closeTime: e.target.value })}>
                          {TIME_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <button style={s.copyBtn} onClick={() => copyToAll(d.dayOfWeek)} title="Apply these hours to every open day">
                        <Copy size={13} /> Copy to all
                      </button>
                    </>
                  ) : (
                    <span style={s.closedTag}>Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={s.actionsRow}>
        <button style={s.resetBtn} onClick={reset} disabled={saving}>Reset to Defaults</button>
        <button style={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Working Hours"}
        </button>
      </div>
    </section>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-block",
        width: 40,
        height: 22,
        borderRadius: 999,
        background: checked ? "var(--brand-primary)" : "var(--input-border)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.15s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: checked ? 20 : 2,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </span>
  );
}

function reasonBadge(reason: UnavailabilityReason): CSSProperties {
  const base: CSSProperties = { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, alignSelf: "flex-start" };
  const map: Record<UnavailabilityReason, [string, string]> = {
    MAINTENANCE: ["rgba(59,130,246,0.14)", "#93c5fd"],
    OWNER_USE: ["rgba(148,163,184,0.18)", "#cbd5e1"],
    INSURANCE_LAPSE: ["rgba(239,68,68,0.14)", "#fca5a5"],
    OTHER: ["rgba(148,163,184,0.14)", "#cbd5e1"],
  };
  const [bg, color] = map[reason];
  return { ...base, background: bg, color };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1200 },
  title: { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.4, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 14 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 16, padding: 24 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 },
  h2: { margin: 0, fontSize: 18, fontWeight: 700, display: "inline-flex", gap: 10, alignItems: "center" },
  sectionSub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },

  emptyPad: { padding: 40, textAlign: "center", color: "var(--muted-foreground)" },
  emptyCentered: { padding: 50, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  emptyIcon: { width: 60, height: 60, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 },

  blockList: { display: "flex", flexDirection: "column", gap: 10 },
  blockRow: { display: "grid", gridTemplateColumns: "1fr 1.4fr 1.4fr", gap: 16, alignItems: "center", padding: 14, background: "var(--surface-2)", borderRadius: 10 },
  blockLeft: {},
  blockMid: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13 },
  blockRight: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 },
  muted: { fontSize: 12, color: "var(--muted-foreground)" },
  iconDanger: { background: "transparent", border: "none", cursor: "pointer", color: "#fca5a5" },

  alwaysRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "var(--surface-2)", borderRadius: 10, marginBottom: 8 },

  weeklyHead: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  daysList: { display: "flex", flexDirection: "column", gap: 8 },
  dayRow: { display: "flex", alignItems: "center", gap: 20, padding: "14px 16px", background: "var(--surface-2)", borderRadius: 10, minHeight: 60 },
  dayLeft: { display: "flex", alignItems: "center", gap: 14 },
  dayTimes: { display: "flex", alignItems: "center", gap: 10, flex: 1 },
  timeSelect: { minWidth: 120, height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 13 },
  copyBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "none", background: "transparent", color: "var(--brand-primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  closedTag: { flex: 1, color: "var(--muted-foreground)", fontSize: 13 },

  actionsRow: { display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--input-border)" },
  resetBtn: { padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)", background: "transparent", color: "#fca5a5", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};

const m: Record<string, CSSProperties> = {
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
