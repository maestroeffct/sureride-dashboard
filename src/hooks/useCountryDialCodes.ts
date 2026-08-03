import { useMemo, useState } from "react";
import { COUNTRY_DIAL_CODES } from "@/src/lib/countryDialCodes";

export interface CountryDialCode {
  name: string;
  code: string;
  dialCode: string;
}

/**
 * Returns the full list of country dial codes.
 *
 * Previously fetched from https://countriesnow.space, but that host is
 * blocked by our strict CSP (`connect-src`). We now ship the list bundled
 * so it works offline, in air-gapped Envato-buyer installs, and behind any
 * CSP without a network round-trip. The list is stable — countries and
 * dial codes don't churn — so a static import is the right call.
 */
export function useCountryDialCodes() {
  const [loading] = useState(false);
  const countries = useMemo(() => COUNTRY_DIAL_CODES, []);
  return { countries, loading };
}
