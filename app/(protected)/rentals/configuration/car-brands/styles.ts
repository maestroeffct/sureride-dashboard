import type { CSSProperties } from "react";

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

  title: { fontSize: 22, fontWeight: 700, color: "#E5E7EB" },
  subtitle: { fontSize: 13, color: "rgba(229,231,235,0.65)" },

  searchRow: { display: "flex" },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    width: 320,
  },

  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    color: "#E5E7EB",
    width: "100%",
    fontSize: 14,
  },

  card: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  },

  thead: {
    background: "rgba(255,255,255,0.04)",
  },

  th: {
    padding: "16px 18px",
    fontSize: 13,
    fontWeight: 700,
    color: "rgba(229,231,235,0.70)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  tr: {
    background: "rgba(255,255,255,0.015)",
    transition: "background 0.15s ease",
  },

  td: {
    padding: "16px 18px",
    fontSize: 13,
    color: "#E5E7EB",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },

  actionsCol: {
    width: 120,
    textAlign: "right",
  },

  brandCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(255,255,255,0.08)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  logoFallback: {
    fontWeight: 800,
    color: "#E5E7EB",
  },

  primaryText: {
    fontWeight: 700,
    color: "#E5E7EB",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#E5E7EB",
    cursor: "pointer",
  },

  statusPill: {
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
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

  empty: {
    padding: 28,
    textAlign: "center",
    color: "rgba(229,231,235,0.65)",
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
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#E5E7EB",
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
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#E5E7EB",
    cursor: "pointer",
  },
};

export default styles;
