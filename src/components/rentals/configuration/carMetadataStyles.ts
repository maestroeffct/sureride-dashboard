import type { CSSProperties } from "react";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1240,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--foreground)",
    margin: 0,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "var(--fg-65)",
    marginTop: 6,
    maxWidth: 720,
  },

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
    fontSize: 14,
  },

  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "var(--glass-06)",
    color: "var(--foreground)",
    border: "1px solid var(--glass-10)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
    fontSize: 14,
  },

  notice: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(37,99,235,0.22)",
    background: "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(15,23,42,0.22))",
    color: "var(--foreground)",
  },

  noticeText: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  noticeTitle: {
    fontWeight: 700,
    fontSize: 14,
  },

  noticeSubtitle: {
    color: "var(--fg-65)",
    fontSize: 13,
  },

  sourceBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(15,23,42,0.45)",
    border: "1px solid var(--glass-10)",
    fontSize: 12,
    fontWeight: 700,
    color: "#BFDBFE",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },

  summaryCard: {
    borderRadius: 18,
    border: "1px solid var(--glass-10)",
    background: "var(--surface-2)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  summaryValue: {
    fontSize: 26,
    fontWeight: 700,
    color: "var(--foreground)",
  },

  summaryLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  summaryHelper: {
    fontSize: 13,
    color: "var(--fg-65)",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  filters: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    minWidth: 280,
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

  select: {
    minWidth: 170,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },

  helperText: {
    fontSize: 13,
    color: "var(--fg-65)",
  },

  card: bookingsTableTheme.card,

  tableWrap: bookingsTableTheme.tableWrap,

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
    verticalAlign: "top",
  },

  tdRight: {
    ...bookingsTableTheme.tdRight,
    padding: "16px 18px",
    color: "var(--foreground)",
    verticalAlign: "top",
  },

  primaryText: {
    fontWeight: 700,
    color: "var(--foreground)",
    fontSize: 14,
  },

  secondaryText: {
    marginTop: 4,
    color: "var(--fg-65)",
    fontSize: 12,
    lineHeight: 1.5,
  },

  mutedText: {
    color: "var(--fg-60)",
    fontSize: 13,
  },

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

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  iconBtn: {
    ...bookingsTableTheme.iconBtn,
    cursor: "pointer",
  },

  empty: bookingsTableTheme.emptyCell,

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.7)",
    display: "grid",
    placeItems: "center",
    padding: 20,
    zIndex: 60,
  },

  modal: {
    width: "min(720px, 100%)",
    background: "var(--surface-2)",
    border: "1px solid var(--glass-10)",
    borderRadius: 22,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    boxShadow: "0 28px 80px rgba(15,23,42,0.45)",
  },

  modalHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--foreground)",
  },

  modalSubtitle: {
    color: "var(--fg-65)",
    fontSize: 13,
    lineHeight: 1.6,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },

  fieldSpan2: {
    gridColumn: "1 / -1",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--foreground)",
  },

  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: 96,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    resize: "vertical",
    outline: "none",
  },

  checkboxRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: "var(--foreground)",
    fontSize: 14,
    fontWeight: 500,
  },

  checkbox: {
    width: 16,
    height: 16,
    accentColor: "#2563EB",
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },

  btnGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid var(--glass-10)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontWeight: 600,
  },

  formHint: {
    color: "var(--fg-60)",
    fontSize: 12,
    lineHeight: 1.5,
  },

  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.65)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 70,
  },

  drawerPanel: {
    width: "min(720px, 100%)",
    height: "100vh",
    background: "var(--surface-2)",
    borderLeft: "1px solid var(--glass-10)",
    boxShadow: "-24px 0 64px rgba(15,23,42,0.35)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    overflowY: "auto",
  },

  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  drawerTitleWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  drawerTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "var(--foreground)",
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },

  importToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  importList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  importCard: {
    borderRadius: 16,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    padding: 14,
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },

  importCardBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  importCountPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 10px",
    borderRadius: 999,
    background: "var(--glass-06)",
    border: "1px solid var(--glass-10)",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--foreground)",
  },
};

export default styles;
