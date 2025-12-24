import { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
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
    margin: 0,
  },

  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },

  headerActions: {
    display: "flex",
    gap: 10,
  },

  ghostBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    background: "#020617",
    border: "1px solid #1F2937",
    color: "#E5E7EB",
    cursor: "pointer",
  },

  outlineBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    background: "transparent",
    border: "1px solid #334155",
    color: "#E5E7EB",
    cursor: "pointer",
  },

  searchWrap: {
    maxWidth: 320,
  },

  search: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#0B1220",
    border: "1px solid #1F2937",
    color: "#E5E7EB",
  },

  tableWrap: {
    borderRadius: 16,
    background: "linear-gradient(180deg, #020617, #020617CC)",
    border: "1px solid #1F2937",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  row: {
    borderTop: "1px solid #1F2937",
  },

  primary: {
    fontSize: 14,
    color: "#E5E7EB",
    fontWeight: 500,
  },

  secondary: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  empty: {
    textAlign: "center",
    padding: 56,
    color: "#9CA3AF",
    fontSize: 14,
  },

  pending: {
    padding: "4px 12px",
    borderRadius: 999,
    background: "#F59E0B22",
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: 500,
  },

  linkBtn: {
    background: "none",
    border: "none",
    color: "#60A5FA",
    cursor: "pointer",
    fontSize: 13,
  },
};
