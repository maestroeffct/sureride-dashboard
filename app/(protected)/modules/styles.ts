import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
    height: "100%",
    overflowY: "auto",
    padding: "32px 36px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
    background: "var(--background)",
  },

  header: {
    maxWidth: 680,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },

  title: {
    fontSize: 26,
    fontWeight: 750,
    margin: 0,
    letterSpacing: -0.5,
  },

  moduleCount: {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "var(--topbar-chip-bg)",
    border: "1px solid var(--topbar-chip-border)",
    color: "var(--muted-foreground)",
  },

  subtitle: {
    fontSize: 14,
    color: "var(--muted-foreground)",
    margin: "0 0 20px",
    lineHeight: 1.6,
  },

  search: {
    padding: "11px 16px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    width: "100%",
    maxWidth: 340,
    outline: "none",
    fontSize: 14,
  },

  grid: {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  },

  redirecting: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    color: "var(--muted-foreground)",
  },

  redirectSpinner: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "3px solid var(--topbar-chip-border)",
    borderTopColor: "var(--foreground)",
    animation: "spin 0.75s linear infinite",
  },

  redirectText: {
    fontSize: 14,
    opacity: 0.7,
  },
};
