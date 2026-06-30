"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  ChevronUp,
  History,
  RotateCw,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listAuditLog,
  type AuditLogRow,
} from "@/src/lib/adminMaintenanceApi";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";

// Color tone per action category — keeps the pill scannable without
// inventing one color per verb.
function actionTone(action: string): { bg: string; fg: string; border: string } {
  if (action.startsWith("TABLE_") || action.includes("DELETE") || action.includes("REJECT") || action.includes("SUSPEND")) {
    return {
      bg: "rgba(239,68,68,0.14)",
      fg: "#fca5a5",
      border: "rgba(239,68,68,0.35)",
    };
  }
  if (action.includes("APPROVE") || action.includes("VERIFY") || action.includes("ACTIVATE")) {
    return {
      bg: "rgba(34,197,94,0.14)",
      fg: "#86efac",
      border: "rgba(34,197,94,0.35)",
    };
  }
  if (action.includes("PASSWORD") || action.includes("RESET")) {
    return {
      bg: "rgba(250,204,21,0.14)",
      fg: "#fde68a",
      border: "rgba(250,204,21,0.35)",
    };
  }
  return {
    bg: "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
    fg: "var(--brand-primary)",
    border: "color-mix(in srgb, var(--brand-primary) 35%, transparent)",
  };
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAuditLog({
        q: search.trim() || undefined,
        action: actionFilter || undefined,
        limit: 100,
      });
      setRows(res.items);
      setTotal(res.meta.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  // Unique action verbs in the current page — feeds the filter dropdown.
  const actions = Array.from(new Set(rows.map((r) => r.action))).sort();

  // Counts for the KPI tiles — using the loaded page, not server-wide.
  const kpi = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayCount = 0;
    let destructive = 0;
    const actors = new Set<string>();
    for (const r of rows) {
      if (new Date(r.createdAt).getTime() >= today.getTime()) todayCount += 1;
      if (
        r.action === "TABLE_WIPE" ||
        r.action.includes("REJECTED") ||
        r.action.includes("SUSPENDED") ||
        r.action.includes("DELETED")
      ) destructive += 1;
      actors.add(r.adminEmail);
    }
    return { todayCount, destructive, actors: actors.size, total };
  })();

  return (
    <div style={s.page}>
      <div>
        <h1 style={s.title}>
          <History size={20} color="var(--brand-primary)" /> Admin Audit Log
        </h1>
        <p style={s.subtitle}>
          Every admin action that mutates state — approvals, rejections,
          suspensions, KYC decisions, table wipes — lands here with the
          actor&apos;s email, request context, and a structured details payload.
        </p>
      </div>

      <KpiGrid>
        <KpiCard
          label="Entries (this page)"
          value={rows.length}
          subtext={`${kpi.total.toLocaleString()} total in DB`}
          icon={<History size={18} />}
          tone="var(--brand-primary)"
        />
        <KpiCard
          label="Today"
          value={kpi.todayCount}
          subtext="Actions logged since midnight"
          icon={<RotateCw size={18} />}
          tone="#22c55e"
        />
        <KpiCard
          label="Destructive"
          value={kpi.destructive}
          subtext="Wipes, rejections, suspensions, deletes"
          icon={<History size={18} />}
          tone="#ef4444"
        />
        <KpiCard
          label="Unique actors"
          value={kpi.actors}
          subtext="Distinct admin emails on this page"
          icon={<History size={18} />}
          tone="#7c3aed"
        />
      </KpiGrid>

      <div style={s.filters}>
        <div style={s.searchBox}>
          <Search size={16} color="var(--muted-foreground)" />
          <input
            style={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search summary, admin email, target id…"
          />
        </div>
        <select
          style={s.select}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="hover-soft"
          style={s.refreshBtn}
          onClick={() => void load()}
          title="Refresh"
        >
          <RotateCw size={14} />
        </button>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={s.empty}>No audit entries match this view.</div>
        ) : (
          <div>
            {rows.map((r) => {
              const tone = actionTone(r.action);
              const expanded = expandedId === r.id;
              const hasDetails = r.details && Object.keys(r.details).length > 0;
              return (
                <div key={r.id} style={s.row}>
                  <div style={s.rowTop}>
                    <span
                      style={{
                        ...s.actionPill,
                        background: tone.bg,
                        color: tone.fg,
                        border: `1px solid ${tone.border}`,
                      }}
                    >
                      {r.action.replace(/_/g, " ")}
                    </span>
                    <span style={s.summary}>{r.summary}</span>
                    <span style={s.when}>
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={s.rowMeta}>
                    <span style={s.metaItem}>
                      by <strong>{r.adminEmail}</strong>
                    </span>
                    {r.targetType ? (
                      <span style={s.metaItem}>
                        {r.targetType}
                        {r.targetId ? ` · ${r.targetId.slice(0, 8)}…` : ""}
                      </span>
                    ) : null}
                    {r.ipAddress ? (
                      <span style={s.metaItem}>{r.ipAddress}</span>
                    ) : null}
                    {hasDetails ? (
                      <button
                        type="button"
                        className="hover-soft"
                        style={s.expandBtn}
                        onClick={() =>
                          setExpandedId(expanded ? null : r.id)
                        }
                      >
                        {expanded ? (
                          <>
                            <ChevronUp size={12} /> Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> Details
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                  {expanded && hasDetails ? (
                    <pre style={s.detailsBox}>
                      {JSON.stringify(r.details, null, 2)}
                    </pre>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1200 },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 750,
    letterSpacing: -0.4,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "var(--muted-foreground)",
    fontSize: 13,
    maxWidth: 760,
  },
  filters: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    flex: "1 1 280px",
    minWidth: 240,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 14,
  },
  select: {
    height: 44,
    minWidth: 200,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    fontSize: 13,
    outline: "none",
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    overflow: "hidden",
  },
  empty: {
    padding: 44,
    textAlign: "center",
    color: "var(--muted-foreground)",
    fontSize: 13,
  },
  row: {
    padding: "14px 18px",
    borderBottom: "1px solid var(--input-border)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  rowTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  actionPill: {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
  },
  summary: { flex: 1, fontSize: 14, color: "var(--foreground)", minWidth: 240 },
  when: { fontSize: 12, color: "var(--muted-foreground)", whiteSpace: "nowrap" },
  rowMeta: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  metaItem: { whiteSpace: "nowrap" },
  expandBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  detailsBox: {
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    color: "var(--foreground)",
    overflow: "auto",
    maxHeight: 280,
    margin: 0,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
};
