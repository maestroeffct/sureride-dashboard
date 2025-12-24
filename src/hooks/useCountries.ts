import { useEffect, useState } from "react";

export function useCountries() {
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries")
      .then((res) => res.json())
      .then((json) => {
        setCountries(json.data.map((c: any) => c.country));
      });
  }, []);

  return countries;
}
