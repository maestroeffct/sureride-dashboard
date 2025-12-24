import { useEffect, useState } from "react";

export interface CountryDialCode {
  name: string;
  code: string;
  dialCode: string;
}

export function useCountryDialCodes() {
  const [countries, setCountries] = useState<CountryDialCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries/codes")
      .then((res) => res.json())
      .then((json) => {
        const mapped = json.data.map((c: any) => ({
          name: c.name,
          code: c.code,
          dialCode: c.dial_code,
        }));
        setCountries(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  return { countries, loading };
}
