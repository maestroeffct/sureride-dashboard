// Maps ISO-3166 alpha-2 country codes to their ISO-4217 currency code and
// symbol. Used by provider forms to display the right currency next to rate
// inputs based on the selected fleet location.
//
// Coverage targets countries we actively support; unknown codes fall back to
// NGN since that's the platform's primary market.

type CurrencyInfo = { code: string; symbol: string };

const CURRENCY_BY_COUNTRY: Record<string, CurrencyInfo> = {
  NG: { code: "NGN", symbol: "₦" },
  GH: { code: "GHS", symbol: "GH₵" },
  KE: { code: "KES", symbol: "KSh" },
  ZA: { code: "ZAR", symbol: "R" },
  UG: { code: "UGX", symbol: "USh" },
  TZ: { code: "TZS", symbol: "TSh" },
  RW: { code: "RWF", symbol: "FRw" },
  EG: { code: "EGP", symbol: "E£" },
  MA: { code: "MAD", symbol: "د.م." },
  SN: { code: "XOF", symbol: "CFA" },
  CI: { code: "XOF", symbol: "CFA" },
  CM: { code: "XAF", symbol: "FCFA" },
  US: { code: "USD", symbol: "$" },
  GB: { code: "GBP", symbol: "£" },
  UK: { code: "GBP", symbol: "£" },
  CA: { code: "CAD", symbol: "CA$" },
  AU: { code: "AUD", symbol: "A$" },
  EU: { code: "EUR", symbol: "€" },
  FR: { code: "EUR", symbol: "€" },
  DE: { code: "EUR", symbol: "€" },
  ES: { code: "EUR", symbol: "€" },
  IT: { code: "EUR", symbol: "€" },
  AE: { code: "AED", symbol: "د.إ" },
  SA: { code: "SAR", symbol: "﷼" },
  IN: { code: "INR", symbol: "₹" },
};

export function currencyForCountryCode(code?: string | null): CurrencyInfo {
  if (!code) return { code: "NGN", symbol: "₦" };
  return (
    CURRENCY_BY_COUNTRY[code.trim().toUpperCase()] ?? {
      code: "NGN",
      symbol: "₦",
    }
  );
}

// De-duplicated list of currencies the platform supports — derived from the
// country→currency map so we never drift. Used to populate the currency
// override dropdown on the provider Add Car form.
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = (() => {
  const seen = new Map<string, CurrencyInfo>();
  for (const info of Object.values(CURRENCY_BY_COUNTRY)) {
    if (!seen.has(info.code)) seen.set(info.code, info);
  }
  return Array.from(seen.values()).sort((a, b) => a.code.localeCompare(b.code));
})();

export function currencyForCountryCodeByCurrency(code: string): CurrencyInfo {
  const upper = code.trim().toUpperCase();
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === upper) ?? {
      code: upper || "NGN",
      symbol: upper || "₦",
    }
  );
}
