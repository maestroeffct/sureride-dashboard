"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  Ban,
  CalendarDays,
  CalendarOff,
  Clock,
  Copy,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
} from "@/src/lib/platformSettingsDraftApi";

/**
 * Admin Fleet Availability — blocked dates + weekly working hours.
 * Persists to the `fleet-availability` platform-settings section so the
 * pricing/booking engine can later honor it without a schema migration.
 *
 * Structure mirrors the agreed reference: two cards (Blocked Dates,
 * Working Hours) stacked, each with their own save flow.
 */

type BlockedDate = {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  label: string;
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DaySchedule = {
  isOpen: boolean;
  open: string; // HH:MM (24h)
  close: string;
};

type WorkingHours = {
  is24x7: boolean;
  timezone: string;
  schedule: Record<DayKey, DaySchedule>;
};

const DAY_ORDER: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Africa/Lagos", label: "West Africa Time (Lagos)" },
  { value: "Africa/Accra", label: "Greenwich Mean Time (Accra)" },
  { value: "Africa/Nairobi", label: "East Africa Time (Nairobi)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "British Time (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (Dubai)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

const DEFAULT_SCHEDULE: Record<DayKey, DaySchedule> = {
  mon: { isOpen: true, open: "09:00", close: "17:00" },
  tue: { isOpen: true, open: "09:00", close: "17:00" },
  wed: { isOpen: true, open: "09:00", close: "17:00" },
  thu: { isOpen: true, open: "09:00", close: "17:00" },
  fri: { isOpen: true, open: "09:00", close: "17:00" },
  sat: { isOpen: false, open: "09:00", close: "17:00" },
  sun: { isOpen: false, open: "09:00", close: "17:00" },
};

const DEFAULT_WORKING_HOURS: WorkingHours = {
  is24x7: false,
  timezone: "Africa/Lagos",
  schedule: DEFAULT_SCHEDULE,
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const hh = String(h).padStart(2, "0");
  const ampm = h === 0 ? "12" : h > 12 ? String(h - 12) : String(h);
  const period = h < 12 ? "AM" : "PM";
  return { value: `${hh}:${m}`, label: `${ampm}:${m} ${period}` };
});

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

export default function FleetAvailabilityPage() {
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [hours, setHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);
  const [loading, setLoading] = useState(true);
  const [savingBlocked, setSavingBlocked] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await listPlatformSettingsDraft();
        const raw = res.items["fleet-availability"] as
          | { blocked?: BlockedDate[]; hours?: WorkingHours }
          | undefined;
        if (raw?.blocked && Array.isArray(raw.blocked)) setBlocked(raw.blocked);
        if (raw?.hours) {
          setHours({
            is24x7: Boolean(raw.hours.is24x7),
            timezone: raw.hours.timezone || DEFAULT_WORKING_HOURS.timezone,
            schedule: { ...DEFAULT_SCHEDULE, ...(raw.hours.schedule || {}) },
          });
        }
      } catch {
        // Defaults already set; soft-fail.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistBlocked = async (next: BlockedDate[]) => {
    setBlocked(next);
    try {
      setSavingBlocked(true);
      await savePlatformSettingsDraft("fleet-availability", {
        blocked: next,
        hours,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save blocks");
    } finally {
      setSavingBlocked(false);
    }
  };

  const saveHours = async () => {
    try {
      setSavingHours(true);
      await savePlatformSettingsDraft("fleet-availability", {
        blocked,
        hours,
      });
      toast.success("Working hours saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save hours");
    } finally {
      setSavingHours(false);
    }
  };

  const resetHours = () => setHours(DEFAULT_WORKING_HOURS);

  const copyToAll = (sourceKey: DayKey) => {
    const src = hours.schedule[sourceKey];
    setHours((prev) => {
      const next = { ...prev.schedule };
      for (const d of DAY_ORDER) {
        next[d.key] = { ...src };
      }
      return { ...prev, schedule: next };
    });
    toast.success(`Copied ${sourceKey.toUpperCase()} hours to all days`);
  };

  const removeBlock = (id: string) => {
    if (!confirm("Remove this blocked range?")) return;
    void persistBlocked(blocked.filter((b) => b.id !== id));
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
            Loading availability…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div>
        <h1 style={s.pageTitle}>Availability Management</h1>
        <p style={s.pageSubtitle}>
          Manage dates and hours when vehicles are available for rental
        </p>
      </div>

      {/* ── Blocked Dates ─────────────────────────────────────────────── */}
      <section style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <h2 style={s.cardTitle}>
              <Ban size={16} color="var(--brand-secondary)" /> Blocked Dates
            </h2>
            <p style={s.cardSubtitle}>Prevent bookings on specific dates</p>
          </div>
          <button style={s.btnPrimary} onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            <span>Block Dates</span>
          </button>
        </div>

        {blocked.length === 0 ? (
          <div style={s.empty}>
            <span style={s.emptyIcon}>
              <CalendarOff size={22} />
            </span>
            <strong style={s.emptyTitle}>No blocked dates</strong>
            <span style={s.emptyHint}>
              Block date ranges to prevent rentals on specific days
            </span>
          </div>
        ) : (
          <div style={s.blockList}>
            {blocked.map((b) => (
              <div key={b.id} style={s.blockRow}>
                <div style={s.blockIcon}>
                  <CalendarDays size={16} />
                </div>
                <div style={s.blockInfo}>
                  <strong style={s.blockTitle}>
                    {b.label || "Blocked range"}
                  </strong>
                  <span style={s.blockMeta}>
                    {fmtDate(b.startDate)}
                    {b.startDate !== b.endDate ? ` → ${fmtDate(b.endDate)}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  style={s.iconBtnDanger}
                  onClick={() => removeBlock(b.id)}
                  disabled={savingBlocked}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Working Hours ─────────────────────────────────────────────── */}
      <section style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <h2 style={s.cardTitle}>
              <Clock size={16} color="var(--brand-secondary)" /> Working Hours
            </h2>
            <p style={s.cardSubtitle}>
              Set when your business accepts bookings. Customers can only select
              pickup and drop-off times during open hours.
            </p>
          </div>
        </div>

        {/* 24/7 toggle */}
        <div style={s.row247}>
          <div>
            <strong style={{ fontSize: 14 }}>24/7 Always Open</strong>
            <p style={{ ...s.cardSubtitle, margin: "2px 0 0" }}>
              Allow bookings at any time without restrictions
            </p>
          </div>
          <Toggle
            checked={hours.is24x7}
            onChange={(v) => setHours((p) => ({ ...p, is24x7: v }))}
          />
        </div>

        {/* Timezone */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={s.label}>Business Timezone</span>
          <select
            style={s.select}
            value={hours.timezone}
            onChange={(e) =>
              setHours((p) => ({ ...p, timezone: e.target.value }))
            }
          >
            {TIMEZONE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <span style={s.helperText}>
            All times are in this timezone. Customers in different timezones
            will see converted times.
          </span>
        </div>

        {/* Weekly Schedule */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={s.label}>Weekly Schedule</span>
          {hours.is24x7 ? (
            <div style={s.disabledNote}>
              Disabled while <strong>24/7 Always Open</strong> is on.
            </div>
          ) : (
            <div style={s.scheduleList}>
              {DAY_ORDER.map(({ key, label }) => {
                const day = hours.schedule[key];
                return (
                  <div key={key} style={s.dayRow}>
                    <div style={s.dayLeft}>
                      <Toggle
                        checked={day.isOpen}
                        onChange={(v) =>
                          setHours((p) => ({
                            ...p,
                            schedule: {
                              ...p.schedule,
                              [key]: { ...day, isOpen: v },
                            },
                          }))
                        }
                      />
                      <span style={s.dayLabel}>{label}</span>
                    </div>
                    {day.isOpen ? (
                      <div style={s.dayRight}>
                        <select
                          style={s.selectTime}
                          value={day.open}
                          onChange={(e) =>
                            setHours((p) => ({
                              ...p,
                              schedule: {
                                ...p.schedule,
                                [key]: { ...day, open: e.target.value },
                              },
                            }))
                          }
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <span style={{ color: "var(--muted-foreground)" }}>
                          to
                        </span>
                        <select
                          style={s.selectTime}
                          value={day.close}
                          onChange={(e) =>
                            setHours((p) => ({
                              ...p,
                              schedule: {
                                ...p.schedule,
                                [key]: { ...day, close: e.target.value },
                              },
                            }))
                          }
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          style={s.copyBtn}
                          onClick={() => copyToAll(key)}
                          title="Copy these hours to every day"
                        >
                          <Copy size={13} /> Copy to all
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted-foreground)" }}>
                        Closed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={s.hoursFooter}>
          <button
            type="button"
            style={s.btnSecondaryDanger}
            onClick={resetHours}
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            style={{ ...s.btnPrimary, opacity: savingHours ? 0.6 : 1 }}
            onClick={() => void saveHours()}
            disabled={savingHours}
          >
            <Save size={15} />
            <span>{savingHours ? "Saving…" : "Save Working Hours"}</span>
          </button>
        </div>
      </section>

      {addOpen ? (
        <BlockDatesModal
          onClose={() => setAddOpen(false)}
          onSubmit={(entry) => {
            void persistBlocked([...blocked, entry]);
            setAddOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        ...s.toggle,
        background: checked
          ? "var(--brand-secondary)"
          : "var(--surface-2)",
        borderColor: checked
          ? "var(--brand-secondary)"
          : "var(--input-border)",
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          ...s.toggleKnob,
          transform: checked ? "translateX(20px)" : "translateX(2px)",
          background: checked ? "#022c22" : "var(--muted-foreground)",
        }}
      />
    </button>
  );
}

// ── Block Dates Modal ───────────────────────────────────────────────────────
function BlockDatesModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (entry: BlockedDate) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [label, setLabel] = useState("");

  const submit = () => {
    if (!startDate || !endDate) {
      toast.error("Pick both start and end dates");
      return;
    }
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      toast.error("End date must be on or after start date");
      return;
    }
    onSubmit({ id: uid(), startDate, endDate, label: label.trim() });
  };

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            Block Dates
          </h3>
          <button
            type="button"
            style={s.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div style={s.modalBody}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={s.label}>Reason / label (optional)</span>
            <input
              style={s.input}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Public holiday, maintenance"
            />
          </div>
          <div style={s.grid2}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={s.label}>Start date</span>
              <input
                type="date"
                style={s.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={s.label}>End date</span>
              <input
                type="date"
                style={s.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div style={s.modalFooter}>
          <button type="button" style={s.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={s.btnPrimary} onClick={submit}>
            Block Dates
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100 },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 750, letterSpacing: -0.4 },
  pageSubtitle: {
    margin: "4px 0 0",
    color: "var(--muted-foreground)",
    fontSize: 13,
  },

  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "3px solid var(--input-border)",
    borderTopColor: "var(--brand-secondary)",
    animation: "spin 0.8s linear infinite",
  },

  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  cardSubtitle: {
    margin: "4px 0 0",
    color: "var(--muted-foreground)",
    fontSize: 13,
  },

  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "44px 16px",
    gap: 8,
    color: "var(--muted-foreground)",
    fontSize: 13,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "var(--surface-2)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--muted-foreground)",
  },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: "var(--foreground)" },
  emptyHint: { fontSize: 13, color: "var(--muted-foreground)" },

  blockList: { display: "flex", flexDirection: "column", gap: 10 },
  blockRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 14px",
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-2)",
  },
  blockIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "rgba(34,197,94,0.12)",
    color: "var(--brand-secondary)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  blockInfo: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  blockTitle: { fontSize: 14, color: "var(--foreground)" },
  blockMeta: { fontSize: 12, color: "var(--muted-foreground)" },
  iconBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  row247: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-2)",
    gap: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--foreground)",
  },
  helperText: {
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  select: {
    width: "100%",
    height: 44,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 14,
    outline: "none",
  },
  selectTime: {
    height: 40,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 13,
    outline: "none",
    minWidth: 120,
  },

  disabledNote: {
    padding: "16px 18px",
    border: "1px dashed var(--input-border)",
    borderRadius: 12,
    color: "var(--muted-foreground)",
    fontSize: 13,
  },

  scheduleList: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    overflow: "hidden",
  },
  dayRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid var(--input-border)",
    gap: 16,
  },
  dayLeft: { display: "flex", alignItems: "center", gap: 14 },
  dayLabel: { fontSize: 14, color: "var(--foreground)", fontWeight: 500 },
  dayRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  copyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },

  hoursFooter: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTop: "1px solid var(--input-border)",
  },

  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-secondary)",
    color: "#022c22",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 18px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondaryDanger: {
    padding: "10px 18px",
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.45)",
    background: "transparent",
    color: "#FCA5A5",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  toggle: {
    position: "relative",
    width: 44,
    height: 24,
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    cursor: "pointer",
    padding: 0,
    transition: "background 160ms ease, border-color 160ms ease",
    flexShrink: 0,
  },
  toggleKnob: {
    position: "absolute",
    top: 2,
    left: 0,
    width: 18,
    height: 18,
    borderRadius: "50%",
    transition: "transform 160ms ease, background 160ms ease",
  },

  // Modal
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.65)",
    zIndex: 80,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "60px 24px",
    backdropFilter: "blur(2px)",
    overflowY: "auto",
  },
  modal: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 22px",
    borderBottom: "1px solid var(--input-border)",
  },
  modalClose: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--muted-foreground)",
  },
  modalBody: {
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "14px 22px",
    borderTop: "1px solid var(--input-border)",
  },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 14,
    outline: "none",
  },
};
