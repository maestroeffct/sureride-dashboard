import type { CSSProperties } from "react";

const container: CSSProperties = {
  width: 260,
  height: "100vh",
  background: "linear-gradient(180deg, #0B0E14 0%, #0E1320 100%)",
  display: "flex",
  flexDirection: "column",
  padding: "20px 14px",
  boxSizing: "border-box",
};

const logoRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 28,
  paddingLeft: 6,
};

const logoIcon: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
};

const logoText: CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#E5E7EB",
};

const menu: CSSProperties = {
  flex: 1,
  overflowY: "auto",
};

const section: CSSProperties = {
  marginBottom: 22,
};

const sectionLabel: CSSProperties = {
  fontSize: 11,
  color: "#6B7280",
  marginBottom: 8,
  paddingLeft: 8,
  letterSpacing: 0.8,
};

const item: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  cursor: "pointer",
  color: "#D1D5DB",
  fontSize: 14,
  transition: "background 0.15s ease",
};

const itemActive: CSSProperties = {
  background: "rgba(124, 58, 237, 0.15)",
  color: "#FFFFFF",
};

const itemIcon: CSSProperties = {
  width: 20,
  textAlign: "center",
};

const footer: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 10px",
  borderTop: "1px solid rgba(255,255,255,0.05)",
};

const avatar: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#374151",
};

const userName: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
};

const userRole: CSSProperties = {
  fontSize: 11,
  color: "#9CA3AF",
};

export default {
  container,
  logoRow,
  logoIcon,
  logoText,
  menu,
  section,
  sectionLabel,
  item,
  itemActive,
  itemIcon,
  footer,
  avatar,
  userName,
  userRole,
} as const;
