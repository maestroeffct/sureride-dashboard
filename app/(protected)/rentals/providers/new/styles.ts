import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    background: "var(--background)",
    overflow: "hidden", // page does NOT scroll — cardBody scrolls instead
  },

  // ── Top header ────────────────────────────────────────────────
  header: {
    padding: "20px 28px 0",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    flexShrink: 0,
  },

  backBtn: {
    width: "fit-content",
    background: "transparent",
    border: "none",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    padding: 0,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: 750,
    margin: 0,
    letterSpacing: -0.4,
  },

  subtitle: {
    color: "var(--muted-foreground)",
    margin: "4px 0 0",
    fontSize: 13,
  },

  statusBadge: {
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    border: "1px solid var(--input-border)",
    flexShrink: 0,
    height: "fit-content",
  },

  statusDraft: {
    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
    color: "var(--brand-primary)",
    borderColor: "color-mix(in srgb, var(--brand-primary) 30%, transparent)",
  },
  statusPending: {
    background: "rgba(251,191,36,0.12)",
    color: "#FBBF24",
    borderColor: "rgba(251,191,36,0.30)",
  },

  // ── Stepper ───────────────────────────────────────────────────
  stepperWrap: {
    padding: "18px 28px",
    flexShrink: 0,
  },

  // ── Content card ──────────────────────────────────────────────
  card: {
    margin: "0 28px 28px",
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,   // allows flex child to shrink below content height
    overflow: "hidden",
  },

  cardBody: {
    padding: "28px 28px 24px",
    flex: 1,
    minHeight: 0,
    overflowY: "auto", // THIS is the scroll container
  },

  // ── Card footer / actions ────────────────────────────────────
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    gap: 12,
    flexShrink: 0,
  },

  footerLeft: {
    display: "flex",
    gap: 10,
  },

  footerRight: {
    display: "flex",
    gap: 10,
  },

  btnCancel: {
    background: "transparent",
    border: "1px solid var(--input-border)",
    color: "var(--muted-foreground)",
    padding: "9px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },

  btnDraft: {
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    color: "var(--foreground)",
    padding: "9px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },

  btnBack: {
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    color: "var(--foreground)",
    padding: "9px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },

  btnNext: {
    background: "var(--brand-primary)",
    border: "none",
    color: "#fff",
    padding: "9px 22px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 650,
  },

  btnNextDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
};
