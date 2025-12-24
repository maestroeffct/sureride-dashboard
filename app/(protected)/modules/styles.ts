import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
    padding: 30,
    display: "flex",
    flexDirection: "column",
    // alignItems: "center",
  },

  header: {
    width: "100%",
    marginBottom: 22,
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 20,
  },

  search: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #1F2937",
    background: "#020617",
    color: "#E5E7EB",
    width: "100%",
    maxWidth: 360,
    outline: "none",
  },
  grid: {
    width: "100%",
    display: "grid",
    gap: 30,
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  },
};
