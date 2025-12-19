import type { CSSProperties } from "react";

const card: CSSProperties = {
  background: "#0F172A",
  borderRadius: 16,
  padding: 20,
};

const title: CSSProperties = {
  fontSize: 13,
  color: "#9CA3AF",
};

const value: CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
  margin: "6px 0",
};

const change: CSSProperties = {
  fontSize: 12,
  color: "#22C55E",
};

export default {
  card,
  title,
  value,
  change,
} as const;
