export const GLOBAL_COUNTRY_SCOPE = "GLOBAL";
const COUNTRY_SCOPE_STORAGE_KEY = "sureride_admin_country_scope_v1";

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
}

export function isGlobalCountryScope(scope: string | null | undefined) {
  return !scope || scope === GLOBAL_COUNTRY_SCOPE;
}

export function toCountryId(scope: string | null | undefined) {
  return isGlobalCountryScope(scope) ? undefined : scope ?? undefined;
}
