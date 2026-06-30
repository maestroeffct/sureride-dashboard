"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Clock,
  KeyRound,
  UserX,
  Ban,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import {
  listCleanupPreviews,
  runCleanupTask,
  type CleanupCounts,
  type CleanupPreview,
  type CleanupTaskId,
} from "@/src/lib/adminCleanupApi";
import {
  listWipeableTables,
  wipeTables,
  type WipeableTable,
} from "@/src/lib/adminMaintenanceApi";

type ActionMeta = {
  id: CleanupTaskId;
  description: string;
  detail: string;
  icon: React.ReactNode;
};

const ACTIONS: ActionMeta[] = [
  {
    id: "expired-sessions",
    description: "Delete user, admin, and provider sessions past their expiry.",
    detail: "Affects: Session, AdminSession, ProviderSession tables. Clients will re-authenticate on next request.",
    icon: <Clock size={18} />,
  },
  {
    id: "expired-otps",
    description: "Delete OTPs past their expiry, plus consumed OTPs older than 7 days.",
    detail: "Affects: Otp table. Pending OTPs in active use are not touched.",
    icon: <KeyRound size={18} />,
  },
  {
    id: "unverified-accounts",
    description: "Delete unverified user accounts older than 60 days with zero bookings.",
    detail: "Affects: User table (cascades to sessions, OTPs, KYC). Verified users and users with any booking are preserved.",
    icon: <UserX size={18} />,
  },
  {
    id: "cancelled-bookings",
    description: "Delete CANCELLED bookings older than 90 days.",
    detail: "Affects: Booking table. PENDING / CONFIRMED / COMPLETED bookings are never deleted.",
    icon: <Ban size={18} />,
  },
];

