import type { CSSProperties } from "react";

const page: CSSProperties = {
  width: "100%",
  maxWidth: 1400,
  margin: "0 auto",
};

const headerRow: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 14,
};

const headerLeft: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const pageTitleRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const pageTitleIcon: CSSProperties = {
  color: "rgba(229,231,235,0.85)",
};

const pageTitle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#E5E7EB",
  letterSpacing: 0.2,
};

const countBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  color: "#E5E7EB",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const pageSubtitle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "rgba(229,231,235,0.65)",
};

const headerActions: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const exportWrap: CSSProperties = {
  position: "relative",
};

const exportButton: CSSProperties = {
  height: 44,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#E5E7EB",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  fontWeight: 600,
};

const exportDropdown: CSSProperties = {
  position: "absolute",
  top: 50,
  right: 0,
  width: 180,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(16,18,24,0.98)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  overflow: "hidden",
  zIndex: 50,
};

const exportItem: CSSProperties = {
  width: "100%",
  padding: "12px 12px",
  textAlign: "left",
  border: "none",
  background: "transparent",
  color: "#E5E7EB",
  cursor: "pointer",
  fontSize: 13,
};

const filtersButton: CSSProperties = {
  height: 44,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#E5E7EB",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  fontWeight: 600,
};

const tabsRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 14,
};

const tab: CSSProperties = {
  height: 40,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#E5E7EB",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
};

const tabActive: CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const tabLabel: CSSProperties = {
  fontWeight: 600,
};

const tabCount: CSSProperties = {
  minWidth: 26,
  height: 24,
  borderRadius: 999,
  padding: "0 8px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "rgba(229,231,235,0.85)",
};

const tabCountActive: CSSProperties = {
  background: "rgba(58, 237, 225, 0.18)",
  border: "1px solid rgba(58, 237, 225, 0.25)",
};

const card: CSSProperties = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const searchRow: CSSProperties = {
  padding: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const searchBox: CSSProperties = {
  height: 48,
  width: 440,
  maxWidth: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
};

const searchInput: CSSProperties = {
  flex: 1,
  height: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#E5E7EB",
  padding: "0 14px",
  fontSize: 14,
};

const searchIconWrap: CSSProperties = {
  width: 52,
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "1px solid rgba(255,255,255,0.10)",
  color: "rgba(229,231,235,0.8)",
};

const divider: CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.08)",
};

const tableWrap: CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: 1200,
};

const trHead: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
};

const th: CSSProperties = {
  textAlign: "left",
  fontSize: 13,
  fontWeight: 700,
  color: "rgba(229,231,235,0.75)",
  padding: "14px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
};

const thRight: CSSProperties = {
  ...th,
  textAlign: "right",
};

const tr: CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const td: CSSProperties = {
  padding: "14px 14px",
  fontSize: 13,
  color: "rgba(229,231,235,0.85)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const tdRight: CSSProperties = {
  ...td,
  textAlign: "right",
};

const tdStrong: CSSProperties = {
  ...td,
  fontWeight: 800,
  color: "#E5E7EB",
};

const twoLine: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const primaryText: CSSProperties = {
  fontWeight: 700,
  color: "#E5E7EB",
};

const secondaryText: CSSProperties = {
  fontSize: 12,
  color: "rgba(229,231,235,0.60)",
};

const amountBox: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 4,
};

const amountValue: CSSProperties = {
  fontWeight: 800,
  color: "#E5E7EB",
};

const paymentText: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
};

const paymentPaid: CSSProperties = { color: "#34D399" };
const paymentPending: CSSProperties = { color: "#FBBF24" };
const paymentFailed: CSSProperties = { color: "#EF4444" };
const paymentRefunded: CSSProperties = { color: "rgba(229,231,235,0.70)" };

const statusPill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 30,
  padding: "0 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.10)",
};

const statusUpcoming: CSSProperties = {
  background: "rgba(59, 130, 246, 0.16)",
  color: "#93C5FD",
  border: "1px solid rgba(59, 130, 246, 0.22)",
};

const statusActive: CSSProperties = {
  background: "rgba(168, 85, 247, 0.16)",
  color: "#D8B4FE",
  border: "1px solid rgba(168, 85, 247, 0.22)",
};

const statusCompleted: CSSProperties = {
  background: "rgba(16, 185, 129, 0.16)",
  color: "#6EE7B7",
  border: "1px solid rgba(16, 185, 129, 0.22)",
};

const statusCancelled: CSSProperties = {
  background: "rgba(239, 68, 68, 0.16)",
  color: "#FCA5A5",
  border: "1px solid rgba(239, 68, 68, 0.22)",
};

const statusIssue: CSSProperties = {
  background: "rgba(245, 158, 11, 0.16)",
  color: "#FCD34D",
  border: "1px solid rgba(245, 158, 11, 0.22)",
};

const statusPending: CSSProperties = {
  background: "rgba(250, 204, 21, 0.14)",
  color: "#FDE68A",
  border: "1px solid rgba(250, 204, 21, 0.20)",
};

const actionsRow: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const iconAction: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#E5E7EB",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const emptyCell: CSSProperties = {
  padding: 22,
  textAlign: "center",
  color: "rgba(229,231,235,0.65)",
};

export default {
  page,
  headerRow,
  headerLeft,
  pageTitleRow,
  pageTitleIcon,
  pageTitle,
  countBadge,
  pageSubtitle,
  headerActions,
  exportWrap,
  exportButton,
  exportDropdown,
  exportItem,
  filtersButton,
  tabsRow,
  tab,
  tabActive,
  tabLabel,
  tabCount,
  tabCountActive,
  card,
  searchRow,
  searchBox,
  searchInput,
  searchIconWrap,
  divider,
  tableWrap,
  table,
  trHead,
  th,
  thRight,
  tr,
  td,
  tdRight,
  tdStrong,
  twoLine,
  primaryText,
  secondaryText,
  amountBox,
  amountValue,
  paymentText,
  paymentPaid,
  paymentPending,
  paymentFailed,
  paymentRefunded,
  statusPill,
  statusUpcoming,
  statusActive,
  statusCompleted,
  statusCancelled,
  statusIssue,
  statusPending,
  actionsRow,
  iconAction,
  emptyCell,
} as const;
