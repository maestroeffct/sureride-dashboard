import type { CSSProperties } from "react";

// /Users/maestroeffect/Desktop/sureride-dashboard/app/(auth)/login/styles.ts

/**
 * Simple, dependency-free style objects for the login page.
 * These are plain React inline-style objects (CSSProperties) so they can be
 * used without additional styling libraries.
 */

export const container: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
  fontFamily:
    "Inter, Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial",
};

export const card: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  borderRadius: 12,
  background: "#FFFFFF",
  boxShadow: "0 6px 24px rgba(16,24,40,0.08)",
  padding: 28,
  boxSizing: "border-box",
};

export const header: CSSProperties = {
  marginBottom: 20,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

export const title: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  color: "#0F172A",
};

export const subtitle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#475569",
};

export const form: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

export const label: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#0F172A",
  marginBottom: 6,
  fontWeight: 500,
};

export const input: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  borderRadius: 8,
  border: "1px solid #E6E9EE",
  outline: "none",
  boxSizing: "border-box",
  transition: "box-shadow 120ms ease, border-color 120ms ease",
};

export const inputFocus: CSSProperties = {
  borderColor: "#4F46E5",
  boxShadow: "0 0 0 4px rgba(79,70,229,0.06)",
};

export const actions: CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 6,
  alignItems: "center",
  justifyContent: "space-between",
};

export const primaryButton: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "#4F46E5",
  color: "#FFFFFF",
  padding: "10px 14px",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
};

export const ghostButton: CSSProperties = {
  appearance: "none",
  border: "1px solid #E6E9EE",
  background: "transparent",
  color: "#0F172A",
  padding: "10px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
};

export const helperRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  color: "#475569",
  marginTop: 6,
};

export const errorText: CSSProperties = {
  color: "#B91C1C",
  fontSize: 13,
  marginTop: 6,
};

export const smallNote: CSSProperties = {
  fontSize: 12,
  color: "#6B7280",
  textAlign: "center",
  marginTop: 12,
};

export default {
  container,
  card,
  header,
  title,
  subtitle,
  form,
  label,
  input,
  inputFocus,
  actions,
  primaryButton,
  ghostButton,
  helperRow,
  errorText,
  smallNote,
} as const;
