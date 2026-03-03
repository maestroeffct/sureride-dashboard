import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    paddingBottom: 88, // space for sticky bar
  },

  topBar: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  backBtn: {
    width: "fit-content",
    background: "transparent",
    border: "none",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    padding: 0,
  },

  topBarRight: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
  },

  subtitle: {
    color: "var(--muted-foreground)",
    marginTop: 6,
    marginBottom: 0,
  },

  statusBadge: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid var(--input-border)",
    height: "fit-content",
  },

  statusDraft: { background: "var(--surface-1)", color: "#93C5FD" },
  statusPending: { background: "var(--surface-2)", color: "#FBBF24" },

  body: {
    display: "grid",
    gap: 18,
    alignItems: "start",
    transition: "grid-template-columns 0.25s ease",
  },

  left: {
    position: "sticky",
    top: 90,
    height: "fit-content",
  },

  right: {
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    padding: 18,
    minHeight: 420,
  },
};
