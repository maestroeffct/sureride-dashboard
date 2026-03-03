import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
    padding: 30,
    display: "flex",
    flexDirection: "column",
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
    color: "var(--muted-foreground)",
    marginBottom: 20,
  },

  search: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
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
