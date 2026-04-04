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
  }>;
};

type PlatformSettingsSaveResponse = {
  section: PlatformSettingsSection;
  payload: PlatformSettingsPayload;
  updatedAt?: string;
};

const DRAFT_STORAGE_KEY = "sureride_admin_platform_settings_draft_v1";

function readLocalDraft() {
  if (typeof window === "undefined") return {} as Record<string, PlatformSettingsPayload>;

  const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return {} as Record<string, PlatformSettingsPayload>;

  try {
    const data = JSON.parse(raw) as Record<string, PlatformSettingsPayload>;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeLocalDraft(next: Record<string, PlatformSettingsPayload>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
}

export async function listPlatformSettingsDraft() {
  try {
    const data = await apiRequest<PlatformSettingsListResponse>(
      "/admin/platform/settings",
    );

    const mapped: Partial<Record<PlatformSettingsSection, PlatformSettingsPayload>> = {};

    for (const item of data.items ?? []) {
      mapped[item.section] = item.payload ?? {};
    }

    writeLocalDraft(mapped as Record<string, PlatformSettingsPayload>);

    return {
      items: mapped,
      source: "server" as const,
    };
  } catch {
    const local = readLocalDraft() as Partial<
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
) {
  try {
    const data = await apiRequest<PlatformSettingsSaveResponse>(
      `/admin/platform/settings/${section}`,
      {
        method: "PATCH",
        body: JSON.stringify({ payload }),
      },
    );

    const local = readLocalDraft();
    local[section] = data.payload ?? payload;
    writeLocalDraft(local);

    return {
      source: "server" as const,
      payload: data.payload ?? payload,
    };
  } catch {
    const local = readLocalDraft();
    local[section] = payload;
    writeLocalDraft(local);

    return {
      source: "local" as const,
      payload,
    };
  }
}
