import { useEffect, useState } from "react";

export function useCities(country: string, state: string) {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (!country || !state) {
      setCities([]);
      return;
    }

    fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state }),
    })
      .then((res) => res.json())
      .then((json) => {
        setCities(json.data);
      });
  }, [country, state]);

  return cities;
}
