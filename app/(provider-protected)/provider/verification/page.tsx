"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
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
  deleteProviderDocument,
  getProviderPayoutAccount,
  getProviderVerificationStatus,
  listProviderDocuments,
  upsertProviderPayoutAccount,
  uploadProviderDocument,
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

function BankAccountSection({
  account,
  onSaved,
}: {
  account: ProviderPayoutAccount | null;
  onSaved: () => void;
}) {
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber ?? "");
  const [accountName, setAccountName] = useState(account?.accountName ?? "");
  const [currency, setCurrency] = useState(account?.currency ?? "NGN");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error("Fill in all bank fields");
      return;
    }
    try {
      setSaving(true);
      await upsertProviderPayoutAccount({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
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
        <Field label="Bank Name">
          <input
            style={s.input}
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g. Access Bank"
            disabled={verified}
          />
        </Field>
        <Field label="Account Number">
          <input
            style={s.input}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit account number"
            inputMode="numeric"
            maxLength={10}
            disabled={verified}
          />
        </Field>
        <Field label="Account Name">
          <input
            style={s.input}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="As it appears on the account"
            disabled={verified}
          />
        </Field>
        <Field label="Currency">
          <select
            style={s.input}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={verified}
          >
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="USD">USD — US Dollar</option>
          </select>
        </Field>
      </div>

      {!verified && (
        <div style={s.bankActions}>
          <button
            style={s.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : hasAccount ? "Update Account" : "Save Bank Account"}
          </button>
        </div>
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