export default function CleanDatabasePage() {
  const [previews, setPreviews] = useState<Record<string, CleanupPreview>>({});
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<CleanupTaskId | null>(null);
  const [runningId, setRunningId] = useState<CleanupTaskId | null>(null);
  const [lastResults, setLastResults] = useState<Record<string, { deleted: CleanupCounts; runAt: string }>>({});

  const loadPreviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCleanupPreviews();
      const map: Record<string, CleanupPreview> = {};
      for (const item of res.items) map[item.id] = item;
      setPreviews(map);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load cleanup previews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreviews();
  }, [loadPreviews]);

  const runAction = async (id: CleanupTaskId) => {
    setRunningId(id);
    setConfirmingId(null);
    try {
      const result = await runCleanupTask(id);
      setLastResults((prev) => ({
        ...prev,
        [id]: { deleted: result.deleted, runAt: result.runAt },
      }));
      const total = (result.deleted.total as number | undefined) ?? 0;
      toast.success(
        total === 0 ? "Nothing to delete — already clean" : `Deleted ${total} record${total === 1 ? "" : "s"}`,
      );
      // Refresh previews after a run
      await loadPreviews();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cleanup failed");
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Scanning database for cleanup previews…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Warning banner */}
      <div style={s.warningBanner}>
        <AlertTriangle size={20} color="#ef4444" />
        <div style={{ flex: 1 }}>
          <p style={s.warningTitle}>Danger Zone — permanent deletes</p>
          <p style={s.warningDesc}>
            These actions run real Prisma deletes against the production database.
            Records cannot be recovered. Counts below are live previews — take a backup
            before running anything you&apos;re unsure about.
          </p>
        </div>
        <button style={s.refreshBtn} onClick={loadPreviews} title="Refresh previews">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <AdvancedWipeSection />

      <div style={s.grid}>
        {ACTIONS.map((action) => {
          const preview = previews[action.id];
          const total = (preview?.counts.total as number | undefined) ?? 0;
          const lastResult = lastResults[action.id];
          const isConfirming = confirmingId === action.id;
          const isRunning = runningId === action.id;

          return (
            <div key={action.id} style={s.card}>
              <div style={s.cardHead}>
                <div style={s.iconBox}>{action.icon}</div>
                <div style={s.cardTitleWrap}>
                  <p style={s.cardTitle}>{preview?.title ?? action.id}</p>
                  <p style={s.cardDesc}>{action.description}</p>
                </div>
              </div>

              <div style={s.previewBox}>
                <div style={s.previewRow}>
                  <span style={s.previewLabel}>Will delete</span>
                  <span style={{ ...s.previewValue, color: total > 0 ? "#fca5a5" : "var(--muted-foreground)" }}>
                    {total}
                  </span>
                </div>
                {preview && <CountsBreakdown counts={preview.counts} />}
              </div>

              <p style={s.cardDetail}>{action.detail}</p>

              {lastResult && (
                <div style={s.lastResultBox}>
                  Last run: deleted {(lastResult.deleted.total as number | undefined) ?? 0} ·{" "}
                  {new Date(lastResult.runAt).toLocaleString()}
                </div>
              )}

              {isConfirming ? (
                <div style={s.confirmBox}>
                  <p style={s.confirmText}>
                    Permanently delete {total} record{total === 1 ? "" : "s"}? This cannot be undone.
                  </p>
                  <div style={s.confirmActions}>
                    <button style={s.cancelBtn} onClick={() => setConfirmingId(null)}>
                      Cancel
                    </button>
                    <button style={s.dangerBtn} onClick={() => runAction(action.id)}>
                      Yes, Delete Now
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={{
                    ...s.runBtn,
                    opacity: isRunning || total === 0 ? 0.5 : 1,
                    cursor: isRunning || total === 0 ? "not-allowed" : "pointer",
                  }}
                  onClick={() => setConfirmingId(action.id)}
                  disabled={isRunning || total === 0}
                >
                  {isRunning ? "Running…" : total === 0 ? "Nothing to clean" : "Run Cleanup"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Advanced: per-table wipe ────────────────────────────────────────────────
// SUPER_ADMIN-only. Lists every wipeable model with live counts +
// dependency map. Checking a parent auto-checks + locks every cascaded
// child so the admin can't miss the blast radius. Two-step confirm: open
// modal → type WIPE → submit.

function AdvancedWipeSection() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const [tables, setTables] = useState<WipeableTable[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [running, setRunning] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWipeableTables();
      setTables(res.items);
      setDenied(false);
    } catch (e) {
      // 403 means caller isn't SUPER_ADMIN — hide the section silently.
      if (e instanceof Error && /SUPER_ADMIN|403/i.test(e.message)) {
        setDenied(true);
      } else {
        toast.error(e instanceof Error ? e.message : "Failed to load tables");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate on first open so non-super admins don't even hit the endpoint.
  useEffect(() => {
    if (open && tables.length === 0 && !denied) void load();
  }, [open, tables.length, denied, load]);

  // Effective selection — every checked parent expands to include its
  // cascade tree. Children pulled in this way are "forced": their
  // checkbox shows checked + locked, removing the parent unlocks them.
  const effectiveSet = (() => {
    const out = new Set<string>(selected);
    for (const name of selected) {
      const row = tables.find((t) => t.name === name);
      if (!row) continue;
      for (const child of row.cascadesTo) out.add(child);
    }
    return out;
  })();

  const forcedSet = (() => {
    const out = new Set<string>();
    for (const name of selected) {
      const row = tables.find((t) => t.name === name);
      if (!row) continue;
      for (const child of row.cascadesTo) {
        if (!selected.has(child)) out.add(child);
      }
    }
    return out;
  })();

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalRowsToDelete = tables
    .filter((t) => effectiveSet.has(t.name))
    .reduce((sum, t) => sum + t.count, 0);

  const grouped = (() => {
    const map = new Map<string, WipeableTable[]>();
    for (const t of tables) {
      const list = map.get(t.group) ?? [];
      list.push(t);
      map.set(t.group, list);
    }
    return Array.from(map.entries());
  })();

  const doWipe = async () => {
    if (confirmText !== "WIPE") return;
    setRunning(true);
    try {
      const res = await wipeTables(Array.from(selected));
      toast.success(
        `Wiped ${res.effectiveTables.length} table${
          res.effectiveTables.length === 1 ? "" : "s"
        } — ${res.totalRows.toLocaleString()} rows deleted`,
      );
      setSelected(new Set());
      setConfirming(false);
      setConfirmText("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Wipe failed");
    } finally {
      setRunning(false);
    }
  };

  if (denied) return null;

  return (
    <section style={advancedSection}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={advancedHeader}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldAlert size={18} color="#ef4444" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            Advanced — Per-table wipe
          </span>
          <span style={advancedBadge}>SUPER_ADMIN</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open ? (
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
            Wipe entire tables. Checking a parent auto-includes every table the
            cascade will drop with it. Every action lands in the Audit Log with
            row counts. Take a backup before running this.
          </p>

          {loading ? (
            <div style={s.loadingWrap}>
              <div style={s.spinner} />
              <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
                Counting rows…
              </span>
            </div>
          ) : (
            <>
              {grouped.map(([group, rows]) => (
                <div key={group} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {group}
                  </span>
                  <div style={tableGrid}>
                    {rows.map((t) => {
                      const checked = selected.has(t.name);
                      const forced = forcedSet.has(t.name);
                      const isChecked = checked || forced;
                      return (
                        <label
                          key={t.name}
                          style={{
                            ...tableRow,
                            opacity: forced ? 0.92 : 1,
                            borderColor: isChecked
                              ? "rgba(239,68,68,0.45)"
                              : "var(--input-border)",
                            background: isChecked
                              ? "rgba(239,68,68,0.08)"
                              : "var(--surface-1)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={forced}
                            onChange={() => toggle(t.name)}
                            style={{ accentColor: "#ef4444" }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {t.label}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                              {t.name} · {t.count.toLocaleString()} rows
                              {forced ? " · linked" : ""}
                              {t.cascadesTo.length > 0 && !forced
                                ? ` · cascades to ${t.cascadesTo.length}`
                                : ""}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div style={advancedFooter}>
                <div>
                  {selected.size === 0 ? (
                    <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
                      Select tables to wipe
                    </span>
                  ) : (
                    <span style={{ fontSize: 13 }}>
                      <strong>{effectiveSet.size}</strong> table
                      {effectiveSet.size === 1 ? "" : "s"} selected ·{" "}
                      <strong style={{ color: "#fca5a5" }}>
                        {totalRowsToDelete.toLocaleString()} rows
                      </strong>{" "}
                      will be deleted
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  style={{
                    ...s.dangerBtn,
                    opacity: selected.size === 0 ? 0.5 : 1,
                  }}
                  disabled={selected.size === 0}
                  onClick={() => {
                    setConfirming(true);
                    setConfirmText("");
                  }}
                >
                  <Trash2 size={14} /> Wipe Selected
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {confirming ? (
        <div style={modalBackdrop} onClick={() => !running && setConfirming(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <strong style={{ fontSize: 15 }}>Confirm permanent delete</strong>
              <button
                type="button"
                style={s.cancelBtn}
                onClick={() => setConfirming(false)}
                disabled={running}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 13 }}>
                The following {effectiveSet.size} table
                {effectiveSet.size === 1 ? "" : "s"} will be wiped — totalling{" "}
                <strong style={{ color: "#fca5a5" }}>
                  {totalRowsToDelete.toLocaleString()}
                </strong>{" "}
                rows:
              </p>
              <div
                style={{
                  border: "1px solid var(--input-border)",
                  borderRadius: 10,
                  padding: 12,
                  maxHeight: 200,
                  overflowY: "auto",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                  background: "var(--surface-1)",
                }}
              >
                {Array.from(effectiveSet)
                  .sort()
                  .map((name) => {
                    const row = tables.find((t) => t.name === name);
                    return (
                      <div key={name}>
                        {name} —{" "}
                        <span style={{ color: "#fca5a5" }}>
                          {row?.count.toLocaleString() ?? 0} rows
                        </span>
                      </div>
                    );
                  })}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)" }}>
                Type <strong>WIPE</strong> (uppercase) to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="WIPE"
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid var(--input-border)",
                  background: "var(--input-bg)",
                  color: "var(--input-fg)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 14,
                  outline: "none",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={modalFooter}>
              <button
                type="button"
                style={s.cancelBtn}
                onClick={() => setConfirming(false)}
                disabled={running}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  ...s.dangerBtn,
                  opacity:
                    confirmText !== "WIPE" || running ? 0.5 : 1,
                }}
                disabled={confirmText !== "WIPE" || running}
                onClick={doWipe}
              >
                {running ? "Wiping…" : "Wipe permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// Inline styles only for the advanced section so we don't pollute the
// shared `s` object above. Tokens-only.
const advancedSection: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(239,68,68,0.32)",
  background: "rgba(239,68,68,0.04)",
  overflow: "hidden",
};
const advancedHeader: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--foreground)",
};
const advancedBadge: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(239,68,68,0.12)",
  color: "#fca5a5",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  border: "1px solid rgba(239,68,68,0.35)",
};
const tableGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 8,
};
const tableRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--input-border)",
  background: "var(--surface-1)",
  cursor: "pointer",
};
const advancedFooter: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 14,
  borderTop: "1px solid var(--input-border)",
};
const modalBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.7)",
  zIndex: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};
const modalCard: CSSProperties = {
  width: "100%",
  maxWidth: 560,
  background: "var(--surface-1)",
  border: "1px solid var(--input-border)",
  borderRadius: 14,
  boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
};
const modalHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 18px",
  borderBottom: "1px solid var(--input-border)",
};
const modalFooter: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "12px 18px",
  borderTop: "1px solid var(--input-border)",
};

function CountsBreakdown({ counts }: { counts: CleanupCounts }) {
  const entries = Object.entries(counts).filter(([key]) => key !== "total");
  if (entries.length === 0) return null;
  return (
    <div style={s.breakdown}>
      {entries.map(([key, val]) => (
        <span key={key} style={s.breakdownChip}>
          {key}: <strong style={{ color: "var(--foreground)" }}>{val}</strong>
        </span>
      ))}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 1000, display: "flex", flexDirection: "column", gap: 20 },
  loadingWrap: { display: "flex", alignItems: "center", gap: 12, padding: 40 },
  spinner: {
    width: 22, height: 22, borderRadius: "50%",
    border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },

  warningBanner: {
    display: "flex",
    gap: 14,
    padding: "16px 18px",
    borderRadius: 14,
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)",
    alignItems: "flex-start",
  },
  warningTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "#ef4444" },
  warningDesc: { margin: "4px 0 0", fontSize: 13, color: "var(--foreground)", lineHeight: 1.55 },
  refreshBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", borderRadius: 8,
    border: "1px solid rgba(239,68,68,0.3)",
    background: "rgba(239,68,68,0.05)",
    color: "#fca5a5",
    cursor: "pointer", fontSize: 12, fontWeight: 600,
    flexShrink: 0,
  },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  card: {
    background: "var(--surface-1)",
    border: "1px solid rgba(239,68,68,0.18)",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardHead: { display: "flex", gap: 12, alignItems: "flex-start" },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  cardDesc: { margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 },

  previewBox: {
    background: "var(--surface-2)",
    padding: "12px 14px",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    border: "1px solid var(--input-border)",
  },
  previewRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  previewLabel: { fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" },
  previewValue: { fontSize: 22, fontWeight: 750, fontVariantNumeric: "tabular-nums" },
  breakdown: { display: "flex", flexWrap: "wrap", gap: 6 },
  breakdownChip: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 6,
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    color: "var(--muted-foreground)",
  },

  cardDetail: {
    margin: 0,
    fontSize: 11.5,
    color: "var(--muted-foreground)",
    lineHeight: 1.5,
    fontStyle: "italic",
  },

  lastResultBox: {
    fontSize: 11,
    color: "var(--brand-secondary)",
    padding: "6px 10px",
    background: "color-mix(in srgb, var(--brand-secondary) 8%, transparent)",
    border: "1px solid color-mix(in srgb, var(--brand-secondary) 25%, transparent)",
    borderRadius: 8,
  },

  runBtn: {
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 700,
    alignSelf: "flex-start",
  },

  confirmBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  confirmText: { margin: 0, fontSize: 12, color: "#fca5a5", fontWeight: 600 },
  confirmActions: { display: "flex", gap: 8, justifyContent: "flex-end" },
  cancelBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    fontSize: 12,
  },
  dangerBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "none",
    background: "rgba(239,68,68,0.9)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
};
