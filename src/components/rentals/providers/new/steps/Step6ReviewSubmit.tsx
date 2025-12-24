"use client";

import { ProviderDraftForm, StepKey } from "@/src/types/rentalProvider";
import { useEffect, useRef } from "react";

export default function Step6ReviewSubmit({
  form,
  setField,
  onEdit,
}: {
  form: ProviderDraftForm;
  setField: (k: keyof ProviderDraftForm, v: any) => void;
  onEdit: (step: StepKey) => void;
}) {
  const errorRef = useRef<HTMLDivElement | null>(null);

  const missing = {
    business: !form.businessName || !form.businessType,
    contact:
      !form.contactName ||
      !form.contactEmail ||
      !form.contactPhone ||
      !form.contactDialCode,
    location: !form.country || !form.state || !form.city,
    documents: !form.regCert || !form.govId,
    financials: !form.bankName || !form.accountName || !form.accountNumber,
  };

  const hasErrors = Object.values(missing).some(Boolean);

  // 🔁 Scroll to first error when user tries to submit without checks
  useEffect(() => {
    if (hasErrors && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [hasErrors]);

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Review Provider Details</h2>

      <div style={styles.scrollArea}>
        <div ref={hasErrors ? errorRef : null} />

        {/* ROW 1 */}
        <div style={styles.grid2}>
          <SummaryCard
            title="Business Info"
            error={missing.business}
            onEdit={() => onEdit("business")}
          >
            <p>
              <strong>Name:</strong> {form.businessName || "—"}
            </p>
            <p>
              <strong>Type:</strong> {form.businessType || "—"}
            </p>
          </SummaryCard>

          <SummaryCard
            title="Contact Person"
            error={missing.contact}
            onEdit={() => onEdit("contact")}
          >
            <p>
              <strong>Name:</strong> {form.contactName || "—"}
            </p>
            <p>
              <strong>Email:</strong> {form.contactEmail || "—"}
            </p>
            <p>
              <strong>Phone:</strong> {form.contactDialCode}
              {form.contactPhone || "—"}
            </p>
          </SummaryCard>
        </div>

        {/* ROW 2 */}
        <div style={styles.grid2}>
          <SummaryCard
            title="Location"
            error={missing.location}
            onEdit={() => onEdit("location")}
          >
            <p>
              {form.city || "—"}, {form.state || "—"}, {form.country || "—"}
            </p>
            <p>
              <strong>Zones:</strong>{" "}
              {form.zones.length ? form.zones.join(", ") : "None"}
            </p>
          </SummaryCard>

          <SummaryCard
            title="Documents"
            error={missing.documents}
            onEdit={() => onEdit("documents")}
          >
            <p>
              Registration Cert: {form.regCert ? "✅ Uploaded" : "❌ Missing"}
            </p>
            <p>Government ID: {form.govId ? "✅ Uploaded" : "❌ Missing"}</p>
          </SummaryCard>
        </div>

        {/* FULL */}
        <SummaryCard
          title="Financials"
          full
          error={missing.financials}
          onEdit={() => onEdit("financials")}
        >
          <p>
            <strong>Bank:</strong> {form.bankName || "—"}
          </p>
          <p>
            <strong>Account Name:</strong> {form.accountName || "—"}
          </p>
          <p>
            <strong>Account:</strong>{" "}
            {form.accountNumber ? `****${form.accountNumber.slice(-4)}` : "—"}
          </p>
          <p>
            <strong>Currency:</strong> {form.currency}
          </p>
        </SummaryCard>

        {/* CONFIRMATIONS */}
        <div style={styles.checks}>
          <label>
            <input
              type="checkbox"
              checked={form.agreeTerms}
              onChange={(e) => setField("agreeTerms", e.target.checked)}
            />{" "}
            Provider agrees to platform terms
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.confirmAccurate}
              onChange={(e) => setField("confirmAccurate", e.target.checked)}
            />{" "}
            Information is accurate
          </label>

          {hasErrors && (
            <p style={styles.errorText}>
              Please fix highlighted sections before submitting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SummaryCard({
  title,
  children,
  onEdit,
  error,
  full,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
  error?: boolean;
  full?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.card,
        ...(error ? styles.cardError : {}),
        gridColumn: full ? "1 / -1" : undefined,
      }}
    >
      <div style={styles.cardHeader}>
        <strong>{title}</strong>
        <button onClick={onEdit} style={styles.editLink}>
          Edit
        </button>
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    height: "100%",
  },

  title: { fontSize: 18, fontWeight: 700 },

  scrollArea: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    paddingRight: 4,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },

  card: {
    border: "1px solid #1F2937",
    borderRadius: 12,
    padding: 14,
    background: "#020617",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  cardError: {
    borderColor: "#DC2626",
    background: "#450A0A",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  editLink: {
    fontSize: 12,
    background: "none",
    border: "none",
    color: "#60A5FA",
    cursor: "pointer",
  },

  checks: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontSize: 14,
  },

  errorText: {
    color: "#F87171",
    fontSize: 13,
  },
};
