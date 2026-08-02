"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  MessageCircle,
  Plus,
  Receipt,
  Search,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
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
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";

const CATEGORIES: { value: FineCategory; label: string }[] = [
  { value: "TRAFFIC_VIOLATION", label: "Traffic violation" },
  { value: "LATE_RETURN", label: "Late return" },
  { value: "DAMAGE", label: "Damage" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "MISSED_PICKUP", label: "Missed pickup" },
  { value: "CANCELLATION", label: "Cancellation" },
  { value: "OTHER", label: "Other" },
];

const STATUS_FILTERS: { value: FineStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "WAIVED", label: "Waived" },
  { value: "DISPUTED", label: "Disputed" },
];

export default function FinesPage() {
  const [rows, setRows] = useState<FineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FineStatus | "">("");
  const [targetFilter, setTargetFilter] = useState<FineTargetType | "">("");
  const [openModal, setOpenModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listFines({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        targetType: targetFilter || undefined,
        limit: 100,
      });
      setRows(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load fines");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, targetFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const kpi = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let paidValue = 0;
    let pendingValue = 0;
    for (const r of rows) {
      if (r.status === "PENDING") {
        pending += 1;
        pendingValue += r.amount;
      }
      if (r.status === "OVERDUE") overdue += 1;
      if (r.status === "PAID") paidValue += r.amount;
    }
    return { total: rows.length, pending, overdue, paidValue, pendingValue };
  }, [rows]);

  const changeStatus = async (
    row: FineRow,
    next: "PAID" | "WAIVED" | "DISPUTED" | "PENDING",
    label: string,
  ) => {
    if (!confirm(`${label} this fine? This action is logged.`)) return;
    try {
      setBusyId(row.id);
      await updateFineStatus(row.id, { status: next });
      toast.success(`${label} — ${row.currency} ${row.amount.toLocaleString()}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>
            <Receipt size={20} color="var(--brand-primary)" /> Fines
          </h1>
          <p style={s.subtitle}>
            Traffic tickets, late returns, damage claims, cleaning fees. Issue
            a fine, track payment, waive or resolve disputes. Every action
            lands in the Audit Log.
          </p>
        </div>
        <button
          type="button"
          style={s.primaryBtn}
          onClick={() => setOpenModal(true)}
        >
          <Plus size={15} /> Issue Fine
        </button>
      </div>

      <KpiGrid>
        <KpiCard
          label="Total"
          value={kpi.total}
          subtext="In current view"
          icon={<Receipt size={18} />}
          tone="var(--brand-primary)"
        />
        <KpiCard
          label="Pending"
          value={kpi.pending}
          subtext={`Outstanding value: ${kpi.pendingValue.toLocaleString()}`}
          icon={<Clock size={18} />}
          tone="#f59e0b"
        />
        <KpiCard
          label="Overdue"
          value={kpi.overdue}
          subtext="Past due date, still unpaid"
          icon={<AlertTriangle size={18} />}
          tone="#ef4444"
        />
        <KpiCard
          label="Collected"
          value={kpi.paidValue.toLocaleString()}
          subtext="Total paid in this view"
          icon={<CheckCircle2 size={18} />}
          tone="#22c55e"
        />
      </KpiGrid>

      <div style={s.filters}>
        <div style={s.searchBox}>
          <Search size={16} color="var(--muted-foreground)" />
          <input
            style={s.searchInput}
            placeholder="Search reason, user email, provider name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          style={s.select}
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as FineStatus | "")
          }
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value || "all"} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          style={s.select}
          value={targetFilter}
          onChange={(e) =>
            setTargetFilter(e.target.value as FineTargetType | "")
          }
        >
          <option value="">All targets</option>
          <option value="USER">Customers</option>
          <option value="PROVIDER">Providers</option>
        </select>
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={s.empty}>No fines match this view.</div>
      ) : (
        <div style={s.list}>
          {rows.map((r) => (
            <article key={r.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.targetBlock}>
                  <span style={s.targetIcon}>
                    {r.targetType === "USER" ? (
                      <User size={16} />
                    ) : (
                      <Building2 size={16} />
                    )}
                  </span>
                  <div>
                    <strong style={s.targetName}>
                      {r.targetType === "USER"
                        ? `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim() ||
                          r.user?.email ||
                          "—"
                        : r.provider?.name ?? "—"}
                    </strong>
                    <div style={s.targetMeta}>
                      {r.targetType === "USER"
                        ? r.user?.email
                        : r.provider?.email}
                      {r.bookingId
                        ? ` · booking ${r.bookingId.slice(0, 8)}`
                        : ""}
                    </div>
                  </div>
                </div>
                <div style={s.amountBlock}>
                  <strong style={s.amount}>
                    {r.currency} {r.amount.toLocaleString()}
                  </strong>
                  <span style={statusStyle(r.status)}>{r.status}</span>
                </div>
              </div>

              <div style={s.body}>
                <div style={s.field}>
                  <span style={s.fieldLabel}>Category</span>
                  <span>{categoryLabel(r.category)}</span>
                </div>
                <div style={s.field}>
                  <span style={s.fieldLabel}>Issued</span>
                  <span>
                    {new Date(r.createdAt).toLocaleString()} · by{" "}
                    {r.issuedByAdminEmail}
                  </span>
                </div>
                {r.dueDate ? (
                  <div style={s.field}>
                    <span style={s.fieldLabel}>Due</span>
                    <span>{new Date(r.dueDate).toLocaleDateString()}</span>
                  </div>
                ) : null}
                {r.resolvedAt ? (
                  <div style={s.field}>
                    <span style={s.fieldLabel}>Resolved</span>
                    <span>
                      {new Date(r.resolvedAt).toLocaleString()} · by{" "}
                      {r.resolvedByAdminEmail}
                    </span>
                  </div>
                ) : null}
              </div>

              <div style={s.reasonBox}>
                <MessageCircle size={13} />
                <span>{r.reason}</span>
              </div>
              {r.adminNote ? (
                <div style={{ ...s.reasonBox, opacity: 0.7 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    INTERNAL NOTE
                  </span>
                  <span>{r.adminNote}</span>
                </div>
              ) : null}

              {r.status === "PENDING" || r.status === "OVERDUE" ? (
                <div style={s.actions}>
                  <button
                    type="button"
                    style={{ ...s.actionBtn, ...s.actionPrimary }}
                    disabled={busyId === r.id}
                    onClick={() => void changeStatus(r, "PAID", "Marked paid")}
                  >
                    <CheckCircle2 size={13} /> Mark paid
                  </button>
                  <button
                    type="button"
                    style={{ ...s.actionBtn, ...s.actionDanger }}
                    disabled={busyId === r.id}
                    onClick={() => void changeStatus(r, "WAIVED", "Waived")}
                  >
                    <Ban size={13} /> Waive
                  </button>
                </div>
              ) : r.status === "DISPUTED" ? (
                <div style={s.actions}>
                  <button
                    type="button"
                    style={{ ...s.actionBtn, ...s.actionPrimary }}
                    disabled={busyId === r.id}
                    onClick={() => void changeStatus(r, "PAID", "Marked paid")}
                  >
                    <CheckCircle2 size={13} /> Uphold + mark paid
                  </button>
                  <button
                    type="button"
                    style={{ ...s.actionBtn, ...s.actionDanger }}
                    disabled={busyId === r.id}
                    onClick={() =>
                      void changeStatus(r, "WAIVED", "Dispute upheld, waived")
                    }
                  >
                    <Ban size={13} /> Waive
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {openModal ? (
        <IssueFineModal
          onClose={() => setOpenModal(false)}
          onCreated={() => {
            setOpenModal(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function IssueFineModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [targetType, setTargetType] = useState<FineTargetType>("USER");
  const [targetId, setTargetId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("NGN");
  const [category, setCategory] = useState<FineCategory>("TRAFFIC_VIOLATION");
  const [reason, setReason] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [providers, setProviders] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [loadingTargets, setLoadingTargets] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingTargets(true);
    Promise.all([
      listAdminUsers({ limit: 500 }).catch(() => ({ items: [] as AdminUser[] })),
      listProviders({ limit: 500 }).catch(() => ({ items: [] as any[] })),
    ])
      .then(([u, p]) => {
        if (!mounted) return;
        setUsers(u.items ?? []);
        setProviders(
          (p.items ?? []).map((row: any) => ({
            id: row.id,
            name: row.name,
            email: row.email,
          })),
        );
      })
      .finally(() => {
        if (mounted) setLoadingTargets(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async () => {
    if (!targetId) return toast.error("Pick a target");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0)
      return toast.error("Amount must be > 0");
    if (reason.trim().length < 3) return toast.error("Reason is required");

    try {
      setSubmitting(true);
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
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Issue failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={m.backdrop} onClick={() => !submitting && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}>
          <strong style={{ fontSize: 16 }}>Issue Fine</strong>
          <button style={m.closeBtn} onClick={onClose} disabled={submitting}>
            <X size={16} />
          </button>
        </div>
        <div style={m.body}>
          <div style={m.grid2}>
            <div>
              <label style={m.label}>Target type</label>
              <div style={m.segRow}>
                {(["USER", "PROVIDER"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setTargetType(v);
                      setTargetId("");
                    }}
                    style={{
                      ...m.segBtn,
                      ...(targetType === v ? m.segBtnActive : {}),
                    }}
                  >
                    {v === "USER" ? (
                      <>
                        <User size={13} /> Customer
                      </>
                    ) : (
                      <>
                        <Building2 size={13} /> Provider
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={m.label}>
                {targetType === "USER" ? "Customer" : "Provider"}
              </label>
              <select
                style={m.input}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={loadingTargets}
              >
                <option value="">
                  {loadingTargets ? "Loading…" : "Select…"}
                </option>
                {targetType === "USER"
                  ? users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} · {u.email}
                      </option>
                    ))
                  : providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.email}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <div style={m.grid2}>
            <div>
              <label style={m.label}>Category</label>
              <select
                style={m.input}
                value={category}
                onChange={(e) => setCategory(e.target.value as FineCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={m.label}>Booking ID (optional)</label>
              <input
                style={m.input}
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Attach to a specific rental"
              />
            </div>
          </div>

          <div style={m.grid3}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={m.label}>Amount</label>
              <input
                style={m.input}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={m.label}>Currency</label>
              <input
                style={m.input}
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <label style={m.label}>Reason (shown to recipient)</label>
            <textarea
              style={{ ...m.input, height: 72, resize: "vertical" }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Speeding ticket — Lagos-Ibadan Expressway, licence plate LAG-123"
            />
          </div>

          <div>
            <label style={m.label}>Internal note (admins only, optional)</label>
            <textarea
              style={{ ...m.input, height: 56, resize: "vertical" }}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>

          <div style={m.grid2}>
            <div>
              <label style={m.label}>Due date (optional)</label>
              <input
                type="date"
                style={m.input}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div style={m.footer}>
          <button
            type="button"
            style={m.secondary}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            style={m.primary}
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Issuing…" : "Issue fine"}
          </button>
        </div>
      </div>
    </div>
  );
}

function categoryLabel(c: FineCategory): string {
  return CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

function statusStyle(status: FineStatus): CSSProperties {
  const base: CSSProperties = {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
  };
  switch (status) {
    case "PAID":
      return {
        ...base,
        background: "rgba(34,197,94,0.14)",
        color: "#86efac",
        border: "1px solid rgba(34,197,94,0.35)",
      };
    case "PENDING":
      return {
        ...base,
        background: "rgba(250,204,21,0.14)",
        color: "#fde68a",
        border: "1px solid rgba(250,204,21,0.35)",
      };
    case "OVERDUE":
      return {
        ...base,
        background: "rgba(239,68,68,0.14)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.35)",
      };
    case "WAIVED":
      return {
        ...base,
        background: "rgba(148,163,184,0.18)",
        color: "#cbd5e1",
        border: "1px solid rgba(148,163,184,0.35)",
      };
    case "DISPUTED":
      return {
        ...base,
        background: "rgba(124,58,237,0.16)",
        color: "#c4b5fd",
        border: "1px solid rgba(124,58,237,0.35)",
      };
  }
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1200 },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    flexWrap: "wrap",
  },
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
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#022c22",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  filters: { display: "flex", gap: 10, flexWrap: "wrap" },
  searchBox: {
    flex: "1 1 260px",
    minWidth: 240,
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
  select: {
    height: 44,
    minWidth: 160,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    fontSize: 13,
    outline: "none",
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
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  targetBlock: { display: "flex", gap: 12, alignItems: "flex-start" },
  targetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
    color: "var(--brand-primary)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  targetName: { fontSize: 15, fontWeight: 700, color: "var(--foreground)" },
  targetMeta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  amountBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  amount: { fontSize: 20, fontWeight: 800, color: "var(--foreground)" },

  body: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
    padding: "10px 14px",
    background: "var(--surface-2)",
    borderRadius: 10,
  },
  field: { display: "flex", flexDirection: "column", gap: 2 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "var(--muted-foreground)",
  },

  reasonBox: {
    display: "flex",
    gap: 8,
    padding: "10px 12px",
    borderLeft: "3px solid var(--brand-primary)",
    background: "var(--surface-2)",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.5,
    color: "var(--foreground)",
  },

  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    paddingTop: 8,
    borderTop: "1px solid var(--input-border)",
    flexWrap: "wrap",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
  },
  actionPrimary: {
    background: "var(--brand-primary)",
    color: "#022c22",
    border: "none",
  },
  actionDanger: {
    borderColor: "rgba(239,68,68,0.4)",
    color: "#fca5a5",
  },
};

const m: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.65)",
    zIndex: 80,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 24px",
    overflowY: "auto",
    backdropFilter: "blur(2px)",
  },
  card: {
    width: "100%",
    maxWidth: 640,
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 22px",
    borderBottom: "1px solid var(--input-border)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--muted-foreground)",
  },
  body: {
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  },
  segRow: { display: "flex", gap: 8 },
  segBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  segBtnActive: {
    background: "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
    color: "var(--brand-primary)",
    borderColor: "color-mix(in srgb, var(--brand-primary) 45%, transparent)",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "14px 22px",
    borderTop: "1px solid var(--input-border)",
  },
  secondary: {
    padding: "10px 18px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  primary: {
    padding: "10px 22px",
    borderRadius: 10,
    border: "none",
    background: "var(--brand-primary)",
    color: "#022c22",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
};
