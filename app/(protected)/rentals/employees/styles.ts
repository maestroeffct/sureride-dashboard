import { CSSProperties } from "react";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1320,
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

  actionBtn: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },

  primaryBtn: {
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
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
    minWidth: 170,
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
    minWidth: 1300,
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

  roleSelect: {
    height: 36,
    minWidth: 170,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 10px",
    fontSize: 12,
    outline: "none",
  },

  statusPill: {
    ...bookingsTableTheme.statusPill,
    fontWeight: 700,
  },

  statusActive: {
    background: "rgba(34,197,94,0.14)",
    color: "#86EFAC",
    border: "1px solid rgba(34,197,94,0.22)",
  },

  statusSuspended: {
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

  smallActionBtn: {
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

  suspendBtn: {
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
  },

  activateBtn: {
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
  },

  resetBtn: {
    border: "1px solid rgba(59,130,246,0.45)",
    background: "rgba(59,130,246,0.16)",
    color: "#93C5FD",
  },

  empty: {
    ...bookingsTableTheme.emptyCell,
    padding: 44,
    borderBottom: "1px solid var(--glass-08)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 110,
    padding: 16,
  },

  modalCard: {
    width: "min(560px, 100%)",
    borderRadius: 14,
    border: "1px solid var(--glass-10)",
    background: "var(--surface-2)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    maxHeight: "85vh",
    overflowY: "auto",
  },

  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 12,
    color: "var(--fg-70)",
    fontWeight: 600,
  },

  input: {
    height: 42,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 10px",
    outline: "none",
    fontSize: 14,
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "var(--fg-75)",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  ghostBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    fontWeight: 600,
  },
} satisfies Record<string, CSSProperties>;

export default styles;
