"use client";

import { useEffect, useState } from "react";
import {
  getProviderVerificationStatus,
  type ProviderVerificationStatus,
} from "@/src/lib/providerApi";

/**
 * Fetches the current provider's verification status once and exposes the
 * loading/error state alongside the data. Pages can use the returned
 * `canListCars` flag to gate the Add-Car action without re-querying.
 *
 * Errors are swallowed (silent) on the assumption that a network blip
 * shouldn't lock the provider out of their own dashboard. Pages that need
 * stricter behaviour should check `error` themselves.
 */
export function useProviderVerification() {
  const [status, setStatus] = useState<ProviderVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProviderVerificationStatus()
      .then((res) => {
        if (!cancelled) setStatus(res);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load status");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    status,
    loading,
    error,
    canListCars: status?.canListCars ?? false,
    canReceivePayouts: status?.canReceivePayouts ?? false,
  };
}
