import type { CSSProperties } from "react";

const styles: Record<string, CSSProperties> = {
  /* PAGE */
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#E5E7EB",
  },

  subtitle: {
    fontSize: 13,
    color: "rgba(229,231,235,0.6)",
    marginTop: 4,
  },

  /* SEARCH */
  searchRow: {
    display: "flex",
    justifyContent: "space-between",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    width: 300,
  },

  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    color: "#E5E7EB",
    width: "100%",
    fontSize: 14,
  },

  /* CARD */
  card: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  /* TABLE */
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },

  thead: {
    background: "rgba(255,255,255,0.03)",
  },

  th: {
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(229,231,235,0.75)",
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  },

  tr: {
    transition: "background 0.15s ease",
  },

  td: {
    padding: "14px 16px",
    fontSize: 13,
    color: "rgba(229,231,235,0.85)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },

  strong: {
    fontWeight: 700,
    color: "#E5E7EB",
  },

  actionsCol: {
    textAlign: "right",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#E5E7EB",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* STATUS */
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.10)",
  },

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

  statusPending: {
    background: "rgba(250,204,21,0.14)",
    color: "#FDE68A",
    border: "1px solid rgba(250,204,21,0.20)",
  },

  /* BUTTONS */
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "#2563EB",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
    fontSize: 14,
  },

  empty: {
    padding: 28,
    textAlign: "center",
    color: "rgba(229,231,235,0.6)",
    fontSize: 14,
  },

  /* MODAL */
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
    background: "#020617",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  input: {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#E5E7EB",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },

  btnGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#E5E7EB",
    cursor: "pointer",
  },
};

export default styles;
