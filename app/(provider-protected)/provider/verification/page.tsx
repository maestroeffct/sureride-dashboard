"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  createStripeFinancialConnectionsSession,
  deleteProviderDocument,
  getProviderPayoutAccount,
  getProviderVerificationStatus,
  listProviderBanks,
  listProviderDocuments,
  upsertProviderPayoutAccount,
  uploadProviderDocument,
  verifyProviderBankAccount,
  type BankOption,
  type ProviderDocStatus,
  type ProviderDocType,
  type ProviderDocument,
  type ProviderPayoutAccount,
  type ProviderVerificationStatus,
} from "@/src/lib/providerApi";

// ── Doc type metadata ──────────────────────────────────────────────────────

type DocSpec = {
  type: ProviderDocType;
  label: string;
  description: string;
  required: boolean;
};

const DOC_SPECS: DocSpec[] = [
  {
    type: "CAC",
    label: "CAC Certificate",
    description: "Business registration certificate from the Corporate Affairs Commission.",
    required: true,
  },
  {
    type: "NIN",
    label: "Government ID (NIN slip)",
    description: "National Identity Number slip of the primary contact person.",
    required: true,
  },
  {
    type: "ID_CARD",
    label: "Additional ID Card",
    description: "Driver's licence, passport, or voter card. Optional but speeds up review.",
    required: false,
  },
  {
    type: "ADDRESS_PROOF",
    label: "Proof of Address",
    description: "Recent utility bill or bank statement. Optional but speeds up review.",
    required: false,
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function VerificationCenterPage() {
  const [status, setStatus] = useState<ProviderVerificationStatus | null>(null);
  const [docs, setDocs] = useState<ProviderDocument[]>([]);
  const [account, setAccount] = useState<ProviderPayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [statusRes, docsRes, accountRes] = await Promise.all([
        getProviderVerificationStatus(),
        listProviderDocuments(),
        getProviderPayoutAccount().catch(() => null),
      ]);
      setStatus(statusRes);
      setDocs(docsRes.items);
      setAccount(accountRes);
    } catch {
      toast.error("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
          Loading verification center…
        </span>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <Link href="/provider" style={s.backLink}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <header style={s.header}>
        <div>
          <h1 style={s.title}>Verification Center</h1>
          <p style={s.subtitle}>
            Complete these steps to start listing cars and receiving payouts. We&apos;ll
            review and approve everything within 24 hours.
          </p>
        </div>
        {status && <OverallStatusPill status={status} />}
      </header>

      {/* ── Section 1: Basic profile ─────────────────────────────────────── */}
      <BasicProfileSection status={status} />

      {/* ── Section 2: Documents ─────────────────────────────────────────── */}
      <DocumentsSection docs={docs} onUploaded={refresh} />

      {/* ── Section 3: Bank account ──────────────────────────────────────── */}
      <BankAccountSection account={account} onSaved={refresh} />

      {/* ── Section 4: Pending review banner ─────────────────────────────── */}
      {status && !status.isAdminVerified && status.requirements.documents.done && (
        <div style={s.reviewBanner}>
          <Clock size={20} color="#f59e0b" />
          <div>
            <p style={s.reviewBannerTitle}>Documents submitted — awaiting admin review</p>
            <p style={s.reviewBannerSub}>
              We typically review documents within 24 hours during business days. You&apos;ll
              receive an email when your account is approved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function OverallStatusPill({ status }: { status: ProviderVerificationStatus }) {
  const allDone = status.canListCars && status.canReceivePayouts;
  const someDone = status.canListCars;
  const Icon = allDone ? CheckCircle2 : someDone ? Clock : AlertTriangle;
  const color = allDone ? "var(--brand-secondary)" : someDone ? "#f59e0b" : "#ef4444";
  const text = allDone
    ? "Fully verified"
    : someDone
      ? "Listing approved"
      : "Verification pending";
  return (
    <span style={{ ...s.statusPill, color, borderColor: `${color}55`, background: `${color}11` }}>
      <Icon size={14} />
      {text}
    </span>
  );
}

function BasicProfileSection({
  status,
}: {
  status: ProviderVerificationStatus | null;
}) {
  const done = status?.requirements.basicProfile.done ?? false;
  const missing = status?.requirements.basicProfile.missing ?? [];
  return (
    <section style={{ ...s.card, ...(done ? s.cardDone : {}) }}>
      <div style={s.cardHeader}>
        <div style={s.cardHeaderLeft}>
          <SectionIcon done={done} />
          <div>
            <p style={s.cardTitle}>1. Basic Business Profile</p>
            <p style={s.cardSub}>
              Phone, primary contact name, and business address.
            </p>
          </div>
        </div>
        {done ? (
          <span style={s.donePill}>Complete</span>
        ) : (
          <Link href="/provider/complete-profile" style={s.actionLink}>
            Complete profile →
          </Link>
        )}
      </div>

      {!done && missing.length > 0 && (
        <div style={s.missingBox}>
          <strong>Missing: </strong>
          {missing.join(", ")}
        </div>
      )}
    </section>
  );
}

function DocumentsSection({
  docs,
  onUploaded,
}: {
  docs: ProviderDocument[];
  onUploaded: () => void;
}) {
  const docByType = new Map(docs.map((d) => [d.type, d]));
  const requiredCount = DOC_SPECS.filter((s) => s.required).length;
  const approvedRequiredCount = DOC_SPECS.filter(
    (spec) => spec.required && docByType.get(spec.type)?.status === "APPROVED",
  ).length;
  const allRequiredUploaded = DOC_SPECS.filter((s) => s.required).every((spec) =>
    docByType.has(spec.type),
  );

  return (
    <section style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardHeaderLeft}>
          <SectionIcon
            done={
              allRequiredUploaded && approvedRequiredCount === requiredCount
            }
            partial={allRequiredUploaded}
          />
          <div>
            <p style={s.cardTitle}>2. Documents</p>
            <p style={s.cardSub}>
              Upload the documents below. PDF, JPG, or PNG (max 10 MB each).
            </p>
          </div>
        </div>
        <span style={s.countPill}>
          {approvedRequiredCount} / {requiredCount} approved
        </span>
      </div>

      <div style={s.docList}>
        {DOC_SPECS.map((spec) => (
          <DocRow
            key={spec.type}
            spec={spec}
            doc={docByType.get(spec.type)}
            onChanged={onUploaded}
          />
        ))}
      </div>
    </section>
  );
}

function DocRow({
  spec,
  doc,
  onChanged,
}: {
  spec: DocSpec;
  doc: ProviderDocument | undefined;
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10 MB)");
      return;
    }
    try {
      setUploading(true);
      await uploadProviderDocument(spec.type, file);
      toast.success(`${spec.label} uploaded`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    const ok = window.confirm(`Delete ${spec.label}? You'll need to re-upload.`);
    if (!ok) return;
    try {
      setDeleting(true);
      await deleteProviderDocument(doc.id);
      toast.success(`${spec.label} deleted`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={s.docRow}>
      <div style={s.docInfo}>
        <div style={s.docTitleRow}>
          <p style={s.docTitle}>
            {spec.label}
            {spec.required && <span style={s.requiredStar}>*</span>}
          </p>
          {doc && <DocStatusPill status={doc.status} />}
        </div>
        <p style={s.docDesc}>{spec.description}</p>
        {doc?.status === "REJECTED" && doc.rejectionReason && (
          <div style={s.rejectionBox}>
            <strong>Rejected:</strong> {doc.rejectionReason}
          </div>
        )}
      </div>

      <div style={s.docActions}>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        {doc ? (
          <>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              style={s.viewBtn}
              title="View uploaded file"
            >
              <ExternalLink size={13} /> View
            </a>
            {doc.status !== "APPROVED" && (
              <button
                style={s.replaceBtn}
                onClick={handlePick}
                disabled={uploading}
                title="Replace this file"
              >
                {uploading ? "Uploading…" : "Replace"}
              </button>
            )}
            {doc.status !== "APPROVED" && (
              <button
                style={s.deleteBtn}
                onClick={handleDelete}
                disabled={deleting}
                title="Delete this document"
              >
                <Trash2 size={13} />
              </button>
            )}
          </>
        ) : (
          <button style={s.uploadBtn} onClick={handlePick} disabled={uploading}>
            <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
          </button>
        )}
      </div>
    </div>
  );
}

function DocStatusPill({ status }: { status: ProviderDocStatus }) {
  const config: Record<ProviderDocStatus, { color: string; label: string; Icon: React.ElementType }> = {
    PENDING: { color: "#f59e0b", label: "Under review", Icon: Clock },
    APPROVED: { color: "var(--brand-secondary)", label: "Approved", Icon: CheckCircle2 },
    REJECTED: { color: "#ef4444", label: "Rejected", Icon: XCircle },
  };
  const { color, label, Icon } = config[status];
  return (
    <span style={{ ...s.miniPill, color, borderColor: `${color}55`, background: `${color}11` }}>
      <Icon size={11} />
      {label}
    </span>
  );
}

// Per-currency account-number rules. Currencies share digit-length and
// sometimes character-set, so we keep the regex declarative.
const ACCOUNT_NUMBER_RULES: Record<
  string,
  { regex: RegExp; message: string; maxLength: number; placeholder: string }
> = {
  NGN: {
    regex: /^\d{10}$/,
    message: "Nigerian accounts are exactly 10 digits",
    maxLength: 10,
    placeholder: "10-digit NUBAN",
  },
  USD: {
    // US ACH bank account numbers are typically 4–17 digits.
    regex: /^\d{4,17}$/,
    message: "US accounts are 4–17 digits",
    maxLength: 17,
    placeholder: "4–17 digit account number",
  },
  GBP: {
    regex: /^\d{8}$/,
    message: "UK accounts are exactly 8 digits",
    maxLength: 8,
    placeholder: "8-digit account number",
  },
  EUR: {
    // IBAN format — letters + digits, up to 34 chars.
    regex: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/,
    message: "Enter a valid IBAN (e.g. DE89370400440532013000)",
    maxLength: 34,
    placeholder: "IBAN (e.g. DE89370400440532013000)",
  },
};

type BankForm = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: string;
};

function buildBankSchema(currency: string) {
  const rule = ACCOUNT_NUMBER_RULES[currency] ?? ACCOUNT_NUMBER_RULES.NGN;
  return z.object({
    bankName: z
      .string()
      .trim()
      .min(2, "Bank name is required")
      .max(80, "Bank name is too long"),
    accountNumber: z
      .string()
      .trim()
      .regex(rule.regex, rule.message),
    accountName: z
      .string()
      .trim()
      .min(2, "Account name is required")
      .max(120, "Account name is too long")
      .regex(
        /^[A-Za-z][A-Za-z\s'.-]+$/,
        "Use letters, spaces, apostrophes and hyphens only",
      ),
    currency: z.string().min(3),
  });
}

function BankAccountSection({
  account,
  onSaved,
}: {
  account: ProviderPayoutAccount | null;
  onSaved: () => void;
}) {
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber ?? "");
  const [accountName, setAccountName] = useState(account?.accountName ?? "");
  const [currency, setCurrency] = useState(account?.currency ?? "NGN");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof BankForm, boolean>>>({});

  // ── External-verification state ────────────────────────────────────────
  // - NGN: live Paystack resolve once bank + 10 digits are set
  // - USD: Stripe Financial Connections session/linked-account roundtrip
  // - GBP/EUR: TrueLayer COP / VOP name-match call
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [nameVerified, setNameVerified] = useState<boolean>(
    Boolean(account?.isVerified),
  );
  const [verifyMethod, setVerifyMethod] = useState<string | null>(null);

  // Extra inputs used only by some currencies — kept in dedicated state so
  // they don't pollute the BankForm schema for other currencies.
  const [sortCode, setSortCode] = useState("");
  const [iban, setIban] = useState("");

  // Load the bank list when NGN is selected.
  useEffect(() => {
    if (currency !== "NGN") {
      setBanks([]);
      return;
    }
    let cancelled = false;
    setBanksLoading(true);
    listProviderBanks("NGN")
      .then((res) => {
        if (!cancelled) setBanks(res.banks);
      })
      .catch(() => {
        if (!cancelled) {
          // Don't toast — falls back to free-text bank name input.
          setBanks([]);
        }
      })
      .finally(() => {
        if (!cancelled) setBanksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currency]);

  // Auto-resolve NGN account name once user picks a bank + types 10 digits.
  useEffect(() => {
    if (currency !== "NGN") return;
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      setNameVerified(false);
      return;
    }
    let cancelled = false;
    setResolving(true);
    setNameVerified(false);
    verifyProviderBankAccount({
      currency: "NGN",
      bankCode,
      accountNumber,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.method === "paystack" && res.matched) {
          setAccountName(res.accountName.toUpperCase());
          setNameVerified(true);
          setVerifyMethod("paystack");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(
          err instanceof Error
            ? err.message
            : "Couldn't verify the account — double-check the number",
        );
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currency, bankCode, accountNumber]);

  // Reset the bankCode/name/iban whenever the currency changes.
  useEffect(() => {
    setBankCode("");
    setBankName(account?.currency === currency ? account.bankName ?? "" : "");
    setAccountName(account?.currency === currency ? account.accountName ?? "" : "");
    setAccountNumber(
      account?.currency === currency ? account.accountNumber ?? "" : "",
    );
    setSortCode("");
    setIban("");
    setNameVerified(false);
    setVerifyMethod(null);
    setTouched({});
  }, [currency, account]);

  const rule = ACCOUNT_NUMBER_RULES[currency] ?? ACCOUNT_NUMBER_RULES.NGN;

  const errors = useMemo(() => {
    const parsed = buildBankSchema(currency).safeParse({
      bankName,
      accountNumber,
      accountName,
      currency,
    });
    if (parsed.success) return {} as Partial<Record<keyof BankForm, string>>;
    const out: Partial<Record<keyof BankForm, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof BankForm;
      if (!out[key]) out[key] = issue.message;
    }
    return out;
  }, [bankName, accountNumber, accountName, currency]);

  const formValid = Object.keys(errors).length === 0;

  const handleSave = async () => {
    if (!formValid) {
      setTouched({
        bankName: true,
        accountNumber: true,
        accountName: true,
        currency: true,
      });
      const first = Object.values(errors)[0];
      toast.error(first ?? "Please fix the highlighted fields");
      return;
    }
    // Require name verification for NGN — block manual submission of an
    // unverified account, so we don't queue payouts to a wrong NUBAN.
    if (currency === "NGN" && !nameVerified) {
      toast.error("Pick a bank and enter the account number to verify");
      return;
    }
    try {
      setSaving(true);
      await upsertProviderPayoutAccount({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
        currency,
      });
      toast.success("Bank account saved — awaiting admin verification");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── USD: Stripe Financial Connections ──────────────────────────────────
  const handleConnectStripe = async () => {
    try {
      setResolving(true);
      const session = await createStripeFinancialConnectionsSession({
        fullName: accountName.trim() || undefined,
      });
      // Lazy-load Stripe.js only when the user triggers Connect.
      const Stripe = (await import("@stripe/stripe-js")).loadStripe;
      const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!pk) {
        toast.error(
          "Stripe not configured (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing)",
        );
        return;
      }
      const stripe = await Stripe(pk);
      if (!stripe) throw new Error("Stripe.js failed to load");

      const result = await stripe.collectFinancialConnectionsAccounts({
        clientSecret: session.clientSecret,
      });
      if (result.error) throw new Error(result.error.message);

      const linked =
        result.financialConnectionsSession?.accounts?.[0]?.id ?? null;
      if (!linked) {
        toast.error("No account was connected");
        return;
      }

      const verify = await verifyProviderBankAccount({
        currency: "USD",
        linkedAccountId: linked,
      });
      if (verify.method === "stripe-financial-connections") {
        setBankName(verify.bankName);
        setAccountName(verify.accountName);
        // Stripe never exposes the full account number — only last4. Store
        // bare digits so the USD schema regex (/^\d{4,17}$/) passes; the
        // bullets are added at render time below.
        setAccountNumber(verify.accountNumberLast4);
        setNameVerified(true);
        setVerifyMethod("stripe-financial-connections");
        toast.success("Bank connected via Stripe");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Stripe connection failed",
      );
    } finally {
      setResolving(false);
    }
  };

  // ── GBP / EUR: TrueLayer COP / VOP ─────────────────────────────────────
  const handleVerifyTrueLayer = async () => {
    const candidateName = accountName.trim();
    if (candidateName.length < 2) {
      toast.error("Enter the account holder's full name first");
      return;
    }
    try {
      setResolving(true);
      const verify =
        currency === "GBP"
          ? await verifyProviderBankAccount({
              currency: "GBP",
              sortCode,
              accountNumber,
              candidateName,
            })
          : await verifyProviderBankAccount({
              currency: "EUR",
              iban,
              candidateName,
            });

      if (
        verify.method === "truelayer-cop" ||
        verify.method === "truelayer-vop"
      ) {
        if (verify.matched) {
          setNameVerified(true);
          setVerifyMethod(verify.method);
          toast.success("Name match confirmed");
        } else if (verify.closeMatch && verify.canonicalName) {
          // Surface the bank's canonical name and let the user accept it.
          setAccountName(verify.canonicalName);
          setNameVerified(true);
          setVerifyMethod(verify.method);
          toast.success(
            `Close match — using "${verify.canonicalName}" from the bank`,
          );
        } else {
          setNameVerified(false);
          toast.error(
            verify.reason || "Account holder name does not match the bank's records",
          );
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Verification failed",
      );
    } finally {
      setResolving(false);
    }
  };

  const verified = Boolean(account?.isVerified);
  const hasAccount = Boolean(account?.id);

  return (
    <section style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardHeaderLeft}>
          <SectionIcon done={verified} partial={hasAccount && !verified} />
          <div>
            <p style={s.cardTitle}>3. Bank Account (for payouts)</p>
            <p style={s.cardSub}>
              We&apos;ll send your earnings to this account. Not required for listing
              cars, but required to receive payouts.
            </p>
          </div>
        </div>
        {hasAccount && (
          <span
            style={
              verified
                ? { ...s.donePill }
                : { ...s.donePill, color: "#f59e0b", background: "#f59e0b22" }
            }
          >
            {verified ? "Verified" : "Awaiting verification"}
          </span>
        )}
      </div>

      <div style={s.grid2}>
        <Field label="Currency">
          <select
            style={s.input}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={verified}
          >
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro (IBAN)</option>
          </select>
        </Field>

        {/* ── NGN: Paystack bank list + live resolve ── */}
        {currency === "NGN" && (
          <>
            <Field label="Bank">
              <select
                style={{
                  ...s.input,
                  ...(touched.bankName && errors.bankName ? s.inputError : {}),
                }}
                value={bankCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setBankCode(code);
                  const found = banks.find((b) => b.code === code);
                  if (found) setBankName(found.name);
                }}
                onBlur={() =>
                  setTouched((t) => ({ ...t, bankName: true }))
                }
                disabled={verified || banksLoading}
              >
                <option value="">
                  {banksLoading ? "Loading banks…" : "Select your bank"}
                </option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
              {touched.bankName && errors.bankName && (
                <span style={s.errText}>{errors.bankName}</span>
              )}
            </Field>
            <Field label="Account Number">
              <input
                style={{
                  ...s.input,
                  ...(touched.accountNumber && errors.accountNumber
                    ? s.inputError
                    : {}),
                }}
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ""))
                }
                onBlur={() =>
                  setTouched((t) => ({ ...t, accountNumber: true }))
                }
                placeholder="10-digit NUBAN"
                inputMode="numeric"
                maxLength={10}
                disabled={verified}
              />
              {touched.accountNumber && errors.accountNumber && (
                <span style={s.errText}>{errors.accountNumber}</span>
              )}
            </Field>
            <Field label="Account Name (verified)">
              <input
                style={{
                  ...s.input,
                  background: "rgba(34,197,94,0.08)",
                  cursor: "not-allowed",
                }}
                value={resolving ? "Verifying…" : accountName}
                placeholder="Auto-filled after entering account number"
                readOnly
                disabled
              />
              {nameVerified && (
                <span style={s.helperOk}>
                  ✓ Confirmed by Paystack
                </span>
              )}
            </Field>
          </>
        )}

        {/* ── USD: Stripe Financial Connections ── */}
        {currency === "USD" && (
          <>
            <Field label="Bank">
              <input
                style={s.input}
                value={bankName}
                placeholder="Connect your bank to fill"
                readOnly
                disabled
              />
            </Field>
            <Field label="Account Number">
              <input
                style={s.input}
                value={accountNumber ? `••••${accountNumber}` : ""}
                placeholder="••••XXXX"
                readOnly
                disabled
              />
            </Field>
            <Field label="Account Holder Name">
              <input
                style={s.input}
                value={accountName}
                placeholder="Filled from Stripe"
                readOnly
                disabled
              />
              {nameVerified && (
                <span style={s.helperOk}>
                  ✓ Linked via Stripe Financial Connections
                </span>
              )}
            </Field>
          </>
        )}

        {/* ── GBP: TrueLayer COP — sort code + account number ── */}
        {currency === "GBP" && (
          <>
            <Field label="Bank Name">
              <input
                style={s.input}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Barclays"
                disabled={verified}
              />
            </Field>
            <Field label="Sort Code">
              <input
                style={s.input}
                value={sortCode}
                onChange={(e) =>
                  setSortCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="6 digits"
                inputMode="numeric"
                maxLength={6}
                disabled={verified}
              />
            </Field>
            <Field label="Account Number">
              <input
                style={s.input}
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ""))
                }
                placeholder="8 digits"
                inputMode="numeric"
                maxLength={8}
                disabled={verified}
              />
            </Field>
            <Field label="Account Holder Name">
              <input
                style={s.input}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="As it appears on the account"
                disabled={verified}
              />
              {nameVerified && (
                <span style={s.helperOk}>
                  ✓ Confirmed via TrueLayer Confirmation of Payee
                </span>
              )}
            </Field>
          </>
        )}

        {/* ── EUR: TrueLayer VOP — IBAN ── */}
        {currency === "EUR" && (
          <>
            <Field label="Bank Name">
              <input
                style={s.input}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Deutsche Bank"
                disabled={verified}
              />
            </Field>
            <Field label="IBAN">
              <input
                style={s.input}
                value={iban}
                onChange={(e) =>
                  setIban(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, ""),
                  )
                }
                placeholder="DE89370400440532013000"
                maxLength={34}
                disabled={verified}
              />
            </Field>
            <Field label="Account Holder Name">
              <input
                style={s.input}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="As it appears on the account"
                disabled={verified}
              />
              {nameVerified && (
                <span style={s.helperOk}>
                  ✓ Confirmed via TrueLayer Verification of Payee
                </span>
              )}
            </Field>
          </>
        )}
      </div>

      {!verified && (
        <div style={s.bankActions}>
          {currency === "USD" && !nameVerified && (
            <button
              style={{ ...s.saveBtn, background: "#635bff" }}
              onClick={handleConnectStripe}
              disabled={resolving}
            >
              {resolving ? "Connecting…" : "Connect bank via Stripe"}
            </button>
          )}
          {(currency === "GBP" || currency === "EUR") && !nameVerified && (
            <button
              style={{ ...s.saveBtn, background: "#1f6feb" }}
              onClick={handleVerifyTrueLayer}
              disabled={
                resolving ||
                (currency === "GBP"
                  ? !/^\d{6}$/.test(sortCode) ||
                    !/^\d{8}$/.test(accountNumber) ||
                    accountName.trim().length < 2
                  : !/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban) ||
                    accountName.trim().length < 2)
              }
            >
              {resolving ? "Verifying…" : "Verify with TrueLayer"}
            </button>
          )}
          <button
            style={{
              ...s.saveBtn,
              opacity:
                !formValid ||
                saving ||
                (currency === "NGN" && !nameVerified) ||
                (currency === "USD" && !nameVerified)
                  ? 0.5
                  : 1,
              cursor:
                !formValid || saving ? "not-allowed" : "pointer",
            }}
            onClick={handleSave}
            disabled={
              saving ||
              !formValid ||
              (currency === "NGN" && !nameVerified) ||
              (currency === "USD" && !nameVerified)
            }
          >
            {saving
              ? "Saving…"
              : hasAccount
                ? "Update Account"
                : "Save Bank Account"}
          </button>
        </div>
      )}
      {verifyMethod && nameVerified && !verified && (
        <p style={s.helperOk}>
          Verified via <strong>{verifyMethod}</strong>. Save to submit for
          admin payout approval.
        </p>
      )}

      {verified && (
        <p style={s.verifiedNote}>
          ✓ Bank account verified. To change it, contact support.
        </p>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function SectionIcon({ done, partial }: { done?: boolean; partial?: boolean }) {
  if (done) {
    return (
      <div style={{ ...s.sectionIcon, background: "var(--brand-secondary)22", color: "var(--brand-secondary)" }}>
        <CheckCircle2 size={18} />
      </div>
    );
  }
  if (partial) {
    return (
      <div style={{ ...s.sectionIcon, background: "#f59e0b22", color: "#f59e0b" }}>
        <Clock size={18} />
      </div>
    );
  }
  return (
    <div style={{ ...s.sectionIcon, background: "var(--surface-2)", color: "var(--muted-foreground)" }}>
      <ShieldCheck size={18} />
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  page: {
    maxWidth: 880,
    margin: "0 auto",
    padding: "24px 32px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  loadingWrap: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 60 },
  spinner: {
    width: 24, height: 24, borderRadius: "50%",
    border: "3px solid var(--input-border)", borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },

  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "var(--muted-foreground)",
    textDecoration: "none",
    width: "fit-content",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 4,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 750, letterSpacing: -0.3, color: "var(--foreground)" },
  subtitle: { margin: "6px 0 0", fontSize: 13, color: "var(--muted-foreground)", maxWidth: 520, lineHeight: 1.55 },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid",
    flexShrink: 0,
  },

  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardDone: {
    background: "color-mix(in srgb, var(--brand-secondary) 4%, var(--surface-1))",
    borderColor: "color-mix(in srgb, var(--brand-secondary) 25%, var(--input-border))",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  cardHeaderLeft: { display: "flex", gap: 12, alignItems: "flex-start", flex: 1 },
  cardTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)" },
  cardSub: { margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55 },

  sectionIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  donePill: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    background: "color-mix(in srgb, var(--brand-secondary) 18%, transparent)",
    color: "var(--brand-secondary)",
    flexShrink: 0,
  },
  countPill: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    background: "var(--surface-2)",
    color: "var(--muted-foreground)",
    flexShrink: 0,
  },

  actionLink: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--brand-primary)",
    textDecoration: "none",
    flexShrink: 0,
  },

  missingBox: {
    fontSize: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: "color-mix(in srgb, #ef4444 6%, transparent)",
    border: "1px solid color-mix(in srgb, #ef4444 20%, transparent)",
    color: "var(--foreground)",
  },

  docList: { display: "flex", flexDirection: "column", gap: 12 },
  docRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    padding: "12px 14px",
    borderRadius: 12,
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
  },
  docInfo: { flex: 1, minWidth: 0 },
  docTitleRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 3 },
  docTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  requiredStar: { color: "#ef4444", marginLeft: 3 },
  docDesc: { margin: 0, fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.5 },
  rejectionBox: {
    marginTop: 8,
    padding: "8px 10px",
    borderRadius: 8,
    background: "color-mix(in srgb, #ef4444 8%, transparent)",
    border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)",
    fontSize: 12,
    color: "#fca5a5",
  },

  docActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  uploadBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px",
    borderRadius: 8,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  viewBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    textDecoration: "none",
    fontSize: 11.5,
    fontWeight: 600,
  },
  replaceBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 11.5,
    fontWeight: 600,
  },
  deleteBtn: {
    width: 28, height: 28,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "#ef4444",
    cursor: "pointer",
  },

  miniPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 10.5,
    fontWeight: 700,
    border: "1px solid",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.04 },
  input: {
    height: 42, padding: "0 12px", borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-2))",
    color: "var(--foreground)", fontSize: 14, outline: "none",
    width: "100%", boxSizing: "border-box",
  },
  inputError: {
    borderColor: "#ef4444",
    boxShadow: "0 0 0 2px rgba(239,68,68,0.18)",
  },
  errText: {
    fontSize: 12,
    color: "#f87171",
    marginTop: 4,
  },
  helperOk: {
    fontSize: 12,
    color: "#86efac",
    marginTop: 4,
    display: "block",
  },

  bankActions: { display: "flex", justifyContent: "flex-end", paddingTop: 4 },
  saveBtn: {
    padding: "10px 22px",
    borderRadius: 10,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  verifiedNote: {
    margin: 0,
    fontSize: 12,
    color: "var(--brand-secondary)",
    fontWeight: 600,
  },

  reviewBanner: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 14,
    background: "color-mix(in srgb, #f59e0b 6%, transparent)",
    border: "1px solid color-mix(in srgb, #f59e0b 25%, transparent)",
  },
  reviewBannerTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--foreground)" },
  reviewBannerSub: { margin: "3px 0 0", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55 },
};
