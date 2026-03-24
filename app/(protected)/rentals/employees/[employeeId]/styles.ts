import { CSSProperties } from "react";

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1200,
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "var(--foreground)",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "var(--fg-60)",
  },

  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  actionBtn: {
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "9px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  activateBtn: {
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
  },

  suspendBtn: {
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
  },

  resetBtn: {
    border: "1px solid rgba(59,130,246,0.45)",
    background: "rgba(59,130,246,0.16)",
    color: "#93C5FD",
  },

  select: {
    height: 40,
    minWidth: 220,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 14,
  },

  card: {
    borderRadius: 16,
    background: "var(--glass-04)",
    border: "1px solid var(--glass-08)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "var(--foreground)",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 13,
  },

  rowLabel: {
    color: "var(--fg-60)",
  },

  rowValue: {
    color: "var(--foreground)",
    fontWeight: 600,
    textAlign: "right",
    wordBreak: "break-word",
  },

  permissionWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },

  permissionPill: {
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 11,
    border: "1px solid var(--glass-10)",
    color: "var(--fg-80)",
    background: "var(--glass-06)",
  },

  muted: {
    fontSize: 12,
    color: "var(--fg-60)",
  },

  loading: {
    borderRadius: 16,
    background: "var(--glass-04)",
    border: "1px solid var(--glass-08)",
    padding: 20,
    color: "var(--fg-70)",
  },
} satisfies Record<string, CSSProperties>;

export default styles;
