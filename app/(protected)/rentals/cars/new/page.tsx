"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function AddCarPage() {
  const [form, setForm] = useState({
    providerName: "",
    locationName: "",
    brand: "",
    model: "",
    category: "ECONOMY",
    year: "",
    seats: "",
    bags: "",
    transmission: "AUTOMATIC",
    mileagePolicy: "UNLIMITED",
    dailyRate: "",
    hourlyRate: "",
    hasAC: true,
  });

  const setField = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = () => {
    toast("Car draft UI ready. Hook create endpoint when backend is available.");
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Add Car</h1>
        <p style={styles.subtitle}>Create a new rental car listing</p>
      </div>

      <div style={styles.card}>
        <div style={styles.grid}>
          <Field label="Provider">
            <input
              value={form.providerName}
              onChange={(e) => setField("providerName", e.target.value)}
              placeholder="Provider name"
              style={styles.input}
            />
          </Field>

          <Field label="Location">
            <input
              value={form.locationName}
              onChange={(e) => setField("locationName", e.target.value)}
              placeholder="Location"
              style={styles.input}
            />
          </Field>

          <Field label="Brand">
            <input
              value={form.brand}
              onChange={(e) => setField("brand", e.target.value)}
              placeholder="Toyota"
              style={styles.input}
            />
          </Field>

          <Field label="Model">
            <input
              value={form.model}
              onChange={(e) => setField("model", e.target.value)}
              placeholder="Corolla"
              style={styles.input}
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              style={styles.input}
            >
              <option value="COMPACT">Compact</option>
              <option value="ECONOMY">Economy</option>
              <option value="LUXURY">Luxury</option>
            </select>
          </Field>

          <Field label="Year">
            <input
              value={form.year}
              onChange={(e) => setField("year", e.target.value)}
              placeholder="2024"
              style={styles.input}
            />
          </Field>

          <Field label="Seats">
            <input
              value={form.seats}
              onChange={(e) => setField("seats", e.target.value)}
              placeholder="4"
              style={styles.input}
            />
          </Field>

          <Field label="Bags">
            <input
              value={form.bags}
              onChange={(e) => setField("bags", e.target.value)}
              placeholder="2"
              style={styles.input}
            />
          </Field>

          <Field label="Transmission">
            <select
              value={form.transmission}
              onChange={(e) => setField("transmission", e.target.value)}
              style={styles.input}
            >
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </select>
          </Field>

          <Field label="Mileage Policy">
            <select
              value={form.mileagePolicy}
              onChange={(e) => setField("mileagePolicy", e.target.value)}
              style={styles.input}
            >
              <option value="UNLIMITED">Unlimited</option>
              <option value="LIMITED">Limited</option>
            </select>
          </Field>

          <Field label="Daily Rate (NGN)">
            <input
              value={form.dailyRate}
              onChange={(e) => setField("dailyRate", e.target.value)}
              placeholder="25000"
              style={styles.input}
            />
          </Field>

          <Field label="Hourly Rate (NGN)">
            <input
              value={form.hourlyRate}
              onChange={(e) => setField("hourlyRate", e.target.value)}
              placeholder="4000"
              style={styles.input}
            />
          </Field>
        </div>

        <label style={styles.checkboxWrap}>
          <input
            type="checkbox"
            checked={form.hasAC}
            onChange={(e) => setField("hasAC", e.target.checked)}
          />
          <span>Air Conditioning (AC)</span>
        </label>

        <div style={styles.actions}>
          <button style={styles.btnSecondary} onClick={() => history.back()}>
            Cancel
          </button>
          <button style={styles.btnPrimary} onClick={onSave}>
            Save Draft
          </button>
        </div>
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
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    maxWidth: 1100,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 13,
  },
  card: {
    borderRadius: 14,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: "var(--fg-70)",
    fontWeight: 600,
  },
  input: {
    height: 42,
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
  },
  checkboxWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "var(--fg-80)",
    fontSize: 14,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  btnSecondary: {
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--foreground)",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
  btnPrimary: {
    border: "none",
    background: "#2563EB",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
};
