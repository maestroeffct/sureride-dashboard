"use client";

import { ProviderDraftForm } from "@/src/types/rentalProvider";
import { useCountries } from "@/src/hooks/useCountries";
import { useStates } from "@/src/hooks/useStates";
import { useCities } from "@/src/hooks/useCities";

export default function Step3LocationOps({
  form,
  setField,
}: {
  form: ProviderDraftForm;
  setField: (k: keyof ProviderDraftForm, v: any) => void;
}) {
  const countries = useCountries();
  const states = useStates(form.country);
  const cities = useCities(form.country, form.state);

  const toggleZone = (z: string) => {
    const has = form.zones.includes(z);
    setField(
      "zones",
      has ? form.zones.filter((x) => x !== z) : [...form.zones, z]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={h2}>Location & Operations</h2>

      <div style={grid}>
        {/* COUNTRY */}
        <Field label="Country *">
          <select
            value={form.country}
            onChange={(e) => {
              setField("country", e.target.value);
              setField("state", "");
              setField("city", "");
              setField("zones", []);
            }}
            style={input}
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        {/* STATE */}
        <Field label="State *">
          <select
            value={form.state}
            onChange={(e) => {
              setField("state", e.target.value);
              setField("city", "");
              setField("zones", []);
            }}
            style={input}
            disabled={!states.length}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        {/* CITY */}
        <Field label="City *">
          <select
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            style={input}
            disabled={!cities.length}
          >
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* ZONES */}
      {form.city && (
        <div>
          <label style={labelStyle}>Operational Zones (multi-select)</label>

          <div style={chips}>
            {cities.map((z) => {
              const active = form.zones.includes(z);
              return (
                <button
                  key={z}
                  onClick={() => toggleZone(z)}
                  style={{
                    ...chip,
                    ...(active ? chipActive : {}),
                  }}
                  type="button"
                >
                  {z}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- */

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

/* -------------------------------- */
/* Styles (unchanged) */
/* -------------------------------- */

const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, margin: 0 };
const labelStyle: React.CSSProperties = { fontSize: 13, color: "#9CA3AF" };
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 14,
};
const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#0B1220",
  border: "1px solid #1F2937",
  color: "#E5E7EB",
};
const chips: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 10,
};
const chip: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #1F2937",
  background: "#020617",
  color: "#9CA3AF",
  cursor: "pointer",
};
const chipActive: React.CSSProperties = {
  background: "#2563EB22",
  borderColor: "#2563EB66",
  color: "#93C5FD",
};
