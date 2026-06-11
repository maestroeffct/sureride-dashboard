"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Clock, KeyRound, UserX, Ban, RefreshCw } from "lucide-react";
import {
  listCleanupPreviews,
  runCleanupTask,
  type CleanupCounts,
  type CleanupPreview,
  type CleanupTaskId,
} from "@/src/lib/adminCleanupApi";

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
