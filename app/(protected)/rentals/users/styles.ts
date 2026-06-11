import { CSSProperties } from "react";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1280,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "var(--foreground)",
  },

  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "var(--fg-60)",
  },

  headerActions: {
    display: "flex",
    gap: 10,
  },

  exportWrap: {
    position: "relative",
  },

  exportButton: {
    height: 44,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontWeight: 600,
  },

  exportDropdown: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 180,
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "rgba(16,18,24,0.98)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
    overflow: "hidden",
    zIndex: 50,
  },

  exportItem: {
    width: "100%",
    padding: "12px 12px",
    textAlign: "left",
    border: "none",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
  },

  filtersRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  searchBox: {
    height: 48,
    width: 420,
    maxWidth: "100%",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--foreground)",
    padding: "0 14px",
    fontSize: 14,
  },

  searchIconWrap: {
    width: 52,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderLeft: "1px solid var(--glass-10)",
    color: "var(--fg-80)",
  },

  select: {
    height: 44,
    minWidth: 176,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },

  card: bookingsTableTheme.card,
  tableWrap: bookingsTableTheme.tableWrap,

  table: {
    ...bookingsTableTheme.table,
    minWidth: 1320,
  },

  theadRow: bookingsTableTheme.theadRow,

  th: {
    ...bookingsTableTheme.th,
    padding: "14px 16px",
    borderBottom: "1px solid var(--glass-10)",
  },

  thRight: {
    ...bookingsTableTheme.thRight,
    padding: "14px 16px",
    borderBottom: "1px solid var(--glass-10)",
  },

  tr: bookingsTableTheme.tr,
  trHover: bookingsTableTheme.trHover,

  td: {
    ...bookingsTableTheme.td,
    padding: "14px 16px",
    borderBottom: "1px solid var(--glass-08)",
  },

  tdRight: {
    ...bookingsTableTheme.tdRight,
    padding: "14px 16px",
    borderBottom: "1px solid var(--glass-08)",
  },

  twoLine: bookingsTableTheme.twoLine,

  primary: {
    fontWeight: 800,
    color: "var(--foreground)",
  },

  secondary: {
    fontSize: 12,
    color: "var(--fg-55)",
  },

  statusPill: {
    ...bookingsTableTheme.statusPill,
    fontWeight: 700,
  },

  profileIncomplete: {
    background: "rgba(148,163,184,0.15)",
    color: "#CBD5E1",
    border: "1px solid rgba(148,163,184,0.28)",
  },

  profilePending: {
    background: "rgba(250,204,21,0.14)",
    color: "#FDE68A",
    border: "1px solid rgba(250,204,21,0.24)",
  },

  profileVerified: {
    background: "rgba(34,197,94,0.14)",
    color: "#86EFAC",
    border: "1px solid rgba(34,197,94,0.22)",
  },

  profileRejected: {
    background: "rgba(239,68,68,0.14)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },

  kycNone: {
    background: "rgba(99,102,241,0.16)",
    color: "#C7D2FE",
    border: "1px solid rgba(99,102,241,0.28)",
  },

  kycPending: {
    background: "rgba(250,204,21,0.14)",
    color: "#FDE68A",
    border: "1px solid rgba(250,204,21,0.24)",
  },

  kycVerified: {
    background: "rgba(34,197,94,0.14)",
    color: "#86EFAC",
    border: "1px solid rgba(34,197,94,0.22)",
  },

  kycRejected: {
    background: "rgba(239,68,68,0.14)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },

  // Icon-only action button — tooltip shown via `title` attribute on hover
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--fg-70)",
    textDecoration: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  activateBtn: {
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
  },

  suspendBtn: {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
  },

  verifyBtn: {
    border: "1px solid color-mix(in srgb, var(--brand-primary) 40%, transparent)",
    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
    color: "var(--brand-primary)",
  },

  resetPasswordBtn: {
    border: "1px solid rgba(245,158,11,0.35)",
    background: "rgba(245,158,11,0.12)",
    color: "#FCD34D",
  },

  kycApproveBtn: {
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
  },

  kycRejectBtn: {
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3,8,20,0.64)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 80,
  },

  resetModal: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    border: "1px solid var(--glass-10)",
    background: "rgba(10,14,22,0.98)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  resetModalHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  resetModalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--foreground)",
  },

  resetModalText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: "var(--fg-70)",
  },

  resetOptionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    cursor: "pointer",
  },

  resetCheckbox: {
    width: 16,
    height: 16,
    accentColor: "#F59E0B",
    cursor: "pointer",
  },

  resetOptionText: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--foreground)",
  },

  resetHint: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: "var(--fg-60)",
  },

  resetModalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  resetCancelBtn: {
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "transparent",
    color: "var(--foreground)",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  resetConfirmBtn: {
    borderRadius: 10,
    border: "1px solid rgba(245,158,11,0.38)",
    background: "rgba(245,158,11,0.18)",
    color: "#FCD34D",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  empty: {
    ...bookingsTableTheme.emptyCell,
    padding: 44,
    borderBottom: "1px solid var(--glass-08)",
  },
} satisfies Record<string, CSSProperties>;

export default styles;
