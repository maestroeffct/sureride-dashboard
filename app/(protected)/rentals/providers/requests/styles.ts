import { CSSProperties } from "react";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1200,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  filtersButton: {
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

  tabs: {
    display: "flex",
    gap: 24,
    borderBottom: "1px solid var(--glass-08)",
  },

  tab: {
    padding: "10px 0",
    background: "transparent",
    border: "none",
    color: "var(--fg-60)",
    fontSize: 15,
    cursor: "pointer",
  },

  tabActive: {
    color: "#3B82F6",
    borderBottom: "2px solid #3B82F6",
  },

  card: bookingsTableTheme.card,

  searchRow: {
    padding: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  searchBox: {
    height: 48,
    width: 440,
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

  tableWrap: bookingsTableTheme.tableWrap,

  table: bookingsTableTheme.table,

  theadRow: bookingsTableTheme.theadRow,

  th: {
    ...bookingsTableTheme.th,
    padding: "14px 16px",
    fontWeight: 800,
    borderBottom: "1px solid var(--glass-10)",
  },

  thRight: {
    ...bookingsTableTheme.thRight,
    padding: "14px 16px",
    fontWeight: 800,
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

  tdDivider: bookingsTableTheme.tdDivider,

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
    fontWeight: 800,
  },

  statusPending: {
    background: "rgba(250,204,21,0.14)",
    color: "#FDE68A",
    border: "1px solid rgba(250,204,21,0.22)",
  },

  statusApproved: {
    background: "rgba(34,197,94,0.14)",
    color: "#86EFAC",
    border: "1px solid rgba(34,197,94,0.22)",
  },

  statusRejected: {
    background: "rgba(239,68,68,0.14)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  approveBtn: {
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },

  rejectBtn: {
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },

  iconBtn: bookingsTableTheme.iconBtn,

  empty: {
    ...bookingsTableTheme.emptyCell,
    padding: 44,
    borderBottom: "1px solid var(--glass-08)",
  },
} satisfies Record<string, CSSProperties>;

export default styles;
