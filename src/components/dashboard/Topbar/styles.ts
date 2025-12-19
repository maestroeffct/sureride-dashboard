import type { CSSProperties } from "react";

const container: CSSProperties = {
  height: 72,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  background: "rgba(11, 14, 20, 0.65)",
  backdropFilter: "blur(16px)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const left: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const right: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

/* SEARCH */
const searchPill: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  height: 42,
  width: 340,
  padding: "0 16px",
  borderRadius: 999,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
};

const searchIcon: CSSProperties = {
  color: "rgba(229,231,235,0.7)",
};

const searchInput: CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#E5E7EB",
  fontSize: 13,
};

const searchButton: CSSProperties = {
  height: 42,
  padding: "0 18px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#E5E7EB",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

/* ICON GROUPS */
const iconGroup: CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 42,
  padding: "0 6px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const iconButton: CSSProperties = {
  position: "relative",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "rgba(229,231,235,0.75)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconActive: CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  color: "#FFFFFF",
};

const divider: CSSProperties = {
  width: 1,
  height: 20,
  background: "rgba(255,255,255,0.12)",
};

const notificationDot: CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#EF4444",
};

const profileWrapper: CSSProperties = {
  position: "relative",
};

const profileButton: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "#E5E7EB",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dropdown: CSSProperties = {
  position: "absolute",
  top: 52,
  right: 0,
  minWidth: 180,
  padding: "8px",
  borderRadius: 14,
  background: "rgba(15, 23, 42, 0.95)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
  zIndex: 50,
};

const dropdownItem: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  background: "transparent",
  border: "none",
  color: "#E5E7EB",
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const dropdownDivider: CSSProperties = {
  height: 1,
  margin: "6px 0",
  background: "rgba(255,255,255,0.08)",
};

export default {
  container,
  left,
  right,
  searchPill,
  searchIcon,
  searchInput,
  searchButton,
  iconGroup,
  iconButton,
  iconActive,
  divider,
  notificationDot,
  profileWrapper,
  profileButton,
  dropdown,
  dropdownItem,
  dropdownDivider,
} as const;
