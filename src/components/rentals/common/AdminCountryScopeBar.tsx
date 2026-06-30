"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { AdminCountry } from "@/src/lib/adminCountriesApi";
import {
  GLOBAL_COUNTRY_SCOPE,
  GLOBAL_REGION_SCOPE,
  isGlobalCountryScope,
  isGlobalRegionScope,
} from "@/src/lib/adminCountryScope";
import { countryHasRegions, regionsFor } from "@/src/lib/adminRegions";
import {
  currencyForCountryCode,
  SUPPORTED_CURRENCIES,
} from "@/src/lib/currencyForCountry";

type Props = {
  scope: string;
  countries: AdminCountry[];
  loading?: boolean;
  allowManage?: boolean;
  onScopeChange: (scope: string) => void;
  onCreateCountry?: (payload: {
    name: string;
    code: string;
    currency?: string | null;
  }) => Promise<void>;
  onToggleCountry?: (country: AdminCountry) => Promise<void>;
  /**
   * Update an existing country's currency. The same `updateAdminCountry`
   * endpoint handles every field, but the bar only exposes a focused control
   * for currency since that's what feeds the mobile picker.
   */
  onUpdateCountryCurrency?: (
    country: AdminCountry,
    currency: string,
  ) => Promise<void>;
  // Region scope is optional — pages that don't care about sub-country scoping
  // can omit it and the region picker stays hidden. Pages that do care pass
  // both pieces in and the bar surfaces a second dropdown for countries with
  // a region catalog (US states, CA provinces, AU states/territories).
  regionScope?: string;
  onRegionScopeChange?: (scope: string) => void;
};

