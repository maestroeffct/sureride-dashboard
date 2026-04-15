"use client";

import { type CSSProperties, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  BadgeCheck,
  AlertCircle,
  ChevronRight,
  Banknote,
} from "lucide-react";
import {
  getProviderEarnings,
  getProviderPayoutAccount,
  upsertProviderPayoutAccount,
  requestProviderPayout,
  type ProviderEarningsOverview,
  type ProviderPayoutAccount,
} from "@/src/lib/providerApi";

/* ── Helpers ── */

function fmtMoney(v: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type PayoutStatus = ProviderEarningsOverview["recentPayouts"][number]["status"];

function StatusPill({ status }: { status: PayoutStatus }) {
  const map: Record<PayoutStatus, CSSProperties> = {
    PENDING: { background: "rgba(251,191,36,0.14)", color: "#FCD34D", border: "1px solid rgba(251,191,36,0.22)" },
    PAID: { background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.22)" },
    CANCELLED: { background: "rgba(239,68,68,0.14)", color: "#F87171", border: "1px solid rgba(239,68,68,0.22)" },
  };
  const labels: Record<PayoutStatus, string> = { PENDING: "Pending", PAID: "Paid", CANCELLED: "Rejected" };
  return (
    <span style={{ ...s.pill, ...map[status] }}>{labels[status]}</span>
  );
}

/* ── Account Modal ── */

function AccountModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProviderPayoutAccount | null;
  onClose: () => void;
  onSaved: (account: ProviderPayoutAccount) => void;
}) {
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      const res = await upsertProviderPayoutAccount({ bankName, accountNumber, accountName });
      toast.success("Payout account saved");
      onSaved(res.account);
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.backdrop}>
      <div style={s.modal}>
        <h2 style={s.modalTitle}>Payout Account</h2>
        <p style={s.modalSub}>Your bank details for receiving payouts. Admin will verify before enabling withdrawals.</p>

        <div style={s.field}>
          <label style={s.fieldLabel}>Bank Name</label>
          <input
            style={s.input}
            placeholder="e.g. First Bank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>
        <div style={s.field}>
          <label style={s.fieldLabel}>Account Number</label>
          <input
            style={s.input}
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
        </div>
        <div style={s.field}>
          <label style={s.fieldLabel}>Account Name</label>
          <input
            style={s.input}
            placeholder="Name as it appears on the account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>

        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button style={s.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Request Payout Modal ── */

function RequestPayoutModal({
  maxAmount,
  account,
  onClose,
  onRequested,
}: {
  maxAmount: number;
  account: ProviderPayoutAccount;
  onClose: () => void;
  onRequested: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const num = Number(amount);
    if (!num || num <= 0) { toast.error("Enter a valid amount"); return; }
    if (num > maxAmount) { toast.error("Amount exceeds available balance"); return; }
    setSubmitting(true);
    try {
      await requestProviderPayout(num, note || undefined);
      toast.success("Payout request submitted!");
      onRequested();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit payout request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={s.backdrop}>
      <div style={s.modal}>
        <h2 style={s.modalTitle}>Request Payout</h2>
        <p style={s.modalSub}>
          Funds will be sent to <strong>{account.accountName}</strong> at{" "}
          <strong>{account.bankName}</strong> ({account.accountNumber}).
        </p>

        <div style={s.field}>
          <label style={s.fieldLabel}>Amount (max {fmtMoney(maxAmount)})</label>
          <input
            style={s.input}
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div style={s.field}>
          <label style={s.fieldLabel}>Note (optional)</label>
          <input
            style={s.input}
            placeholder="Any note for the admin"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
          <button style={s.primaryBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */

export default function ProviderEarningsPage() {
  const [overview, setOverview] = useState<ProviderEarningsOverview | null>(null);
  const [account, setAccount] = useState<ProviderPayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ov, acc] = await Promise.all([getProviderEarnings(), getProviderPayoutAccount()]);
      setOverview(ov);
      setAccount(acc);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const canRequest = !!account?.isVerified && (overview?.availableBalance ?? 0) > 0;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <div style={s.titleRow}>
            <Wallet size={18} style={{ color: "var(--fg-85)" }} />
            <h1 style={s.pageTitle}>Earnings & Payouts</h1>
          </div>
          <p style={s.pageSub}>Track your revenue, request disbursements, and manage your bank account</p>
        </div>
        <div style={s.headerActions}>
          <button style={s.outlineBtn} onClick={() => setShowAccountModal(true)}>
            <Banknote size={15} />
            {account ? "Update Account" : "Set Up Account"}
          </button>
          {canRequest && (
            <button style={s.primaryBtn} onClick={() => setShowRequestModal(true)}>
              <ChevronRight size={15} />
              Request Payout
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div style={s.kpiGrid}>
        <KpiCard
          icon={<TrendingUp size={18} />}
          tone="#14b8a6"
          label="Total Earned"
          value={loading ? "…" : fmtMoney(overview?.totalEarned ?? 0)}
          sub="From completed rentals"
        />
        <KpiCard
          icon={<CheckCircle size={18} />}
          tone="#22c55e"
          label="Total Paid Out"
          value={loading ? "…" : fmtMoney(overview?.totalPaid ?? 0)}
          sub="Disbursed to your account"
        />
        <KpiCard
          icon={<Clock size={18} />}
          tone="#FBBF24"
          label="Pending Requests"
          value={loading ? "…" : fmtMoney(overview?.pendingAmount ?? 0)}
          sub="Awaiting admin approval"
        />
        <KpiCard
          icon={<Wallet size={18} />}
          tone="#3b82f6"
          label="Available Balance"
          value={loading ? "…" : fmtMoney(overview?.availableBalance ?? 0)}
          sub="Ready to withdraw"
          highlight
        />
      </div>

      {/* Bank Account Card */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.cardHeaderLeft}>
            <Banknote size={16} style={{ color: "var(--fg-65)" }} />
            <span style={s.cardTitle}>Payout Account</span>
          </div>
          <button style={s.outlineBtnSm} onClick={() => setShowAccountModal(true)}>
            {account ? "Edit" : "Set Up"}
          </button>
        </div>
        {account ? (
          <div style={s.accountRow}>
            <div style={s.accountInfo}>
              <span style={s.accountName}>{account.accountName}</span>
              <span style={s.accountMeta}>{account.bankName} · {account.accountNumber}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {account.isVerified ? (
                <>
                  <BadgeCheck size={16} style={{ color: "#34D399" }} />
                  <span style={{ fontSize: 13, color: "#34D399", fontWeight: 600 }}>Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} style={{ color: "#FBBF24" }} />
                  <span style={{ fontSize: 13, color: "#FBBF24", fontWeight: 600 }}>Pending Verification</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={s.emptyBox}>
            <AlertCircle size={18} style={{ color: "#FBBF24" }} />
            <span style={s.emptyText}>No payout account set up. Add your bank details to receive disbursements.</span>
          </div>
        )}
      </div>

      {/* Two-column bottom: Recent Payouts + Recent Bookings */}
      <div style={s.twoCol}>
        {/* Recent Payouts */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardHeaderLeft}>
              <Clock size={16} style={{ color: "var(--fg-65)" }} />
              <span style={s.cardTitle}>Payout History</span>
            </div>
          </div>
          {loading ? (
            <div style={s.loadingBox}>Loading…</div>
          ) : !overview?.recentPayouts?.length ? (
            <div style={s.emptyBox}>
              <span style={s.emptyText}>No payout requests yet.</span>
            </div>
          ) : (
            <div style={s.list}>
              {overview.recentPayouts.map((p) => (
                <div key={p.id} style={s.listRow}>
                  <div style={s.listLeft}>
                    <span style={s.listPrimary}>{fmtMoney(p.amount, p.currency)}</span>
                    <span style={s.listSub}>{fmtDate(p.createdAt)}{p.note ? ` · ${p.note}` : ""}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StatusPill status={p.status} />
                    {p.reference && <span style={s.refText}>Ref: {p.reference}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Earning Bookings */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardHeaderLeft}>
              <TrendingUp size={16} style={{ color: "var(--fg-65)" }} />
              <span style={s.cardTitle}>Recent Earnings</span>
            </div>
          </div>
          {loading ? (
            <div style={s.loadingBox}>Loading…</div>
          ) : !overview?.recentBookings?.length ? (
            <div style={s.emptyBox}>
              <span style={s.emptyText}>No completed bookings yet.</span>
            </div>
          ) : (
            <div style={s.list}>
              {overview.recentBookings.map((b) => {
                const carName = [b.car?.brand, b.car?.model].filter(Boolean).join(" ") || "Car";
                return (
                  <div key={b.id} style={s.listRow}>
                    <div style={s.listLeft}>
                      <span style={s.listPrimary}>{carName}</span>
                      <span style={s.listSub}>{fmtDate(b.pickupAt)} → {fmtDate(b.returnAt)}</span>
                    </div>
                    <div style={s.listRight}>
                      <span style={s.earningAmount}>{fmtMoney(b.providerEarning ?? 0)}</span>
                      <span style={s.listSub}>{b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAccountModal && (
        <AccountModal
          initial={account}
          onClose={() => setShowAccountModal(false)}
          onSaved={(acc) => { setAccount(acc); void load(); }}
        />
      )}
      {showRequestModal && overview && account && (
        <RequestPayoutModal
          maxAmount={overview.availableBalance}
          account={account}
          onClose={() => setShowRequestModal(false)}
          onRequested={() => void load()}
        />
      )}
    </div>
  );
}

/* ── KPI Card ── */

function KpiCard({
  icon,
  tone,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ ...s.kpiCard, ...(highlight ? s.kpiCardHighlight : {}) }}>
      <div style={{ ...s.kpiIcon, color: tone, background: `${tone}18` }}>{icon}</div>
      <div style={s.kpiText}>
        <span style={s.kpiLabel}>{label}</span>
        <strong style={{ ...s.kpiValue, color: highlight ? tone : "var(--foreground)" }}>{value}</strong>
        <span style={s.kpiSub}>{sub}</span>
      </div>
    </div>
  );
}

/* ── Styles ── */

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200 },

  headerRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  titleRow: { display: "flex", alignItems: "center", gap: 10 },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
  pageSub: { margin: "4px 0 0", fontSize: 13, color: "var(--fg-60)" },
  headerActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  kpiCard: {
    borderRadius: 18, padding: "18px 20px", border: "1px solid var(--glass-08)",
    background: "var(--glass-04)", display: "flex", gap: 14, alignItems: "flex-start",
  },
  kpiCardHighlight: { border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)" },
  kpiIcon: { width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", flexShrink: 0 },
  kpiText: { display: "flex", flexDirection: "column", gap: 4 },
  kpiLabel: { fontSize: 12, color: "var(--fg-60)" },
  kpiValue: { fontSize: 26, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" },
  kpiSub: { fontSize: 12, color: "var(--fg-55)" },

  card: {
    borderRadius: 18, border: "1px solid var(--glass-08)",
    background: "var(--glass-04)", overflow: "hidden",
  },
  cardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 18px", borderBottom: "1px solid var(--glass-06)",
  },
  cardHeaderLeft: { display: "flex", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: 700 },

  accountRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    padding: "16px 18px", flexWrap: "wrap",
  },
  accountInfo: { display: "flex", flexDirection: "column", gap: 4 },
  accountName: { fontSize: 15, fontWeight: 700 },
  accountMeta: { fontSize: 13, color: "var(--fg-60)" },

  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 },

  list: { display: "flex", flexDirection: "column" },
  listRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
    padding: "14px 18px", borderBottom: "1px solid var(--glass-05)", flexWrap: "wrap",
  },
  listLeft: { display: "flex", flexDirection: "column", gap: 3 },
  listRight: { display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" },
  listPrimary: { fontSize: 14, fontWeight: 700 },
  listSub: { fontSize: 12, color: "var(--fg-55)" },
  earningAmount: { fontSize: 15, fontWeight: 800, color: "#34D399", fontVariantNumeric: "tabular-nums" },
  refText: { fontSize: 11, color: "var(--fg-55)" },

  pill: {
    display: "inline-flex", alignItems: "center", height: 24, padding: "0 10px",
    borderRadius: 999, fontSize: 11, fontWeight: 700,
  },

  emptyBox: {
    display: "flex", alignItems: "center", gap: 10, padding: "18px",
    color: "var(--fg-60)", fontSize: 13,
  },
  emptyText: { color: "var(--fg-60)", fontSize: 13 },
  loadingBox: { padding: 22, textAlign: "center" as const, color: "var(--fg-60)", fontSize: 13 },

  /* Buttons */
  primaryBtn: {
    display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 18px",
    borderRadius: 10, border: "none", background: "var(--brand-primary)",
    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  outlineBtn: {
    display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px",
    borderRadius: 10, border: "1px solid var(--glass-12)", background: "var(--glass-04)",
    color: "var(--foreground)", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  outlineBtnSm: {
    display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px",
    borderRadius: 8, border: "1px solid var(--glass-10)", background: "var(--glass-04)",
    color: "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  cancelBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    flex: 1, height: 44, padding: "0 16px",
    borderRadius: 10, border: "1px solid var(--glass-10)", background: "var(--glass-04)",
    color: "var(--foreground)", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },

  /* Modal */
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 999,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: {
    background: "var(--surface-1)", border: "1px solid var(--glass-10)",
    borderRadius: 20, padding: 28, width: "100%", maxWidth: 440,
    display: "flex", flexDirection: "column", gap: 14,
  },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 700 },
  modalSub: { margin: 0, fontSize: 13, color: "var(--fg-60)", lineHeight: 1.6 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: "var(--fg-75)" },
  input: {
    height: 44, padding: "0 14px", borderRadius: 10,
    border: "1px solid var(--input-border)", background: "var(--input-bg)",
    color: "var(--foreground)", fontSize: 14, outline: "none",
    width: "100%", boxSizing: "border-box" as const,
  },
  modalActions: { display: "flex", gap: 10, marginTop: 4 },
};
