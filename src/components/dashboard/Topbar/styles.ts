import type { CSSProperties } from "react";

const container: CSSProperties = {
  height: 72,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  background: "var(--topbar-bg)",
  backdropFilter: "blur(16px)",
  borderBottom: "1px solid var(--topbar-border)",
};

const left: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const menuButton: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: "1px solid var(--topbar-chip-border)",
  background: "var(--topbar-chip-bg)",
  color: "var(--topbar-icon-color)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const menuButtonActive: CSSProperties = {
  background: "var(--topbar-icon-active-bg)",
  color: "var(--topbar-icon-active-fg)",
};

const brandIcon: CSSProperties = {
  width: 34,
  height: 34,
  objectFit: "contain",
};

const brandName: CSSProperties = {
  width: 155,
  height: "auto",
};

const right: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const iconGroup: CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 42,
  padding: "0 6px",
  borderRadius: 999,
  background: "var(--topbar-chip-bg)",
  border: "1px solid var(--topbar-chip-border)",
};

const iconButton: CSSProperties = {
  position: "relative",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "var(--topbar-icon-color)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconActive: CSSProperties = {
  background: "var(--topbar-icon-active-bg)",
  color: "var(--topbar-icon-active-fg)",
};

const divider: CSSProperties = {
  width: 1,
  height: 20,
  background: "var(--topbar-divider)",
};

const notificationDot: CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#ef4444",
};

const profileWrapper: CSSProperties = {
  position: "relative",
};

const profileButton: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "1px solid var(--topbar-chip-border)",
  background: "var(--topbar-chip-bg)",
  color: "var(--topbar-dropdown-fg)",
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
  background: "var(--topbar-dropdown-bg)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--topbar-dropdown-border)",
  boxShadow: "var(--topbar-dropdown-shadow)",
  zIndex: 50,
};

const dropdownItem: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  background: "transparent",
  border: "none",
  color: "var(--topbar-dropdown-fg)",
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const dropdownDivider: CSSProperties = {
  height: 1,
  margin: "6px 0",
  background: "var(--topbar-chip-border)",
};

export default {
  container,
  left,
  menuButton,
  menuButtonActive,
  brandIcon,
  brandName,
  right,
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
