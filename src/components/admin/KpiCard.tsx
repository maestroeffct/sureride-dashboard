"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Canonical KPI tile used across all admin + provider list pages.
 * Mirrors the design proven on the Admin Overview (Platform Revenue /
 * Total Users / Providers / Fleet Health). Single source of truth —
 * never inline another KPI card; always import this.
 *
 * Tones — pass any CSS colour (hex, `var(--brand-primary)`, etc.). The
 * card paints the icon in that colour and tints its background with the
 * same colour at ~9% opacity, so cards feel cohesive across surfaces.
 */
export default function KpiCard({
  label,
  value,
  subtext,
  icon,
  tone = "var(--brand-primary)",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <article style={styles.card}>
      <div
        style={{
          ...styles.iconWrap,
          color: tone,
          background: `color-mix(in srgb, ${tone} 18%, transparent)`,
        }}
      >
        {icon}
      </div>
      <div style={styles.text}>
        <span style={styles.label}>{label}</span>
        <strong style={styles.value}>{value}</strong>
        {subtext ? <span style={styles.subtext}>{subtext}</span> : null}
      </div>
    </article>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div style={styles.grid}>{children}</div>;
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  card: {
    borderRadius: 20,
    border: "1px solid var(--input-border)",
    background:
      "linear-gradient(180deg, var(--surface-1), rgba(15,23,42,0.02))",
    padding: 20,
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
  value: {
    fontSize: 28,
    lineHeight: 1.05,
    fontWeight: 800,
    color: "var(--foreground)",
  },
  subtext: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
};
