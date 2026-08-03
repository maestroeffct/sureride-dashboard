"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Receipt,
  Search,
  User,
  X,
} from "lucide-react";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";
import {
  issueFine,
  listFines,
  updateFineStatus,
  type FineCategory,
  type FineRow,
  type FineStatus,
  type FineTargetType,
} from "@/src/lib/finesApi";
import { listAdminUsers } from "@/src/lib/usersApi";
import { listProviders } from "@/src/lib/providersApi";
import type { AdminUser } from "@/src/types/adminUser";

const CATEGORIES: { value: FineCategory; label: string }[] = [
  { value: "TRAFFIC_VIOLATION", label: "Traffic violation" },
  { value: "LATE_RETURN", label: "Late return" },
  { value: "DAMAGE", label: "Damage" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "MISSED_PICKUP", label: "Missed pickup" },
  { value: "CANCELLATION", label: "Cancellation" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS: { value: FineStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "WAIVED", label: "Waived" },
  { value: "DISPUTED", label: "Disputed" },
];

export default function AdminFinesPage() {
  const [rows, setRows] = useState<FineRow[]>([]);
  const [summary, setSummary] = useState({ openCount: 0, outstandingAmount: 0, dueThisWeek: 0, overdue: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FineStatus | "">("");
  const [target, setTarget] = useState<FineTargetType | "">("");
  const [loading, setLoading] = useState(true);
  const [openIssue, setOpenIssue] = useState(false);
  const [view, setView] = useState<FineRow | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listFines({
        q: search.trim() || undefined,
        status: status || undefined,
        targetType: target || undefined,
        limit: 100,
      });
      setRows(res.items);
      setSummary(res.summary);
    } catch (e: any) { toast.error(e?.message ?? "Failed to load fines"); }
    finally { setLoading(false); }
  }, [search, status, target]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}><Receipt size={22} color="var(--brand-primary)" /> Fines Management</h1>
          <p style={s.sub}>Every penalty across the platform — traffic tickets, late returns, damage claims, cleaning fees. Issue new ones, resolve disputes, mark paid or waive.</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpenIssue(true)}>
          <Plus size={16} /> Add Fine
        </button>
      </header>

      <KpiGrid>
        <KpiCard label="Open Fines" value={summary.openCount} subtext="Awaiting action" icon={<Clock size={18} />} tone="#f59e0b" />
        <KpiCard label="Outstanding Amount" value={`₦${Math.round(summary.outstandingAmount).toLocaleString()}`} subtext="Across all fines" icon={<Receipt size={18} />} tone="#ef4444" />
        <KpiCard label="Due This Week" value={summary.dueThisWeek} subtext="Next 7 days" icon={<Clock size={18} />} tone="#eab308" />
        <KpiCard label="Overdue" value={summary.overdue} subtext="Past due date" icon={<AlertTriangle size={18} />} tone="#ef4444" />
      </KpiGrid>

      <div style={s.filtersRow}>
        <div style={s.searchBox}>
          <Search size={16} color="var(--fg-60)" />
          <input
            style={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, reason, customer, provider…"
          />
        </div>
        <select style={s.select} value={status} onChange={(e) => setStatus(e.target.value as any)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value || "all"} value={o.value}>{o.label}</option>)}
        </select>
        <select style={s.select} value={target} onChange={(e) => setTarget(e.target.value as any)}>
          <option value="">All targets</option>
          <option value="USER">Customers</option>
          <option value="PROVIDER">Providers</option>
        </select>
      </div>

      <div style={bookingsTableTheme.card}>
        <div style={bookingsTableTheme.tableWrap}>
          <table style={bookingsTableTheme.table}>
            <thead>
              <tr style={bookingsTableTheme.theadRow}>
                <th style={bookingsTableTheme.th}>Reference</th>
                <th style={bookingsTableTheme.th}>Rental #</th>
                <th style={bookingsTableTheme.th}>Target</th>
                <th style={bookingsTableTheme.th}>Issued By</th>
                <th style={bookingsTableTheme.th}>Issue Date</th>
                <th style={bookingsTableTheme.th}>Due Date</th>
                <th style={bookingsTableTheme.th}>Status</th>
                <th style={bookingsTableTheme.th}>Amount</th>
                <th style={bookingsTableTheme.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={s.emptyCell}>Loading fines…</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 0 }}>
                    <div style={s.emptyState}>
                      <div style={s.emptyStateIcon}><AlertTriangle size={22} color="var(--muted-foreground)" /></div>
                      <strong style={{ fontSize: 15 }}>No fines found</strong>
                      <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "6px 0 0" }}>Get started by issuing your first fine</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} style={bookingsTableTheme.tr}>
                    <td style={bookingsTableTheme.tdStrong}>{r.reference ?? r.id.slice(0, 8)}</td>
                    <td style={bookingsTableTheme.td}>{r.bookingId?.slice(0, 8) ?? "—"}</td>
                    <td style={bookingsTableTheme.td}>
                      {r.targetType === "USER" && (r as any).user ? (
                        <div style={bookingsTableTheme.twoLine}>
                          <span style={bookingsTableTheme.primaryText}><User size={12} style={{ display: "inline", marginRight: 4 }} />{(r as any).user.firstName} {(r as any).user.lastName}</span>
                          <span style={bookingsTableTheme.secondaryText}>{(r as any).user.email}</span>
                        </div>
                      ) : r.targetType === "PROVIDER" && (r as any).provider ? (
                        <div style={bookingsTableTheme.twoLine}>
                          <span style={bookingsTableTheme.primaryText}><Building2 size={12} style={{ display: "inline", marginRight: 4 }} />{(r as any).provider.name}</span>
                          <span style={bookingsTableTheme.secondaryText}>{(r as any).provider.email}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td style={bookingsTableTheme.td}>
                      <span style={issuerBadge(r)}>{r.issuedByAdminEmail ? "Admin" : "Provider"}</span>
                    </td>
                    <td style={bookingsTableTheme.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={bookingsTableTheme.td}>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}</td>
                    <td style={bookingsTableTheme.td}><span style={statusPill(r.status)}>{r.status}</span></td>
                    <td style={{ ...bookingsTableTheme.tdStrong, textAlign: "right" }}>{r.currency} {r.amount.toLocaleString()}</td>
                    <td style={bookingsTableTheme.tdRight}>
                      <button style={{ ...bookingsTableTheme.iconBtn, cursor: "pointer" }} onClick={() => setView(r)} title="View details">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openIssue && <IssueFineModal onClose={() => setOpenIssue(false)} onDone={() => { setOpenIssue(false); void load(); }} />}
      {view && <DetailModal fine={view} onClose={() => setView(null)} onResolved={() => { setView(null); void load(); }} />}
    </div>
  );
}

