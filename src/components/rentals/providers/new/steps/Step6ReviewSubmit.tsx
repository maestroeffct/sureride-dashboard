"use client";

import { ProviderDraftForm } from "@/src/types/rentalProvider";

export default function Step6ReviewSubmit({
  form,
  setField,
}: {
  form: ProviderDraftForm;
  setField: (k: keyof ProviderDraftForm, v: any) => void;
}) {
  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Review Provider Details</h2>

      {/* SCROLLABLE CONTENT */}
      <div style={styles.scrollArea}>
        {/* ROW 1 */}
        <div style={styles.grid2}>
          <SummaryCard title="Business Info">
            <p>
              <strong>Name:</strong> {form.businessName}
            </p>
            <p>
              <strong>Type:</strong> {form.businessType}
            </p>
          </SummaryCard>

          <SummaryCard title="Contact Person">
            <p>
              <strong>Name:</strong> {form.contactName}
            </p>
            <p>
              <strong>Email:</strong> {form.contactEmail}
            </p>
            <p>
              <strong>Phone:</strong> {form.contactDialCode}
              {form.contactPhone}
            </p>
          </SummaryCard>
        </div>

        {/* ROW 2 */}
        <div style={styles.grid2}>
          <SummaryCard title="Location">
            <p>
              {form.city}, {form.state}, {form.country}
            </p>
            <p>
              <strong>Zones:</strong>{" "}
              {form.zones.length ? form.zones.join(", ") : "None"}
            </p>
          </SummaryCard>

          <SummaryCard title="Documents">
            <p>
              Registration Certificate:{" "}
              {form.regCert ? "✅ Uploaded" : "❌ Missing"}
            </p>
            <p>Government ID: {form.govId ? "✅ Uploaded" : "❌ Missing"}</p>
          </SummaryCard>
        </div>

        {/* ROW 3 (FULL WIDTH) */}
        <SummaryCard title="Financials" full>
          <p>
            <strong>Bank:</strong> {form.bankName}
          </p>
          <p>
            <strong>Account Name:</strong> {form.accountName}
          </p>
          <p>
            <strong>Account Number:</strong> ****
            {form.accountNumber.slice(-4)}
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
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SummaryCard({
  title,
  children,
  full,
}: {
  title: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.card,
        gridColumn: full ? "1 / -1" : undefined,
      }}
    >
      <strong>{title}</strong>
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

  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },

  /* 🔑 This enables scrolling */
  scrollArea: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    // maxHeight: "calc(100vh - 300px)", // adjust if needed
    // overflowY: "auto",
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

  checks: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontSize: 14,
  },
};
