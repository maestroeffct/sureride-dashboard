import type { CSSProperties } from "react";
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

  actionBtn: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
    padding: "0 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
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

  card: bookingsTableTheme.card,
  tableWrap: bookingsTableTheme.tableWrap,

  table: {
    ...bookingsTableTheme.table,
    minWidth: 1240,
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

  permissionWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },

  permissionPill: {
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    border: "1px solid var(--glass-10)",
    color: "var(--fg-80)",
    background: "var(--glass-06)",
  },

  typePill: {
    ...bookingsTableTheme.statusPill,
    fontWeight: 700,
  },

  typeSystem: {
    background: "rgba(99,102,241,0.16)",
    color: "#C7D2FE",
    border: "1px solid rgba(99,102,241,0.28)",
  },

  typeCustom: {
    background: "rgba(34,197,94,0.14)",
    color: "#86EFAC",
    border: "1px solid rgba(34,197,94,0.22)",
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
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  deleteBtn: {
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
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
    width: "min(740px, 100%)",
    borderRadius: 14,
    border: "1px solid var(--glass-10)",
    background: "var(--surface-2)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    maxHeight: "86vh",
    overflowY: "auto",
  },

  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
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

  textArea: {
    minHeight: 88,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "10px",
    outline: "none",
    fontSize: 14,
    resize: "vertical",
  },

  permissionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 8,
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "var(--fg-75)",
    border: "1px solid var(--glass-10)",
    borderRadius: 10,
    padding: "8px 10px",
    background: "var(--glass-06)",
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
