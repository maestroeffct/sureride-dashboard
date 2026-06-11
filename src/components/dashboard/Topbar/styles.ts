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
  position: "sticky",
  top: 0,
  zIndex: 40,
};

const left: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: "0 0 auto",
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
  transition: "background 0.15s, color 0.15s",
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

// Center page title
const pageTitle: CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "baseline",
  gap: 6,
  pointerEvents: "none",
  userSelect: "none",
};

const pageTitleSection: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: 0.2,
  color: "var(--topbar-icon-color)",
  opacity: 0.7,
};

const pageTitleLabel: CSSProperties = {
  fontSize: 15,
  fontWeight: 650,
  letterSpacing: -0.2,
  color: "var(--topbar-dropdown-fg)",
};

const right: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: "0 0 auto",
};

const iconGroup: CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 42,
  padding: "0 6px",
  borderRadius: 999,
  background: "var(--topbar-chip-bg)",
  border: "1px solid var(--topbar-chip-border)",
  gap: 2,
};

const iconButton: CSSProperties = {
  position: "relative",
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "var(--topbar-icon-color)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s, color 0.15s",
};

const iconActive: CSSProperties = {
  background: "var(--topbar-icon-active-bg)",
  color: "var(--topbar-icon-active-fg)",
};

const divider: CSSProperties = {
  width: 1,
  height: 18,
  background: "var(--topbar-divider)",
  flexShrink: 0,
};

const notificationDot: CSSProperties = {
  position: "absolute",
  top: 7,
  right: 7,
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#ef4444",
  boxShadow: "0 0 0 2px var(--topbar-bg)",
};

// Profile button — shows avatar initials + name on desktop
const profileWrapper: CSSProperties = {
  position: "relative",
};

const profileButton: CSSProperties = {
  height: 42,
  padding: "0 12px 0 6px",
  borderRadius: 999,
  border: "1px solid var(--topbar-chip-border)",
  background: "var(--topbar-chip-bg)",
  color: "var(--topbar-dropdown-fg)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "background 0.15s",
};

const avatar: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "var(--topbar-icon-active-bg)",
  color: "var(--topbar-icon-active-fg)",
  fontSize: 11,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  letterSpacing: 0.5,
};

const profileName: CSSProperties = {
  fontSize: 13,
  fontWeight: 550,
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// Dropdown
const dropdown: CSSProperties = {
  position: "absolute",
  top: 52,
  right: 0,
  minWidth: 220,
  padding: "8px",
  borderRadius: 16,
  background: "var(--topbar-dropdown-bg)",
  backdropFilter: "blur(14px)",
  border: "1px solid var(--topbar-dropdown-border)",
  boxShadow: "var(--topbar-dropdown-shadow)",
  zIndex: 50,
};

const dropdownHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px 12px",
};

const dropdownAvatar: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "var(--topbar-icon-active-bg)",
  color: "var(--topbar-icon-active-fg)",
  fontSize: 13,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  letterSpacing: 0.5,
};

const dropdownUserInfo: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};

const dropdownUserName: CSSProperties = {
  fontSize: 13,
  fontWeight: 650,
  color: "var(--topbar-dropdown-fg)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dropdownUserEmail: CSSProperties = {
  fontSize: 11,
  color: "var(--topbar-icon-color)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dropdownRoleBadge: CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  marginTop: 4,
  padding: "2px 7px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  background: "var(--topbar-icon-active-bg)",
  color: "var(--topbar-icon-active-fg)",
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
  transition: "background 0.12s",
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
  pageTitle,
  pageTitleSection,
  pageTitleLabel,
  right,
  iconGroup,
  iconButton,
  iconActive,
  divider,
  notificationDot,
  profileWrapper,
  profileButton,
  avatar,
  profileName,
  dropdown,
  dropdownHeader,
  dropdownAvatar,
  dropdownUserInfo,
  dropdownUserName,
  dropdownUserEmail,
  dropdownRoleBadge,
  dropdownItem,
  dropdownDivider,
} as const;
