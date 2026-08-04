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
  listProviderBanks,
  verifyProviderBankAccount,
  type BankOption,
  type ProviderEarningsOverview,
  type ProviderPayoutAccount,
} from "@/src/lib/providerApi";
import VerificationBanner from "@/src/components/provider/VerificationBanner";

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

// Currencies where the payout modal knows how to verify natively.
// Each maps to a gateway on the backend:
//   NGN  → Paystack
//   XOF  → Flutterwave (Togo, Côte d'Ivoire, Senegal, Benin, Burkina
//                       Faso, Mali, Niger — needs a country pick first)
// USD/GBP/EUR are supported via the Verification Center flow (Stripe FC
// popup, TrueLayer CoP/VoP) — keep them out of this modal so we don't
// half-implement them.
type PayoutCurrency = "NGN" | "XOF";
const PAYOUT_CURRENCIES: { value: PayoutCurrency; label: string; gateway: string }[] = [
  { value: "NGN", label: "NGN — Nigerian Naira", gateway: "Paystack" },
  { value: "XOF", label: "XOF — West African CFA franc", gateway: "Flutterwave" },
];

function AccountModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProviderPayoutAccount | null;
  onClose: () => void;
  onSaved: (account: ProviderPayoutAccount) => void;
}) {
  const [currency, setCurrency] = useState<PayoutCurrency>(
    (initial?.currency?.toUpperCase() === "XOF" ? "XOF" : "NGN") as PayoutCurrency,
  );
  // XOF requires an ISO-2 country pick (TG/CI/SN/BJ/BF/ML/NE).
  const [country, setCountry] = useState<string>("");
  const [xofCountries, setXofCountries] = useState<{ code: string; name: string }[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load banks for the selected currency (+ country when XOF). Also
  // pre-selects the current bank by name when editing.
  useEffect(() => {
    let mounted = true;
    setBanks([]);
    setBankCode("");
    setBanksLoading(true);
    setBanksError(null);
    listProviderBanks(currency, currency === "XOF" ? country || undefined : undefined)
      .then((r) => {
        if (!mounted) return;
        setXofCountries(r.countries ?? []);
        setBanks(r.banks);
        if (r.banks.length && initial?.bankName) {
          const match = r.banks.find(
            (b) => b.name.toLowerCase() === initial.bankName.toLowerCase(),
          );
          if (match) setBankCode(match.code);
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setBanksError(
          e?.message?.includes("NOT_CONFIGURED")
            ? `${currency === "XOF" ? "Flutterwave" : "Paystack"} isn't configured on this install — admin must set the API key.`
            : e?.message ?? "Couldn't load banks list",
        );
      })
      .finally(() => {
        if (mounted) setBanksLoading(false);
      });
    return () => { mounted = false; };
  }, [currency, country, initial?.bankName]);

  // Any change invalidates the previous verification so a stale name
  // can't slip through.
  useEffect(() => {
    setVerified(false);
    setAccountName("");
  }, [currency, country, bankCode, accountNumber]);

  const bankName = banks.find((b) => b.code === bankCode)?.name ?? "";

  // Digit-length rules differ by market. NGN is exactly 10 (NUBAN);
  // XOF accounts are typically longer (up to 26 in the SFI standard),
  // so we accept 8–26 digits and let the gateway reject the rest.
  const isNumValid = currency === "NGN"
    ? /^\d{10}$/.test(accountNumber.trim())
    : /^\d{8,26}$/.test(accountNumber.trim());

  const canVerify =
    !!bankCode &&
    isNumValid &&
    (currency !== "XOF" || !!country) &&
    !verifying &&
    !verified;

  const runVerify = async () => {
    if (!canVerify) return;
    try {
      setVerifying(true);
      const req = currency === "XOF"
        ? { currency: "XOF" as const, country, bankCode, accountNumber: accountNumber.trim() }
        : { currency: "NGN" as const, bankCode, accountNumber: accountNumber.trim() };
      const res = await verifyProviderBankAccount(req);
      if ("accountName" in res && res.accountName) {
        setAccountName(res.accountName);
        setVerified(true);
        toast.success(`Verified — account belongs to ${res.accountName}`);
      } else {
        toast.error("Bank returned no name for that account number");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Verification failed — check the number and bank");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!verified) {
      toast.error("Verify the account first — we won't save unverified details");
      return;
    }
    setSaving(true);
    try {
      const res = await upsertProviderPayoutAccount({
        bankName,
        accountNumber: accountNumber.trim(),
        accountName,
        currency,
      });
      toast.success("Payout account saved");
      onSaved(res.account);
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const gatewayName = currency === "XOF" ? "Flutterwave" : "Paystack";

  return (
    <div style={s.backdrop}>
      <div style={s.modal}>
        <h2 style={s.modalTitle}>Payout Account</h2>
        <p style={s.modalSub}>
          Pick your bank and enter your account number — we verify with{" "}
          {gatewayName} before saving so the account name is guaranteed to
          match. Admin then approves the account for withdrawals.
        </p>

        <div style={s.field}>
          <label style={s.fieldLabel}>Currency</label>
          <select
            style={s.input}
            value={currency}
            onChange={(e) => setCurrency(e.target.value as PayoutCurrency)}
            disabled={saving}
          >
            {PAYOUT_CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label} — via {c.gateway}</option>
            ))}
          </select>
        </div>

        {currency === "XOF" && (
          <div style={s.field}>
            <label style={s.fieldLabel}>Country</label>
            <select
              style={s.input}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={saving}
            >
              <option value="">Select your country…</option>
              {xofCountries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {!country && (
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                XOF is shared across 7 West African countries — pick yours to load the right banks.
              </span>
            )}
          </div>
        )}

        <div style={s.field}>
          <label style={s.fieldLabel}>Bank</label>
          <select
            style={s.input}
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            disabled={banksLoading || saving || (currency === "XOF" && !country)}
          >
            <option value="">
              {banksLoading
                ? "Loading banks…"
                : currency === "XOF" && !country
                  ? "Pick a country first"
                  : banks.length === 0
                    ? "No banks available"
                    : "Select bank"}
            </option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
          {banksError && <span style={{ fontSize: 12, color: "#fca5a5" }}>{banksError}</span>}
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>Account Number</label>
          <input
            style={s.input}
            placeholder={currency === "NGN" ? "10-digit NUBAN" : "Account number (8–26 digits)"}
            inputMode="numeric"
            maxLength={currency === "NGN" ? 10 : 26}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={saving}
          />
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>Account Name</label>
          <input
            style={{
              ...s.input,
              background: verified ? "color-mix(in srgb, #22c55e 8%, transparent)" : undefined,
            }}
            placeholder={verified ? accountName : "Verify to auto-fill from your bank"}
            value={accountName}
            readOnly
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            {verified ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "rgba(34,197,94,0.14)", color: "#86efac", fontSize: 12, fontWeight: 700 }}>
                <BadgeCheck size={14} /> Verified with Paystack
              </span>
            ) : (
              <button
                type="button"
                style={{ ...s.cancelBtn, background: canVerify ? "var(--brand-primary)" : "var(--surface-2)", color: canVerify ? "#022c22" : "var(--muted-foreground)", border: "none" }}
                onClick={runVerify}
                disabled={!canVerify}
              >
                {verifying ? "Verifying…" : "Verify account"}
              </button>
            )}
            {!verified && (
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                Enter a valid 10-digit account number and pick your bank.
              </span>
            )}
          </div>
        </div>

        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            style={{ ...s.primaryBtn, opacity: verified ? 1 : 0.5, cursor: verified ? "pointer" : "not-allowed" }}
            onClick={handleSave}
            disabled={saving || !verified}
          >
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
      <VerificationBanner capability="payouts" variant="compact" />
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
          tone="var(--brand-primary)"
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
