export const GLOBAL_COUNTRY_SCOPE = "GLOBAL";
export const GLOBAL_REGION_SCOPE = "ALL";

const COUNTRY_SCOPE_STORAGE_KEY = "sureride_admin_country_scope_v1";
const REGION_SCOPE_STORAGE_KEY = "sureride_admin_region_scope_v1";

// ── country ──────────────────────────────────────────────────────────────
export function readAdminCountryScope() {
  if (typeof window === "undefined") {
    return GLOBAL_COUNTRY_SCOPE;
  }

  const saved = window.localStorage.getItem(COUNTRY_SCOPE_STORAGE_KEY)?.trim();
  return saved || GLOBAL_COUNTRY_SCOPE;
}

export function writeAdminCountryScope(scope: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COUNTRY_SCOPE_STORAGE_KEY, scope || GLOBAL_COUNTRY_SCOPE);
  // Region is country-specific — stale once the country changes. Drop it so
  // we never end up in a "GLOBAL country + Lagos region" combo.
  window.localStorage.removeItem(REGION_SCOPE_STORAGE_KEY);
}

export function isGlobalCountryScope(scope: string | null | undefined) {
  return !scope || scope === GLOBAL_COUNTRY_SCOPE;
}

export function toCountryId(scope: string | null | undefined) {
  return isGlobalCountryScope(scope) ? undefined : scope ?? undefined;
}

// ── region ───────────────────────────────────────────────────────────────
export function readAdminRegionScope() {
  if (typeof window === "undefined") {
    return GLOBAL_REGION_SCOPE;
  }

  const saved = window.localStorage.getItem(REGION_SCOPE_STORAGE_KEY)?.trim();
  return saved || GLOBAL_REGION_SCOPE;
}

export function writeAdminRegionScope(scope: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REGION_SCOPE_STORAGE_KEY, scope || GLOBAL_REGION_SCOPE);
}

export function isGlobalRegionScope(scope: string | null | undefined) {
  return !scope || scope === GLOBAL_REGION_SCOPE;
}

export function toRegionId(scope: string | null | undefined) {
  return isGlobalRegionScope(scope) ? undefined : scope ?? undefined;
}
