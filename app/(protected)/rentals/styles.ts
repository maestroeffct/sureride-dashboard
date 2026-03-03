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
    color: "var(--muted-foreground)",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },

  kpiCard: {
    padding: 20,
    borderRadius: 14,
    background: "linear-gradient(180deg, var(--surface-2), var(--surface-2))",
    border: "1px solid var(--input-border)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  kpiLabel: {
    fontSize: 13,
    color: "var(--muted-foreground)",
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
    background: "var(--surface-2)",
    border: "1px dashed var(--input-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--muted-foreground)",
  },
};
