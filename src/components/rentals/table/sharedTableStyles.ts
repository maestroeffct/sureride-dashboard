import type { CSSProperties } from "react";

export const bookingsTableTheme = {
  card: {
    borderRadius: 18,
    background: "var(--glass-04)",
    border: "1px solid var(--glass-08)",
    overflow: "hidden",
  } satisfies CSSProperties,

  tableWrap: {
    width: "100%",
    overflowX: "auto",
  } satisfies CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  } satisfies CSSProperties,

  theadRow: {
    background: "var(--glass-03)",
  } satisfies CSSProperties,

  th: {
    textAlign: "left",
    padding: "14px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--fg-75)",
    borderBottom: "1px solid var(--glass-08)",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,

  thRight: {
    textAlign: "right",
    padding: "14px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--fg-75)",
    borderBottom: "1px solid var(--glass-08)",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,

  tr: {
    borderBottom: "1px solid var(--glass-06)",
    transition: "background 0.15s ease",
  } satisfies CSSProperties,

  trHover: {
    background: "var(--glass-03)",
  } satisfies CSSProperties,

  td: {
    padding: "14px 14px",
    fontSize: 13,
    color: "var(--fg-85)",
    borderBottom: "1px solid var(--glass-06)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,

  tdRight: {
    padding: "14px 14px",
    fontSize: 13,
    color: "var(--fg-85)",
    borderBottom: "1px solid var(--glass-06)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    textAlign: "right",
  } satisfies CSSProperties,

  tdDivider: {
    borderRight: "1px solid var(--glass-06)",
  } satisfies CSSProperties,

  tdStrong: {
    padding: "14px 14px",
    fontSize: 13,
    fontWeight: 800,
    color: "var(--foreground)",
    borderBottom: "1px solid var(--glass-06)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,

  twoLine: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    lineHeight: 1.25,
  } satisfies CSSProperties,

  primaryText: {
    fontWeight: 700,
    color: "var(--foreground)",
  } satisfies CSSProperties,

  secondaryText: {
    fontSize: 12,
    color: "var(--fg-60)",
  } satisfies CSSProperties,

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  } satisfies CSSProperties,

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid var(--glass-10)",
  } satisfies CSSProperties,

  emptyCell: {
    padding: 28,
    textAlign: "center",
    color: "var(--fg-65)",
  } satisfies CSSProperties,
} as const;
