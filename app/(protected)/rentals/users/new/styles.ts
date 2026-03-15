import { CSSProperties } from "react";

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 960,
  },

  topLink: {
    fontSize: 14,
    color: "var(--fg-70)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    width: "fit-content",
  },

  header: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "var(--foreground)",
  },

  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "var(--fg-60)",
  },

  card: {
    borderRadius: 16,
    background: "var(--glass-04)",
    border: "1px solid var(--glass-08)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  label: {
    fontSize: 12,
    color: "var(--fg-65)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
    padding: "0 12px",
  },

  select: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
    padding: "0 12px",
  },

  checks: {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    alignItems: "center",
  },

  checkbox: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "var(--foreground)",
  },

  helper: {
    margin: 0,
    fontSize: 12,
    color: "var(--fg-60)",
  },

  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },

  btnSecondary: {
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  },

  btnPrimary: {
    borderRadius: 10,
    border: "1px solid rgba(37,99,235,0.55)",
    background: "#2563EB",
    color: "#fff",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
} satisfies Record<string, CSSProperties>;

export default styles;
