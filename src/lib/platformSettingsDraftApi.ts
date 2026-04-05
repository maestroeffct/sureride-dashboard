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
  | "pages-social-media";

export type PlatformSettingsPayload = Record<string, unknown>;

type PlatformSettingsListResponse = {
  items: Array<{
    section: PlatformSettingsSection;
    payload: PlatformSettingsPayload;
    updatedAt?: string;
    countryId?: string | null;
  }>;
};

type PlatformSettingsSaveResponse = {
  section: PlatformSettingsSection;
  payload: PlatformSettingsPayload;
  updatedAt?: string;
  countryId?: string | null;
};

const DRAFT_STORAGE_KEY = "sureride_admin_platform_settings_draft_v1";

type ScopeOptions = {
  countryId?: string | null;
};

type TestMailPayload = {
  toEmail: string;
  payload: PlatformSettingsPayload;
};

function buildDraftStorageKey(options?: ScopeOptions) {
  const countryId = options?.countryId?.trim();
  return countryId ? `${DRAFT_STORAGE_KEY}:${countryId}` : DRAFT_STORAGE_KEY;
}

function buildSettingsEndpoint(options?: ScopeOptions) {
  const countryId = options?.countryId?.trim();
  if (!countryId) {
    return "/admin/platform/settings";
  }

  return `/admin/platform/settings?countryId=${encodeURIComponent(countryId)}`;
}

function buildSettingsSectionEndpoint(
  section: PlatformSettingsSection,
  options?: ScopeOptions,
) {
  const countryId = options?.countryId?.trim();
  if (!countryId) {
    return `/admin/platform/settings/${section}`;
  }

  return `/admin/platform/settings/${section}?countryId=${encodeURIComponent(countryId)}`;
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
  try {
    const data = await apiRequest<PlatformSettingsSaveResponse>(
      buildSettingsSectionEndpoint(section, options),
      {
        method: "PATCH",
        body: JSON.stringify({ payload }),
      },
    );

    const local = readLocalDraft(options);
    local[section] = data.payload ?? payload;
    writeLocalDraft(local, options);

    return {
      source: "server" as const,
      payload: data.payload ?? payload,
    };
  } catch {
    const local = readLocalDraft(options);
    local[section] = payload;
    writeLocalDraft(local, options);

    return {
      source: "local" as const,
      payload,
    };
  }
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
