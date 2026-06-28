"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Mail,
  MapPin,
  Phone,
  Search,
  StickyNote,
  Users as UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  adminListLimousineRequests,
  adminUpdateLimousineRequest,
  type LimousineRequestRow,
  type LimousineRequestStatus,
} from "@/src/lib/limousineApi";

const STATUS_TABS: { value: LimousineRequestStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const NEXT_STATUS: Record<LimousineRequestStatus, LimousineRequestStatus[]> = {
  NEW: ["CONTACTED", "CANCELLED"],
  CONTACTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export default function LimousineRequestsPage() {
  const [tab, setTab] = useState<LimousineRequestStatus | "">("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<LimousineRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListLimousineRequests({
        status: tab,
        q: search.trim() || undefined,
        limit: 100,
      });
      setRows(res.items);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load limousine requests",
      );
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) map[r.status] = (map[r.status] || 0) + 1;
    return map;
  }, [rows]);

  const updateStatus = async (
    row: LimousineRequestRow,
    next: LimousineRequestStatus,
  ) => {
    try {
      setUpdatingId(row.id);
      await adminUpdateLimousineRequest(row.id, { status: next });
      toast.success(`Marked ${next.toLowerCase()}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={s.page}>
      <div>
        <h1 style={s.title}>
          <Crown size={20} color="var(--brand-secondary)" /> Limousine Requests
        </h1>
        <p style={s.subtitle}>
          Concierge requests from the in-app limousine banner. Reach out to
          customers, match them with a provider, and update status as you go.
        </p>
      </div>

      {/* Status tabs */}
      <div style={s.tabsRow}>
        {STATUS_TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value || "all"}
              type="button"
              onClick={() => setTab(t.value)}
              style={{
                ...s.tab,
                ...(active ? s.tabActive : {}),
              }}
            >
              {t.label}
              {t.value && counts[t.value] ? (
                <span style={s.tabCount}>{counts[t.value]}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={s.searchBox}>
        <Search size={16} color="var(--muted-foreground)" />
        <input
          style={s.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, pickup…"
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={s.empty}>No limousine requests in this view.</div>
      ) : (
        <div style={s.list}>
          {rows.map((row) => (
            <article key={row.id} style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <strong style={s.customerName}>{row.customerName}</strong>
                  <div style={s.metaRow}>
                    <span style={s.metaItem}>
                      <Mail size={12} /> {row.contactEmail}
                    </span>
                    <span style={s.metaItem}>
                      <Phone size={12} /> {row.contactPhone}
                    </span>
                  </div>
                </div>
                <StatusPill status={row.status} />
              </div>

              <div style={s.body}>
                <Field
                  icon={<Calendar size={13} />}
                  label="Pickup date"
                  value={fmtDate(row.pickupDate)}
                />
                <Field
                  icon={<Clock size={13} />}
                  label="Pickup time"
                  value={row.pickupTime}
                />
                <Field
                  icon={<MapPin size={13} />}
                  label="Pickup"
                  value={row.pickupLocation}
                />
                {row.dropoffLocation ? (
                  <Field
                    icon={<MapPin size={13} />}
                    label="Drop-off"
                    value={row.dropoffLocation}
                  />
                ) : null}
                <Field
                  icon={<UsersIcon size={13} />}
                  label="Passengers"
                  value={String(row.passengerCount)}
                />
                {row.eventType ? (
                  <Field
                    icon={<Crown size={13} />}
                    label="Event"
                    value={row.eventType}
                  />
                ) : null}
              </div>

              {row.notes ? (
                <div style={s.notesBlock}>
                  <span style={s.notesLabel}>
                    <StickyNote size={13} /> Notes
                  </span>
                  <p style={s.notesText}>{row.notes}</p>
                </div>
              ) : null}

              <div style={s.cardFooter}>
                <span style={s.timestamp}>
                  Submitted {fmtRelative(row.createdAt)}
                </span>
                <div style={s.actionsRow}>
                  {NEXT_STATUS[row.status].map((next) => (
                    <button
                      key={next}
                      type="button"
                      style={{
                        ...s.actionBtn,
                        ...(next === "CANCELLED"
                          ? s.actionBtnDanger
                          : s.actionBtnPrimary),
                        opacity: updatingId === row.id ? 0.55 : 1,
                      }}
                      disabled={updatingId === row.id}
                      onClick={() => void updateStatus(row, next)}
                    >
                      {next === "CONTACTED" ? (
                        <>
                          <Mail size={13} /> Mark Contacted
                        </>
                      ) : next === "CONFIRMED" ? (
                        <>
                          <CheckCircle2 size={13} /> Confirm
                        </>
                      ) : next === "COMPLETED" ? (
                        <>
                          <CheckCircle2 size={13} /> Complete
                        </>
                      ) : (
                        <>Cancel</>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: LimousineRequestStatus }) {
  const map: Record<LimousineRequestStatus, CSSProperties> = {
    NEW: {
      background: "rgba(34,197,94,0.16)",
      color: "#86EFAC",
      border: "1px solid rgba(34,197,94,0.35)",
    },
    CONTACTED: {
      background: "rgba(59,130,246,0.16)",
      color: "#93C5FD",
      border: "1px solid rgba(59,130,246,0.35)",
    },
    CONFIRMED: {
      background: "rgba(250,204,21,0.16)",
      color: "#FDE68A",
      border: "1px solid rgba(250,204,21,0.35)",
    },
    COMPLETED: {
      background: "rgba(148,163,184,0.18)",
      color: "#CBD5E1",
      border: "1px solid rgba(148,163,184,0.35)",
    },
    CANCELLED: {
      background: "rgba(239,68,68,0.16)",
      color: "#FCA5A5",
      border: "1px solid rgba(239,68,68,0.35)",
    },
  };
  return (
    <span
      style={{
        ...s.pill,
        ...map[status],
      }}
    >
      {status}
    </span>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={s.field}>
      <span style={s.fieldLabel}>
        {icon} {label}
      </span>
      <span style={s.fieldValue}>{value}</span>
    </div>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRelative(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100 },
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
    maxWidth: 720,
  },

  tabsRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  tabActive: {
    background: "var(--surface-2)",
    color: "var(--foreground)",
  },
  tabCount: {
    minWidth: 20,
    padding: "1px 6px",
    borderRadius: 999,
    background: "var(--brand-secondary)",
    color: "#022c22",
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
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

  empty: {
    padding: 44,
    textAlign: "center",
    color: "var(--muted-foreground)",
    border: "1px dashed var(--input-border)",
    borderRadius: 14,
    fontSize: 13,
  },

  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  customerName: { fontSize: 16, fontWeight: 700, color: "var(--foreground)" },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 14, marginTop: 4 },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "var(--muted-foreground)",
    fontSize: 13,
  },

  pill: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
  },

  body: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    padding: "12px 14px",
    background: "var(--surface-2)",
    borderRadius: 12,
  },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  fieldLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fieldValue: { fontSize: 14, color: "var(--foreground)", fontWeight: 500 },

  notesBlock: {
    padding: 12,
    borderLeft: "3px solid var(--brand-secondary)",
    background: "var(--surface-2)",
    borderRadius: 8,
  },
  notesLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "var(--brand-secondary)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  notesText: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "var(--foreground)",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },

  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTop: "1px solid var(--input-border)",
    flexWrap: "wrap",
    gap: 10,
  },
  timestamp: { fontSize: 12, color: "var(--muted-foreground)" },
  actionsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  actionBtnPrimary: {
    background: "var(--brand-secondary)",
    color: "#022c22",
    border: "none",
  },
  actionBtnDanger: {
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.45)",
  },
};
