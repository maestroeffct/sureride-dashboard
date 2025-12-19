import type { CSSProperties } from "react";

/* =========================
   SIDEBAR CONTAINER
========================= */

const container: CSSProperties = {
  width: 260,
  height: "100vh",
  background: "linear-gradient(180deg, #0B0E14 0%, #0E1320 100%)",
  display: "flex",
  flexDirection: "column",
  padding: "20px 14px",
  boxSizing: "border-box",
};

/* =========================
   LOGO
========================= */

const logoRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 24,
  paddingLeft: 6,
};

const logoText: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#E5E7EB",
  letterSpacing: 0.4,
};

/* =========================
   MENU
========================= */

const menu: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  paddingRight: 4,
};

/* =========================
   SECTION (COLLAPSIBLE)
========================= */

const section: CSSProperties = {
  marginBottom: 16,
};

const sectionHeader: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderRadius: 10,
  cursor: "pointer",
  background: "transparent",
  border: "none",
  color: "#CBD5E1",
  fontSize: 13,
  fontWeight: 500,
  transition: "background 0.15s ease, color 0.15s ease",
};

const sectionHeaderActive: CSSProperties = {
  background: "rgba(58, 237, 225, 0.12)",
  color: "#FFFFFF",
};

const sectionLeft: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const sectionItems: CSSProperties = {
  marginTop: 6,
  marginLeft: 18,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

/* =========================
   ITEM
========================= */

const item: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  color: "#D1D5DB",
  fontSize: 13,
  transition: "background 0.15s ease, color 0.15s ease",
};

const itemActive: CSSProperties = {
  background: "rgba(58, 237, 225, 0.18)",
  color: "#FFFFFF",
};

/* =========================
   FOOTER
========================= */

const footer: CSSProperties = {
  paddingTop: 12,
  borderTop: "1px solid rgba(255,255,255,0.06)",
};

const logoutButton: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  background: "rgba(239,68,68,0.12)",
  color: "#F87171",
  fontSize: 13,
  fontWeight: 500,
  transition: "background 0.15s ease",
};

const logoutButtonHover: CSSProperties = {
  background: "rgba(239,68,68,0.2)",
};

/* =========================
   EXPORT
========================= */

export default {
  container,
  logoRow,
  logoText,
  menu,

  section,
  sectionHeader,
  sectionHeaderActive,
  sectionLeft,
  sectionItems,

  item,
  itemActive,

  footer,
  logoutButton,
  logoutButtonHover,
} as const;
