import { CSSProperties } from "react";

export default {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1200,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "#E5E7EB",
  },

  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "rgba(229,231,235,0.6)",
  },

  headerActions: {
    display: "flex",
    gap: 10,
  },

  exportWrap: {
    position: "relative",
  },

  exportButton: {
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
  },

  exportDropdown: {
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
  },

  exportItem: {
    width: "100%",
    padding: "12px 12px",
    textAlign: "left",
    border: "none",
    background: "transparent",
    color: "#E5E7EB",
    cursor: "pointer",
    fontSize: 13,
  },

  filtersButton: {
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
  },

  actionBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#E5E7EB",
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },

  tabs: {
    display: "flex",
    gap: 24,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  tab: {
    padding: "10px 0",
    background: "transparent",
    border: "none",
    color: "rgba(229,231,235,0.6)",
    fontSize: 15,
    cursor: "pointer",
  },

  tabActive: {
    color: "#3B82F6",
    borderBottom: "2px solid #3B82F6",
  },

  //   card: {
  //     borderRadius: 16,
  //     border: "1px solid rgba(255,255,255,0.08)",
  //     background: "rgba(255,255,255,0.04)",
  //     overflow: "hidden",
  //   },

  //   searchRow: {
  //     padding: 14,
  //   },

  //   search: {
  //     width: 320,
  //     padding: "10px 12px",
  //     borderRadius: 10,
  //     border: "1px solid rgba(255,255,255,0.12)",
  //     background: "rgba(255,255,255,0.06)",
  //     color: "#E5E7EB",
  //   },

  //   table: {
  //     width: "100%",
  //     borderCollapse: "collapse",
  //   },

  //   twoLine: {
  //     display: "flex",
  //     flexDirection: "column",
  //     gap: 4,
  //     fontSize: 13,
  //     color: "rgba(229,231,235,0.65)",
  //   },

  //   statusPill: {
  //     padding: "4px 10px",
  //     borderRadius: 999,
  //     fontSize: 12,
  //     fontWeight: 700,
  //   },

  //   statusPending: {
  //     background: "rgba(250,204,21,0.15)",
  //     color: "#FDE68A",
  //   },

  //   statusRejected: {
  //     background: "rgba(239,68,68,0.15)",
  //     color: "#FCA5A5",
  //   },

  //   actions: {
  //     display: "flex",
  //     justifyContent: "flex-end",
  //     gap: 8,
  //   },

  //   iconBtn: {
  //     width: 34,
  //     height: 34,
  //     borderRadius: 10,
  //     border: "1px solid rgba(255,255,255,0.12)",
  //     background: "rgba(255,255,255,0.06)",
  //     color: "#E5E7EB",
  //     cursor: "pointer",
  //   },

  //   empty: {
  //     padding: 40,
  //     textAlign: "center",
  //     color: "rgba(229,231,235,0.6)",
  //   },

  card: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },

  searchRow: {
    padding: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  searchBox: {
    height: 48,
    width: 440,
    maxWidth: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#E5E7EB",
    padding: "0 14px",
    fontSize: 14,
  },

  searchIconWrap: {
    width: 52,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderLeft: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(229,231,235,0.8)",
  },

  tableWrap: {
    width: "100%",
    overflowX: "hidden", // ✅ no useless horizontal scroll
  },

  table: {
    width: "100%",
    borderCollapse: "separate", // ✅ needed for clean grid lines
    borderSpacing: 0,
  },

  theadRow: {
    background: "rgba(255,255,255,0.03)",
  },

  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(229,231,235,0.75)",
    borderBottom: "1px solid rgba(255,255,255,0.10)", // ✅ header line
    whiteSpace: "nowrap",
  },

  thRight: {
    textAlign: "right",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(229,231,235,0.75)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    whiteSpace: "nowrap",
  },

  tr: {
    transition: "background 0.15s ease",
  },

  trHover: {
    background: "rgba(255,255,255,0.03)", // ✅ hover row highlight
  },

  td: {
    padding: "14px 16px",
    fontSize: 13,
    color: "rgba(229,231,235,0.85)",
    borderBottom: "1px solid rgba(255,255,255,0.08)", // ✅ row line
    verticalAlign: "middle",
  },

  tdRight: {
    padding: "14px 16px",
    fontSize: 13,
    color: "rgba(229,231,235,0.85)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "middle",
    textAlign: "right",
  },

  // optional: subtle vertical dividers (makes it feel structured)
  tdDivider: {
    borderRight: "1px solid rgba(255,255,255,0.06)",
  },

  twoLine: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    lineHeight: 1.25,
  },

  primary: {
    fontWeight: 800,
    color: "#E5E7EB",
  },

  secondary: {
    fontSize: 12,
    color: "rgba(229,231,235,0.55)",
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.10)",
  },

  statusPending: {
    background: "rgba(250,204,21,0.14)",
    color: "#FDE68A",
    border: "1px solid rgba(250,204,21,0.22)",
  },

  statusRejected: {
    background: "rgba(239,68,68,0.14)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  iconBtn: {
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
  },

  empty: {
    padding: 44,
    textAlign: "center",
    color: "rgba(229,231,235,0.6)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
} satisfies Record<string, CSSProperties>;
