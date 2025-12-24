import { ProviderDraftForm } from "@/src/types/rentalProvider";

export default function Step5Financials({
  form,
  setField,
}: {
  form: ProviderDraftForm;
  setField: (k: keyof ProviderDraftForm, v: any) => void;
}) {
  const masked =
    form.accountNumber.length > 4
      ? "****" + form.accountNumber.slice(-4)
      : form.accountNumber;

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Payout & Financials</h2>

      <div style={styles.grid}>
        <Field label="Bank Name *">
          <input
            value={form.bankName}
            onChange={(e) => setField("bankName", e.target.value)}
            style={styles.input}
          />
        </Field>

        <Field label="Account Name *">
          <input
            value={form.accountName}
            onChange={(e) => setField("accountName", e.target.value)}
            style={styles.input}
          />
        </Field>

        <Field label="Account Number *">
          <input
            value={form.accountNumber}
            onChange={(e) => setField("accountNumber", e.target.value)}
            style={styles.input}
          />
          {form.accountNumber && <p style={styles.hint}>Masked: {masked}</p>}
        </Field>

        <Field label="Currency">
          <select
            value={form.currency}
            onChange={(e) => setField("currency", e.target.value)}
            style={styles.input}
          >
            <option>NGN</option>
            <option>USD</option>
          </select>
        </Field>
      </div>

      <div style={styles.readOnlyBox}>
        <strong>Payout Schedule:</strong> Weekly (Admin Rule)
        <br />
        <strong>Commission Rate:</strong> 10% (Locked)
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, color: "#9CA3AF" }}>{label}</label>
      {children}
    </div>
  );
}

/* -------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: "flex", flexDirection: "column", gap: 18 },
  title: { fontSize: 18, fontWeight: 700 },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },

  input: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#0B1220",
    border: "1px solid #1F2937",
    color: "#E5E7EB",
  },

  hint: { fontSize: 12, color: "#9CA3AF" },

  readOnlyBox: {
    padding: 14,
    borderRadius: 12,
    background: "#020617",
    border: "1px solid #1F2937",
    fontSize: 13,
    color: "#9CA3AF",
  },
};
