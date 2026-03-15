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

  actionBtn: {
    borderRadius: 8,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  activateBtn: {
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
  },

  suspendBtn: {
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
  },

  verifyBtn: {
    border: "1px solid rgba(59,130,246,0.45)",
    background: "rgba(59,130,246,0.16)",
    color: "#93C5FD",
  },

  kycApproveBtn: {
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
  },

  kycRejectBtn: {
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
  },

  empty: {
    ...bookingsTableTheme.emptyCell,
    padding: 44,
    borderBottom: "1px solid var(--glass-08)",
  },
} satisfies Record<string, CSSProperties>;

export default styles;
