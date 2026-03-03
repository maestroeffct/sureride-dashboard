import type { CSSProperties } from "react";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: { fontSize: 22, fontWeight: 700, color: "var(--foreground)" },
  subtitle: { fontSize: 13, color: "var(--fg-65)" },

  searchRow: { display: "flex" },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    width: 320,
    color: "var(--foreground)",
  },

  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    color: "var(--foreground)",
    width: "100%",
    fontSize: 14,
  },

  card: bookingsTableTheme.card,

  tableWrap: bookingsTableTheme.tableWrap,

  tableInner: { padding: "6px 0" },

  table: bookingsTableTheme.table,

  thead: bookingsTableTheme.theadRow,

  th: {
    ...bookingsTableTheme.th,
    padding: "16px 18px",
  },

  thRight: {
    ...bookingsTableTheme.thRight,
    padding: "16px 18px",
  },

  tr: bookingsTableTheme.tr,

  td: {
    ...bookingsTableTheme.td,
    padding: "16px 18px",
    color: "var(--foreground)",
  },

  tdRight: {
    ...bookingsTableTheme.tdRight,
    padding: "16px 18px",
    color: "var(--foreground)",
  },

  tdStrong: {
    ...bookingsTableTheme.tdStrong,
    padding: "16px 18px",
  },

  actionsCol: {
    width: 120,
    textAlign: "right",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  iconBtn: bookingsTableTheme.iconBtn,

  statusPill: bookingsTableTheme.statusPill,

  statusActive: {
    background: "rgba(16,185,129,0.16)",
    color: "#6EE7B7",
    border: "1px solid rgba(16,185,129,0.22)",
  },

  statusDisabled: {
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },

  empty: bookingsTableTheme.emptyCell,

  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "#2563EB",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
  },

  modal: {
    width: 420,
    background: "var(--surface-2)",
    border: "1px solid var(--glass-10)",
    borderRadius: 18,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  btnGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid var(--glass-10)",
    color: "var(--foreground)",
    cursor: "pointer",
  },
};

export default styles;
