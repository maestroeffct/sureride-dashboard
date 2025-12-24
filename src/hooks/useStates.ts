import { useEffect, useState } from "react";

export function useStates(country: string) {
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => {
    if (!country) {
      setStates([]);
      return;
    }

    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    })
      .then((res) => res.json())
      .then((json) => {
        setStates(json.data.states.map((s: any) => s.name));
      });
  }, [country]);

  return states;
}
