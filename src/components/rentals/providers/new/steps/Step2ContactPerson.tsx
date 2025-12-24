"use client";

import { ProviderDraftForm } from "@/src/types/rentalProvider";
import { useCountryDialCodes } from "@/src/hooks/useCountryDialCodes";
import { useEffect, useRef, useState } from "react";

export default function Step2ContactPerson({
  form,
  setField,
}: {
  form: ProviderDraftForm;
  setField: (k: keyof ProviderDraftForm, v: any) => void;
}) {
  const { countries } = useCountryDialCodes();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 style={h2}>Primary Contact Person</h2>

      <div style={grid}>
        <Field label="Full Name *">
          <input
            value={form.contactName}
            onChange={(e) => setField("contactName", e.target.value)}
            style={input}
            placeholder="e.g. John Doe"
          />
        </Field>

        <Field label="Role / Title">
          <input
            value={form.contactRole}
            onChange={(e) => setField("contactRole", e.target.value)}
            style={input}
            placeholder="e.g. Manager"
          />
        </Field>

        <Field label="Email Address *">
          <input
            value={form.contactEmail}
            onChange={(e) => setField("contactEmail", e.target.value)}
            style={input}
            placeholder="name@company.com"
          />
          <p style={hint}>This will be the login email.</p>
        </Field>

        {/* ✅ PHONE INPUT */}
        <Field label="Phone Number *">
          <div style={phoneRow}>
            {/* DIAL CODE PICKER */}
            <DialCodePicker
              countries={countries}
              value={form.contactDialCode}
              onSelect={(c) => {
                setField("contactCountry", c.name);
                setField("contactDialCode", c.dialCode);
              }}
            />

            {/* LOCAL NUMBER */}
            <input
              value={form.contactPhone}
              onChange={(e) =>
                setField("contactPhone", e.target.value.replace(/\D/g, ""))
              }
              style={phoneInput}
              placeholder="8012345678"
            />
          </div>

          <p style={hint}>
            Full number: {form.contactDialCode}
            {form.contactPhone}
          </p>
        </Field>
      </div>
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

function DialCodePicker({
  countries,
  value,
  onSelect,
}: {
  countries: { name: string; dialCode: string; code: string }[];
  value: string;
  onSelect: (c: { name: string; dialCode: string; code: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.dialCode.includes(query)
  );

  const selected = countries.find((c) => c.dialCode === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* BUTTON (flag + dial code only) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={dialButton}
      >
        {selected ? (
          <span style={dialButtonInner}>
            <span>{countryCodeToFlag(selected.code)}</span>
            <span>{selected.dialCode}</span>
          </span>
        ) : (
          "+--"
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div style={dropdown}>
          {/* SEARCH */}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country or code…"
            style={searchInput}
          />

          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.map((c) => (
              <DropdownItem
                key={c.code}
                country={c}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                  setQuery("");
                }}
              />
            ))}

            {filtered.length === 0 && <div style={emptyState}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  country,
  onClick,
}: {
  country: { name: string; dialCode: string; code: string };
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...dropdownItem,
        background: hover ? "#0F172A" : "transparent",
      }}
    >
      <span style={itemLeft}>
        <span>{countryCodeToFlag(country.code)}</span>
        <span>{country.name}</span>
      </span>

      <span style={itemCode}>{country.dialCode}</span>
    </button>
  );
}

function countryCodeToFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/* -------------------------------- */
/* Styles */
/* -------------------------------- */

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

const phoneRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px 1fr", // 👈 compact dial code
  gap: 10,
};

const select: React.CSSProperties = {
  ...input,
  cursor: "pointer",
};

const phoneInput: React.CSSProperties = {
  ...input,
};

const dialButton: React.CSSProperties = {
  height: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  background: "#0B1220",
  border: "1px solid #1F2937",
  color: "#E5E7EB",
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
};

const dropdown: React.CSSProperties = {
  position: "absolute",
  top: "110%",
  left: 0,
  width: 260,
  maxHeight: 260,
  overflowY: "auto",
  background: "#020617",
  border: "1px solid #1F2937",
  borderRadius: 12,
  zIndex: 20,
};
// hover handled via onMouseEnter/onMouseLeave in the DropdownItemButton component above
const dropdownItem: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "transparent",
  border: "none",
  color: "#E5E7EB",
  textAlign: "left",
  cursor: "pointer",
};

const dialButtonInner: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 14,
};

const searchInput: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  background: "#0B1220",
  border: "1px solid #1F2937",
  color: "#E5E7EB",
  marginBottom: 8,
};

const itemLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const itemCode: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: 13,
};

const emptyState: React.CSSProperties = {
  padding: 12,
  textAlign: "center",
  fontSize: 13,
  color: "#6B7280",
};

// dropdownItem[":hover"] = { background: "#0F172A" };
