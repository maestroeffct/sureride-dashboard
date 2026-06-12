import { apiRequest } from "@/src/lib/api";

export type PlatformSettingsSection =
  | "sms-module"
  | "mail-config"
  | "map-apis"
  | "social-logins"
  | "firebase-otp"
  | "recaptcha"
  | "storage-connection"
  | "business-setup"
  | "system-tax"
  | "email-template"
  | "theme-settings"
  | "gallery"
  | "login-setup"
  | "pages-social-media"
  | "app-update-enforcement"
  | "notification-channels"
  | "notification-messages"
  | "webhook-config"
  | "push-config"
  | "inapp-config"
  | "promo-campaigns"
  | "promo-cashback"
  | "promo-banners"
  | "promo-push-history";

export type PlatformSettingsPayload = Record<string, unknown>;

type PlatformSettingsListResponse = {
  items: Array<{
    section: PlatformSettingsSection;
    payload: PlatformSettingsPayload;
    updatedAt?: string;
    countryId?: string | null;
    region?: string | null;
  }>;
};

type PlatformSettingsSaveResponse = {
  section: PlatformSettingsSection;
  payload: PlatformSettingsPayload;
  updatedAt?: string;
  countryId?: string | null;
  region?: string | null;
};

const DRAFT_STORAGE_KEY = "sureride_admin_platform_settings_draft_v1";

type ScopeOptions = {
  countryId?: string | null;
  // Sub-country region code (e.g. "CA", "NY"). Omit or pass "ALL" for
  // country-wide scope. Mirrors the backend's ALL_REGIONS sentinel.
  regionId?: string | null;
};

type TestMailPayload = {
  toEmail: string;
  payload: PlatformSettingsPayload;
};

function normalizeRegion(regionId?: string | null) {
  const trimmed = regionId?.trim();
  if (!trimmed || trimmed.toUpperCase() === "ALL") return undefined;
  return trimmed.toUpperCase();
}

function buildDraftStorageKey(options?: ScopeOptions) {
  const countryId = options?.countryId?.trim();
  const regionId = normalizeRegion(options?.regionId);
  if (!countryId) return DRAFT_STORAGE_KEY;
  return regionId
    ? `${DRAFT_STORAGE_KEY}:${countryId}:${regionId}`
    : `${DRAFT_STORAGE_KEY}:${countryId}`;
}

function buildScopeQueryString(options?: ScopeOptions) {
  const countryId = options?.countryId?.trim();
  if (!countryId) return "";

  const regionId = normalizeRegion(options?.regionId);
  const params = new URLSearchParams({ countryId });
  if (regionId) params.set("region", regionId);
  return `?${params.toString()}`;
}

function buildSettingsEndpoint(options?: ScopeOptions) {
  return `/admin/platform/settings${buildScopeQueryString(options)}`;
}

function buildSettingsSectionEndpoint(
  section: PlatformSettingsSection,
  options?: ScopeOptions,
) {
  return `/admin/platform/settings/${section}${buildScopeQueryString(options)}`;
}

function readLocalDraft(options?: ScopeOptions) {
  if (typeof window === "undefined") return {} as Record<string, PlatformSettingsPayload>;

  const raw = window.localStorage.getItem(buildDraftStorageKey(options));
  if (!raw) return {} as Record<string, PlatformSettingsPayload>;

  try {
    const data = JSON.parse(raw) as Record<string, PlatformSettingsPayload>;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeLocalDraft(
  next: Record<string, PlatformSettingsPayload>,
  options?: ScopeOptions,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(buildDraftStorageKey(options), JSON.stringify(next));
}

export async function listPlatformSettingsDraft(options?: ScopeOptions) {
  try {
    const data = await apiRequest<PlatformSettingsListResponse>(
      buildSettingsEndpoint(options),
    );

    const mapped: Partial<Record<PlatformSettingsSection, PlatformSettingsPayload>> = {};

    for (const item of data.items ?? []) {
      mapped[item.section] = item.payload ?? {};
    }

    writeLocalDraft(mapped as Record<string, PlatformSettingsPayload>, options);

    return {
      items: mapped,
      source: "server" as const,
    };
  } catch {
    const local = readLocalDraft(options) as Partial<
      Record<PlatformSettingsSection, PlatformSettingsPayload>
    >;

    return {
      items: local,
      source: "local" as const,
    };
  }
}

export async function savePlatformSettingsDraft(
  section: PlatformSettingsSection,
  payload: PlatformSettingsPayload,
  options?: ScopeOptions,
) {
  // Strip base64 data URLs before sending to server — they are too large and
  // will cause the request to fail. Only plain https:// URLs should be persisted.
  const sanitized = Object.fromEntries(
    Object.entries(payload).map(([k, v]) => {
      if (typeof v === "string" && v.startsWith("data:")) return [k, ""];
      return [k, v];
    }),
  );

  const data = await apiRequest<PlatformSettingsSaveResponse>(
    buildSettingsSectionEndpoint(section, options),
    {
      method: "PATCH",
      body: JSON.stringify({ payload: sanitized }),
    },
  );

  const local = readLocalDraft(options);
  local[section] = data.payload ?? sanitized;
  writeLocalDraft(local, options);

  return {
    source: "server" as const,
    payload: data.payload ?? sanitized,
  };
}

export async function sendPlatformTestMail(
  toEmail: string,
  payload: PlatformSettingsPayload,
) {
  return apiRequest<{ message: string }>("/admin/platform/settings/mail-config/test", {
    method: "POST",
    body: JSON.stringify({
      toEmail,
      payload,
    } satisfies TestMailPayload),
  });
}

// ── Webhook test ────────────────────────────────────────────────────────────

export type WebhookTestPayload = {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
};

export type WebhookTestResult = {
  delivered: boolean;
  status: number;
  statusText: string;
};

export async function sendWebhookTest(payload: WebhookTestPayload) {
  return apiRequest<WebhookTestResult>("/admin/platform/settings/webhook-config/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Push notification test ──────────────────────────────────────────────────

export type PushTestPayload = {
  // Either serviceAccountJson (preferred, v1 API) or serverKey (legacy) must
  // be provided. Backend picks v1 if both are present.
  serviceAccountJson?: string;
  serverKey?: string;
  deviceToken: string;
  title?: string;
  body?: string;
};

export type PushTestResult = {
  delivered: boolean;
  status: number;
  response: unknown;
};

export async function sendPushTest(payload: PushTestPayload) {
  return apiRequest<PushTestResult>("/admin/platform/settings/push-config/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Firebase OTP config validator ────────────────────────────────────────

export type FirebaseValidatePayload = {
  projectId?: string;
  serviceAccountJson: string;
};

export type FirebaseValidateResult = {
  ok: boolean;
  projectId: string;
  clientEmail?: string;
  detail?: string;
};

export async function validateFirebaseOtpConfig(payload: FirebaseValidatePayload) {
  return apiRequest<FirebaseValidateResult>(
    "/admin/platform/settings/firebase-otp/test",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