// ─── Issue Fine Modal (admin can target USER or PROVIDER) ─────────────────
function IssueFineModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [targetType, setTargetType] = useState<FineTargetType>("USER");
  const [targetId, setTargetId] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [providers, setProviders] = useState<{ id: string; name: string; email: string }[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState<FineCategory>("TRAFFIC_VIOLATION");
  const [reason, setReason] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingTargets(true);
    Promise.all([
      listAdminUsers({ limit: 500 }).catch(() => ({ items: [] as AdminUser[] })),
      listProviders({ limit: 500 }).catch(() => ({ items: [] as any[] })),
    ]).then(([u, p]) => {
      if (!mounted) return;
      setUsers(u.items ?? []);
      setProviders((p.items ?? []).map((r: any) => ({ id: r.id, name: r.name, email: r.email })));
    }).finally(() => { if (mounted) setLoadingTargets(false); });
    return () => { mounted = false; };
  }, []);

  const submit = async () => {
    if (!targetId) return toast.error("Pick a target");
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Amount must be > 0");
    if (reason.trim().length < 3) return toast.error("Reason is required");
    try {
      setBusy(true);
      await issueFine({
        targetType,
        userId: targetType === "USER" ? targetId : undefined,
        providerId: targetType === "PROVIDER" ? targetId : undefined,
        bookingId: bookingId.trim() || undefined,
        amount: amt,
        currency: currency.trim().toUpperCase(),
        category,
        reason: reason.trim(),
        adminNote: adminNote.trim() || undefined,
        dueDate: dueDate || undefined,
      });
      toast.success("Fine issued");
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div style={mo.backdrop} onClick={() => !busy && onClose()}>
      <div style={mo.card} onClick={(e) => e.stopPropagation()}>
        <div style={mo.header}>
          <div>
            <strong style={{ fontSize: 16 }}>Add Fine</strong>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>Issue a penalty against a customer or a rental provider.</div>
          </div>
          <button style={mo.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={mo.body}>
          <div style={mo.grid2}>
            <div>
              <label style={mo.label}>Target type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["USER", "PROVIDER"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setTargetType(v); setTargetId(""); }}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--input-border)",
                      background: targetType === v ? "color-mix(in srgb, var(--brand-primary) 14%, transparent)" : "transparent",
                      color: targetType === v ? "var(--brand-primary)" : "var(--muted-foreground)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {v === "USER" ? <><User size={13} /> Customer</> : <><Building2 size={13} /> Provider</>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={mo.label}>{targetType === "USER" ? "Customer" : "Provider"}</label>
              <select style={mo.input} value={targetId} onChange={(e) => setTargetId(e.target.value)} disabled={loadingTargets}>
                <option value="">{loadingTargets ? "Loading…" : "Select…"}</option>
                {targetType === "USER"
                  ? users.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} · {u.email}</option>)
                  : providers.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.email}</option>)}
              </select>
            </div>
          </div>
          <div style={mo.grid2}>
            <div>
              <label style={mo.label}>Category</label>
              <select style={mo.input} value={category} onChange={(e) => setCategory(e.target.value as FineCategory)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={mo.label}>Booking ID (optional)</label>
              <input style={mo.input} value={bookingId} onChange={(e) => setBookingId(e.target.value)} placeholder="Attach to a rental" />
            </div>
          </div>
          <div style={mo.grid3}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={mo.label}>Amount</label>
              <input style={mo.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={mo.label}>Currency</label>
              <input style={mo.input} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
            </div>
          </div>
          <div>
            <label style={mo.label}>Due date (optional)</label>
            <input style={mo.input} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label style={mo.label}>Reason (shown to recipient)</label>
            <textarea style={{ ...mo.input, height: 80 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Speeding ticket — Lagos-Ibadan Expressway" />
          </div>
          <div>
            <label style={mo.label}>Internal note (admins only)</label>
            <textarea style={{ ...mo.input, height: 56 }} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
          </div>
        </div>
        <div style={mo.footer}>
          <button style={mo.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={mo.primary} onClick={submit} disabled={busy}>{busy ? "Issuing…" : "Issue Fine"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── View / Resolve Modal ─────────────────────────────────────────────────
function DetailModal({ fine, onClose, onResolved }: { fine: FineRow; onClose: () => void; onResolved: () => void }) {
  const [busy, setBusy] = useState<null | "PAID" | "WAIVED">(null);
  const canResolve = fine.status === "PENDING" || fine.status === "OVERDUE" || fine.status === "DISPUTED";

  const resolve = async (nextStatus: "PAID" | "WAIVED") => {
    const verb = fine.status === "DISPUTED"
      ? nextStatus === "PAID" ? "Uphold and mark paid" : "Uphold dispute — waive fine"
      : nextStatus === "PAID" ? "Mark as paid" : "Waive fine";
    if (!confirm(`${verb}?`)) return;
    try {
      setBusy(nextStatus);
      await updateFineStatus(fine.id, { status: nextStatus });
      toast.success(nextStatus === "PAID" ? "Marked as paid" : "Waived");
      onResolved();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(null); }
  };

  const target = fine.targetType === "USER" && (fine as any).user
    ? `${(fine as any).user.firstName} ${(fine as any).user.lastName} · ${(fine as any).user.email}`
    : fine.targetType === "PROVIDER" && (fine as any).provider
    ? `${(fine as any).provider.name} · ${(fine as any).provider.email}`
    : "—";

  return (
    <div style={mo.backdrop} onClick={() => !busy && onClose()}>
      <div style={mo.card} onClick={(e) => e.stopPropagation()}>
        <div style={mo.header}>
          <div>
            <strong style={{ fontSize: 16 }}>{fine.reference ?? "Fine details"}</strong>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3 }}>Issued {new Date(fine.createdAt).toLocaleString()} by {fine.issuedByAdminEmail ?? fine.issuedByProviderEmail ?? "system"}</div>
          </div>
          <button style={mo.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={mo.body}>
          <div style={mo.grid2}>
            <div><div style={mo.label}>Amount</div><strong style={{ fontSize: 20 }}>{fine.currency} {fine.amount.toLocaleString()}</strong></div>
            <div><div style={mo.label}>Status</div><span style={statusPill(fine.status)}>{fine.status}</span></div>
          </div>
          <div style={mo.grid2}>
            <div><div style={mo.label}>Category</div>{CATEGORIES.find((c) => c.value === fine.category)?.label ?? fine.category}</div>
            <div><div style={mo.label}>Due date</div>{fine.dueDate ? new Date(fine.dueDate).toLocaleDateString() : "—"}</div>
          </div>
          <div><div style={mo.label}>Target ({fine.targetType})</div>{target}</div>
          {fine.bookingId && <div><div style={mo.label}>Booking</div>{fine.bookingId.slice(0, 8)}</div>}
          <div><div style={mo.label}>Reason</div><div style={{ padding: 10, background: "var(--surface-2)", borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>{fine.reason}</div></div>
          {fine.adminNote && <div><div style={mo.label}>Internal note</div><div style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>{fine.adminNote}</div></div>}
          {fine.status === "DISPUTED" && (
            <div style={{ padding: 12, background: "rgba(124,58,237,0.10)", borderLeft: "3px solid #a78bfa", borderRadius: 8 }}>
              <strong style={{ fontSize: 12, color: "#c4b5fd" }}>DISPUTED</strong>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>Recipient is contesting this fine. Uphold to keep it or waive to cancel.</p>
            </div>
          )}
        </div>
        {canResolve && (
          <div style={mo.footer}>
            <button style={{ ...mo.secondary, borderColor: "rgba(239,68,68,0.35)", color: "#fca5a5" }} onClick={() => void resolve("WAIVED")} disabled={!!busy}>
              <Ban size={14} /> {busy === "WAIVED" ? "Waiving…" : "Waive"}
            </button>
            <button style={mo.primary} onClick={() => void resolve("PAID")} disabled={!!busy}>
              <CheckCircle2 size={14} /> {busy === "PAID" ? "Marking…" : fine.status === "DISPUTED" ? "Uphold + Mark Paid" : "Mark Paid"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function statusPill(st: FineStatus): CSSProperties {
  const base: CSSProperties = { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
  const map: Record<FineStatus, [string, string]> = {
    PENDING: ["rgba(250,204,21,0.14)", "#fde68a"],
    OVERDUE: ["rgba(239,68,68,0.14)", "#fca5a5"],
    PAID: ["rgba(34,197,94,0.14)", "#86efac"],
    WAIVED: ["rgba(148,163,184,0.18)", "#cbd5e1"],
    DISPUTED: ["rgba(124,58,237,0.16)", "#c4b5fd"],
  };
  const [bg, color] = map[st];
  return { ...base, background: bg, color };
}

function issuerBadge(fine: FineRow): CSSProperties {
  const isAdmin = !!fine.issuedByAdminEmail;
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    background: isAdmin ? "color-mix(in srgb, var(--brand-primary) 14%, transparent)" : "rgba(148,163,184,0.18)",
    color: isAdmin ? "var(--brand-primary)" : "#cbd5e1",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1400 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.4, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  filtersRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  searchBox: { flex: "1 1 320px", minWidth: 280, height: 44, borderRadius: 12, border: "1px solid var(--glass-08)", background: "var(--glass-04)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--foreground)", fontSize: 14, height: "100%" },
  select: { height: 44, minWidth: 160, padding: "0 12px", borderRadius: 12, border: "1px solid var(--glass-08)", background: "var(--glass-04)", color: "var(--foreground)", fontSize: 13 },
  emptyCell: { padding: 30, textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 },
  emptyState: { padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  emptyStateIcon: { width: 60, height: 60, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 },
};

const mo: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 580, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 22px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 22, display: "flex", flexDirection: "column", gap: 14 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" as any },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: "1px solid var(--input-border)" },
  secondary: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