export default function AdminCountryScopeBar({
  scope,
  countries,
  loading = false,
  allowManage = false,
  onScopeChange,
  onCreateCountry,
  onToggleCountry,
  onUpdateCountryCurrency,
  regionScope = GLOBAL_REGION_SCOPE,
  onRegionScopeChange,
}: Props) {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryCurrency, setCountryCurrency] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingCountryId, setPendingCountryId] = useState<string | null>(null);
  const [currencyDrafts, setCurrencyDrafts] = useState<Record<string, string>>({});
  const [savingCurrencyFor, setSavingCurrencyFor] = useState<string | null>(null);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.id === scope) ?? null,
    [countries, scope],
  );

  const activeCountries = useMemo(
    () => countries.filter((country) => country.isActive),
    [countries],
  );

  // Region picker only renders when (a) a country is selected AND (b) the
  // caller wired up an onRegionScopeChange handler AND (c) the catalog lists
  // sub-regions for this country.
  const regionsForCountry = useMemo(
    () => (selectedCountry ? regionsFor(selectedCountry.code) : []),
    [selectedCountry],
  );
  const showRegionPicker =
    !!selectedCountry &&
    !!onRegionScopeChange &&
    countryHasRegions(selectedCountry.code);
  const activeRegion = regionsForCountry.find((r) => r.code === regionScope);

  const handleCreate = async () => {
    if (!onCreateCountry) {
      return;
    }

    const name = countryName.trim();
    const code = countryCode.trim().toUpperCase();
    const currency = countryCurrency.trim().toUpperCase();

    if (!name || code.length < 2) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateCountry({
        name,
        code,
        currency: currency.length === 3 ? currency : null,
      });
      setCountryName("");
      setCountryCode("");
      setCountryCurrency("");
      setIsManageOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCurrency = async (country: AdminCountry) => {
    if (!onUpdateCountryCurrency) return;
    const next = (currencyDrafts[country.id] ?? "").trim().toUpperCase();
    if (next.length !== 3 || next === country.currency) return;
    try {
      setSavingCurrencyFor(country.id);
      await onUpdateCountryCurrency(country, next);
      setCurrencyDrafts((prev) => {
        const { [country.id]: _drop, ...rest } = prev;
        return rest;
      });
    } finally {
      setSavingCurrencyFor(null);
    }
  };

  const handleToggleCountry = async (country: AdminCountry) => {
    if (!onToggleCountry) {
      return;
    }

    try {
      setPendingCountryId(country.id);
      await onToggleCountry(country);
    } finally {
      setPendingCountryId(null);
    }
  };

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Country Scope</p>
          <h2 style={styles.title}>Global defaults and country overrides</h2>
          <p style={styles.text}>
            Choose whether you are editing the shared platform defaults or a specific
            country override.
          </p>
        </div>

        <div style={styles.selectorBlock}>
          <select
            style={styles.select}
            value={scope}
            onChange={(event) => onScopeChange(event.target.value)}
            disabled={loading}
          >
            <option value={GLOBAL_COUNTRY_SCOPE}>Global defaults</option>
            {activeCountries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>

          {showRegionPicker ? (
            <select
              style={styles.select}
              value={regionScope}
              onChange={(event) => onRegionScopeChange?.(event.target.value)}
              disabled={loading}
            >
              <option value={GLOBAL_REGION_SCOPE}>
                All {selectedCountry?.code}
              </option>
              {regionsForCountry.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.label}
                </option>
              ))}
            </select>
          ) : null}

          {allowManage && onCreateCountry ? (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setIsManageOpen((value) => !value)}
            >
              {isManageOpen ? "Close Country Manager" : "Manage Countries"}
            </button>
          ) : null}
        </div>
      </div>

      <div style={styles.summaryRow}>
        <span
          style={{
            ...styles.scopePill,
            ...(isGlobalCountryScope(scope) ? styles.scopePillGlobal : styles.scopePillCountry),
          }}
        >
          {selectedCountry
            ? activeRegion
              ? `Editing ${selectedCountry.name} / ${activeRegion.label} override`
              : `Editing ${selectedCountry.name} override`
            : "Editing global platform defaults"}
        </span>
        <span style={styles.summaryText}>
          {selectedCountry
            ? activeRegion
              ? `Only ${activeRegion.label}-scoped values will differ from the country-wide override.`
              : isGlobalRegionScope(regionScope) && showRegionPicker
                ? "Country-wide override applied to every region without its own settings."
                : "Only this country's override values will differ from the global defaults."
            : "Global defaults act as the fallback for every country without an explicit override."}
        </span>
      </div>

      {allowManage && isManageOpen ? (
        <div style={styles.managePanel}>
          <div style={styles.manageForm}>
            <input
              style={styles.input}
              placeholder="Country name"
              value={countryName}
              onChange={(event) => setCountryName(event.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Code"
              maxLength={3}
              value={countryCode}
              onChange={(event) => {
                const upper = event.target.value.toUpperCase();
                setCountryCode(upper);
                // Suggest the currency that matches the country code if the
                // admin hasn't already picked one. Lets them tab past the
                // currency field in the common case.
                if (!countryCurrency && upper.length >= 2) {
                  setCountryCurrency(currencyForCountryCode(upper).code);
                }
              }}
            />
            <select
              style={styles.input}
              value={countryCurrency}
              onChange={(event) => setCountryCurrency(event.target.value)}
            >
              <option value="">Currency…</option>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol})
                </option>
              ))}
            </select>
            <button
              type="button"
              style={styles.primaryButton}
              disabled={isSubmitting}
              onClick={handleCreate}
            >
              {isSubmitting ? "Saving..." : "Add Country"}
            </button>
          </div>

          <div style={styles.countryGrid}>
            {countries.map((country) => {
              const draft = currencyDrafts[country.id];
              const currentDisplayed = draft ?? country.currency ?? "";
              const draftDiffers =
                draft !== undefined &&
                draft.trim().toUpperCase() !== (country.currency ?? "");
              const draftValid = currentDisplayed.trim().length === 3;
              return (
                <div key={country.id} style={styles.countryCard}>
                  <div style={{ flex: 1 }}>
                    <strong style={styles.countryName}>{country.name}</strong>
                    <p style={styles.countryMeta}>
                      {country.code} · {country.locationsCount} location
                      {country.locationsCount === 1 ? "" : "s"}
                    </p>
                    {onUpdateCountryCurrency ? (
                      <div style={styles.currencyRow}>
                        <select
                          style={styles.currencyInput}
                          value={currentDisplayed}
                          onChange={(event) =>
                            setCurrencyDrafts((prev) => ({
                              ...prev,
                              [country.id]: event.target.value.toUpperCase(),
                            }))
                          }
                        >
                          <option value="">Currency…</option>
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.code} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          style={styles.currencySaveBtn}
                          disabled={
                            !draftDiffers ||
                            !draftValid ||
                            savingCurrencyFor === country.id
                          }
                          onClick={() => void handleSaveCurrency(country)}
                        >
                          {savingCurrencyFor === country.id
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </div>
                    ) : country.currency ? (
                      <p style={styles.countryMeta}>Currency: {country.currency}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    style={country.isActive ? styles.deactivateButton : styles.activateButton}
                    disabled={pendingCountryId === country.id}
                    onClick={() => void handleToggleCountry(country)}
                  >
                    {pendingCountryId === country.id
                      ? "Updating..."
                      : country.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.78))",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    color: "rgba(148,163,184,0.78)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    margin: "8px 0 10px",
    fontSize: 24,
    lineHeight: 1.2,
    color: "#f8fafc",
  },
  text: {
    margin: 0,
    maxWidth: 720,
    color: "rgba(226,232,240,0.78)",
    lineHeight: 1.6,
  },
  selectorBlock: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  select: {
    minWidth: 240,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "rgba(15,23,42,0.72)",
    color: "#f8fafc",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  secondaryButton: {
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "rgba(255,255,255,0.06)",
    color: "#f8fafc",
    padding: "0 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  summaryRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  scopePill: {
    borderRadius: 999,
    padding: "9px 14px",
    fontSize: 12,
    fontWeight: 700,
  },
  scopePillGlobal: {
    background: "color-mix(in srgb, var(--info-blue) 18%, transparent)",
    color: "#bfdbfe",
  },
  scopePillCountry: {
    background: "rgba(16,185,129,0.18)",
    color: "#a7f3d0",
  },
  summaryText: {
    color: "rgba(226,232,240,0.76)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  managePanel: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  manageForm: {
    display: "grid",
    gridTemplateColumns:
      "minmax(180px, 1.4fr) minmax(80px, 0.6fr) minmax(110px, 0.8fr) auto",
    gap: 10,
  },
  currencyRow: {
    marginTop: 8,
    display: "flex",
    gap: 6,
  },
  currencyInput: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "rgba(15,23,42,0.72)",
    color: "#f8fafc",
    padding: "0 10px",
    fontSize: 13,
    letterSpacing: 0.4,
    outline: "none",
  },
  currencySaveBtn: {
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "rgba(16,185,129,0.18)",
    color: "#a7f3d0",
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  input: {
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "rgba(15,23,42,0.72)",
    color: "#f8fafc",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  primaryButton: {
    height: 44,
    borderRadius: 14,
    border: "none",
    background: "#0f766e",
    color: "#f8fafc",
    padding: "0 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  countryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  countryCard: {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.16)",
    background: "rgba(15,23,42,0.46)",
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  countryName: {
    color: "#f8fafc",
    fontSize: 15,
  },
  countryMeta: {
    margin: "4px 0 0",
    color: "rgba(148,163,184,0.78)",
    fontSize: 12,
  },
  activateButton: {
    height: 36,
    borderRadius: 12,
    border: "none",
    background: "rgba(16,185,129,0.18)",
    color: "#a7f3d0",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  deactivateButton: {
    height: 36,
    borderRadius: 12,
    border: "none",
    background: "rgba(248,113,113,0.18)",
    color: "#fecaca",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
