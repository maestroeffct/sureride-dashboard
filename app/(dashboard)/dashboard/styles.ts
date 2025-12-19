import type { CSSProperties } from "react";

const container: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const header: CSSProperties = {
  marginBottom: 8,
};

const title: CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
};

const subtitle: CSSProperties = {
  fontSize: 14,
  color: "#9CA3AF",
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const chartsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 16,
};

const chartCard: CSSProperties = {
  background: "#0F172A",
  borderRadius: 16,
  padding: 24,
  minHeight: 220,
};

const tableCard: CSSProperties = {
  background: "#0F172A",
  borderRadius: 16,
  padding: 24,
};

const tableRow: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 2fr 1fr",
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

export default {
  container,
  header,
  title,
  subtitle,
  statsGrid,
  chartsGrid,
  chartCard,
  tableCard,
  tableRow,
} as const;
