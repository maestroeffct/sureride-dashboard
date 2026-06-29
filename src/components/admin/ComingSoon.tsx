"use client";

import { CSSProperties } from "react";
import { Construction } from "lucide-react";

/**
 * Placeholder for sidebar entries whose admin surface hasn't shipped yet.
 * Keeps the nav scannable while the underlying tables/endpoints are still
 * being built. Use sparingly — every visible-but-empty page is a small
 * trust hit; replace with the real screen as soon as data is wired.
 */
export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.iconWrap}>
          <Construction size={28} />
        </div>
        <h1 style={s.title}>{title}</h1>
        <p style={s.body}>
          {description ??
            "This section is under construction. We'll wire it up once the data sources land."}
        </p>
        <span style={s.tag}>Coming soon</span>
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 200px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    maxWidth: 480,
    width: "100%",
    background: "var(--surface-1)",
    border: "1px dashed var(--input-border)",
    borderRadius: 16,
    padding: "36px 28px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
    color: "var(--brand-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.3,
    color: "var(--foreground)",
  },
  body: {
    margin: 0,
    fontSize: 14,
    color: "var(--muted-foreground)",
    lineHeight: 1.55,
    maxWidth: 380,
  },
  tag: {
    marginTop: 4,
    padding: "4px 12px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.12)",
    color: "var(--brand-secondary)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
};
