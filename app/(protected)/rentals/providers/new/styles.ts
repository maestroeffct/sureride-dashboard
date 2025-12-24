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
    color: "#9CA3AF",
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
    color: "#9CA3AF",
    marginTop: 6,
    marginBottom: 0,
  },

  statusBadge: {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #1F2937",
    height: "fit-content",
  },

  statusDraft: { background: "#0B1220", color: "#93C5FD" },
  statusPending: { background: "#111827", color: "#FBBF24" },

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
    background: "#020617",
    border: "1px solid #1F2937",
    borderRadius: 14,
    padding: 18,
    minHeight: 420,
  },
};
