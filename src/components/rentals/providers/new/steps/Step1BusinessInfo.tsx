import { ProviderDraftForm } from "@/src/types/rentalProvider";

export default function Step1BusinessInfo({
  form,
  setField,
}: {
  form: ProviderDraftForm;
  setField: (k: keyof ProviderDraftForm, v: any) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={h2}>Business Information</h2>

      <div style={grid}>
        <Field label="Business Name *">
          <input
            value={form.businessName}
            onChange={(e) => setField("businessName", e.target.value)}
            style={input}
            placeholder="e.g. Prime Rentals Ltd"
          />
        </Field>

        <Field label="Business Type *">
          <select
            value={form.businessType}
            onChange={(e) => setField("businessType", e.target.value)}
            style={input}
          >
            <option value="">Select type</option>
            <option value="Individual">Individual</option>
            <option value="Company">Company</option>
            <option value="Fleet">Fleet</option>
          </select>
        </Field>
      </div>

      <p style={hint}>Required fields must be valid before you can continue.</p>
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
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, margin: 0 };
const hint: React.CSSProperties = { fontSize: 12, color: "#9CA3AF", margin: 0 };
const labelStyle: React.CSSProperties = { fontSize: 13, color: "#9CA3AF" };
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};
const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#0B1220",
  border: "1px solid #1F2937",
  color: "#E5E7EB",
};
