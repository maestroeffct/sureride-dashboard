import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
  },

  subtitle: {
    color: "#9CA3AF",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },

  kpiCard: {
    padding: 20,
    borderRadius: 14,
    background: "linear-gradient(180deg, #020617, #020617)",
    border: "1px solid #1F2937",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  kpiLabel: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  placeholder: {
    height: 140,
    borderRadius: 12,
    background: "#020617",
    border: "1px dashed #1F2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6B7280",
  },
};
