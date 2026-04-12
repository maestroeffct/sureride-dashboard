"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Copy, Info, MailCheck, MapPinned, MessageSquareText, PlugZap, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import AdminCountryScopeBar from "@/src/components/rentals/common/AdminCountryScopeBar";
import { listAdminCountries, type AdminCountry } from "@/src/lib/adminCountriesApi";
import {
  readAdminCountryScope,
  toCountryId,
  writeAdminCountryScope,
} from "@/src/lib/adminCountryScope";
import {
  archiveAdminPaymentGateway,
  createAdminPaymentGateway,
  getAdminPaymentGatewayMeta,
  listAdminPaymentGateways,
  replaceAdminPaymentGatewayFields,
  replaceAdminPaymentGatewayValues,
  setAdminDefaultPaymentGateway,
  setAdminPaymentGatewayEnabled,
  updateAdminPaymentGateway,
  uploadAdminPaymentGatewayLogo,
  type AdminPaymentFieldType,
  type AdminPaymentGateway,
  type AdminPaymentGatewayField,
  type AdminPaymentGatewayMeta,
  type AdminPaymentGatewayRuntimeAdapter,
} from "@/src/lib/adminPaymentsApi";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
  sendPlatformTestMail,
  type PlatformSettingsSection,
} from "@/src/lib/platformSettingsDraftApi";

type ThirdPartyTab =
  | "payment-methods"
  | "sms-module"
  | "mail-config"
  | "map-apis"
  | "social-logins"
  | "firebase-otp"
  | "recaptcha"
  | "storage-connection";

type GatewayMode = "Live" | "Test";

type PaymentGatewayField = {
  id: string;
  label: string;
  type: AdminPaymentFieldType;
  value: string;
  required: boolean;
  secret?: boolean;
  hasStoredValue?: boolean;
  sortOrder: number;
  placeholder?: string | null;
  helpText?: string | null;
  defaultValue?: string | null;
  validationRegex?: string | null;
  options?: Record<string, unknown> | null;
};

type PaymentGateway = {
  id: string;
  name: string;
  brandText: string;
  logoUrl?: string;
  enabled: boolean;
  mode: GatewayMode;
  fields: PaymentGatewayField[];
  runtimeAdapter: AdminPaymentGatewayRuntimeAdapter;
  isDefault: boolean;
  isRuntimeSupported: boolean;
  missingRequiredFieldKeys: string[];
  missingRuntimeFieldKeys: string[];
  readinessIssues: string[];
  isReadyForCheckout: boolean;
};

type ParameterLibraryItem = {
  id: string;
  label: string;
  type: AdminPaymentFieldType;
  secret?: boolean;
  required?: boolean;
  defaultValue?: string;
};

type DraftParameterState = {
  include: boolean;
  required: boolean;
};

type DraftParameterMap = Record<string, DraftParameterState>;

const TABS: Array<{ id: ThirdPartyTab; label: string }> = [
  { id: "payment-methods", label: "Payment Methods" },
  { id: "sms-module", label: "SMS Module" },
  { id: "mail-config", label: "Mail Config" },
  { id: "map-apis", label: "Map APIs" },
  { id: "social-logins", label: "Social Logins" },
  { id: "firebase-otp", label: "Firebase OTP" },
  { id: "recaptcha", label: "Recaptcha" },
  { id: "storage-connection", label: "Storage Connection" },
];

const DEFAULT_GATEWAY_PARAMETER_LIBRARY: ParameterLibraryItem[] = [
  { id: "public_key", label: "Public Key", type: "TEXT" },
  { id: "secret_key", label: "Secret Key", type: "SECRET", secret: true },
  { id: "merchant_email", label: "Merchant Email", type: "EMAIL" },
  { id: "callback_url", label: "Callback Url", type: "URL" },
  { id: "encryption_key", label: "Encryption Key", type: "SECRET", secret: true },
  {
    id: "encryption_format",
    label: "Encryption Key Format",
    type: "TEXT",
    defaultValue: "base64",
  },
  { id: "client_id", label: "Client Id", type: "TEXT" },
  { id: "client_secret", label: "Client Secret", type: "SECRET", secret: true },
  { id: "api_key", label: "API Key", type: "SECRET", secret: true },
  { id: "webhook_secret", label: "Webhook Secret", type: "SECRET", secret: true },
];

function getLibraryById(library: ParameterLibraryItem[], id: string) {
  return library.find((item) => item.id === id);
}

function toUiMode(mode: "TEST" | "LIVE"): GatewayMode {
  return mode === "LIVE" ? "Live" : "Test";
}

function toApiMode(mode: GatewayMode): "TEST" | "LIVE" {
  return mode === "Live" ? "LIVE" : "TEST";
}

function slugifyGatewayKey(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong";
}

function mapApiFieldToUi(field: AdminPaymentGatewayField): PaymentGatewayField {
  return {
    id: field.key,
    label: field.label,
    type: field.type,
    value: field.currentValue ?? "",
    required: field.isRequired,
    secret: field.isSecret,
    hasStoredValue: Boolean(field.credentialState?.hasValue),
    sortOrder: field.sortOrder,
    placeholder: field.placeholder ?? null,
    helpText: field.helpText ?? null,
    defaultValue: field.defaultValue ?? null,
    validationRegex: field.validationRegex ?? null,
    options: field.options ?? null,
  };
}

function mapApiGatewayToUi(gateway: AdminPaymentGateway): PaymentGateway {
  return {
    id: gateway.key,
    name: gateway.displayName,
    brandText: gateway.displayName,
    logoUrl: gateway.logoUrl ?? "",
    enabled: gateway.isEnabled,
    mode: toUiMode(gateway.mode),
    runtimeAdapter: gateway.runtimeAdapter,
    isDefault: gateway.isDefault,
    isRuntimeSupported: gateway.isRuntimeSupported,
    missingRequiredFieldKeys: gateway.missingRequiredFieldKeys ?? [],
    missingRuntimeFieldKeys: gateway.missingRuntimeFieldKeys ?? [],
    readinessIssues: gateway.readinessIssues ?? [],
    isReadyForCheckout: gateway.isReadyForCheckout,
    fields: [...gateway.fields]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapApiFieldToUi),
  };
}

function buildGatewayField(
  library: ParameterLibraryItem[],
  paramId: string,
  required: boolean,
  sortOrder: number,
): PaymentGatewayField | null {
  const item = getLibraryById(library, paramId);
  if (!item) return null;
  return {
    id: item.id,
    label: item.label,
    type: item.type,
    value: item.defaultValue ?? "",
    required,
    secret: item.secret,
    hasStoredValue: false,
    sortOrder,
    defaultValue: item.defaultValue ?? null,
  };
}

function createDefaultDraftParameters(library: ParameterLibraryItem[]): DraftParameterMap {
  return library.reduce<DraftParameterMap>((acc, item) => {
    acc[item.id] = {
      include: ["public_key", "secret_key", "merchant_email"].includes(item.id),
      required: ["public_key", "secret_key", "merchant_email"].includes(item.id),
    };
    return acc;
  }, {});
}

function parameterLibraryFromMeta(
  meta: AdminPaymentGatewayMeta | null,
): ParameterLibraryItem[] {
  if (!meta?.templates?.length) return DEFAULT_GATEWAY_PARAMETER_LIBRARY;

  const byKey = new Map<string, ParameterLibraryItem>();

  for (const template of meta.templates) {
    for (const field of template.fields) {
      if (!byKey.has(field.key)) {
        byKey.set(field.key, {
          id: field.key,
          label: field.label,
          type: field.type,
          secret: field.isSecret,
          defaultValue: field.defaultValue ?? undefined,
        });
      }
    }
  }

  return Array.from(byKey.values());
}

function formatReadinessIssue(issue: string) {
  if (issue === "GATEWAY_DISABLED") return "Gateway is disabled";
  if (issue === "GATEWAY_RUNTIME_NOT_IMPLEMENTED") {
    return "Runtime adapter is not implemented";
  }
  if (issue.startsWith("MISSING_REQUIRED:")) {
    return `Missing required value: ${issue.replace("MISSING_REQUIRED:", "")}`;
  }
  if (issue.startsWith("MISSING_RUNTIME:")) {
    return `Missing runtime value: ${issue.replace("MISSING_RUNTIME:", "")}`;
  }
  return issue;
}

type FormState = {
  twilioActive: boolean;
  twilioSid: string;
  twilioMessagingSid: string;
  twilioToken: string;
  twilioFrom: string;
  twilioOtpTemplate: string;

  twoFactorActive: boolean;
  twoFactorApiKey: string;

  mailEnabled: boolean;
  mailProvider: "mailgun" | "sendgrid" | "custom";
  mailerName: string;
  mailHost: string;
  mailDriver: string;
  mailPort: string;
  mailUsername: string;
  mailEmailId: string;
  mailEncryption: string;
  mailPassword: string;

  mapEnabled: boolean;
  mapApiKey: string;

  firebaseEnabled: boolean;
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseAuthDomain: string;
  firebaseAppId: string;
  firebaseSenderId: string;

  recaptchaEnabled: boolean;
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;

  storageLocalEnabled: boolean;
  storageThirdPartyEnabled: boolean;
  storageThirdPartyProvider: string;
  storageS3Key: string;
  storageS3Secret: string;
  storageS3Region: string;
  storageS3Bucket: string;
  storageS3Endpoint: string;
  storageCloudinaryCloudName: string;
  storageCloudinaryApiKey: string;
  storageCloudinaryApiSecret: string;
  storageCloudinaryFolder: string;

  socialGoogleEnabled: boolean;
  socialGoogleCallbackUrl: string;
  socialGoogleClientId: string;
  socialGoogleClientSecret: string;

  socialFacebookEnabled: boolean;
  socialFacebookCallbackUrl: string;
  socialFacebookClientId: string;
  socialFacebookClientSecret: string;

  socialAppleEnabled: boolean;
  socialAppleCallbackUrl: string;
  socialAppleClientId: string;
  socialAppleClientSecret: string;
};

const INITIAL_STATE: FormState = {
  twilioActive: true,
  twilioSid: "",
  twilioMessagingSid: "",
  twilioToken: "",
  twilioFrom: "",
  twilioOtpTemplate: "",

  twoFactorActive: false,
  twoFactorApiKey: "",

  mailEnabled: true,
  mailProvider: "mailgun",
  mailerName: "Sureride",
  mailHost: "smtp.mailgun.org",
  mailDriver: "smtp",
  mailPort: "587",
  mailUsername: "",
  mailEmailId: "",
  mailEncryption: "tls",
  mailPassword: "",

  mapEnabled: true,
  mapApiKey: "",

  firebaseEnabled: true,
  firebaseApiKey: "",
  firebaseProjectId: "",
  firebaseAuthDomain: "",
  firebaseAppId: "",
  firebaseSenderId: "",

  recaptchaEnabled: false,
  recaptchaSiteKey: "",
  recaptchaSecretKey: "",

  storageLocalEnabled: true,
  storageThirdPartyEnabled: false,
  storageThirdPartyProvider: "s3",
  storageS3Key: "",
  storageS3Secret: "",
  storageS3Region: "",
  storageS3Bucket: "",
  storageS3Endpoint: "",
  storageCloudinaryCloudName: "",
  storageCloudinaryApiKey: "",
  storageCloudinaryApiSecret: "",
  storageCloudinaryFolder: "",

  socialGoogleEnabled: false,
  socialGoogleCallbackUrl: "",
  socialGoogleClientId: "",
  socialGoogleClientSecret: "",

  socialFacebookEnabled: false,
  socialFacebookCallbackUrl: "",
  socialFacebookClientId: "",
  socialFacebookClientSecret: "",

  socialAppleEnabled: false,
  socialAppleCallbackUrl: "",
  socialAppleClientId: "",
  socialAppleClientSecret: "",
};

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read file"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function ProviderCard({
  title,
  enabled,
  onToggle,
  children,
  onDelete,
  busy,
}: {
  title: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  children: React.ReactNode;
  onDelete: () => void;
  busy?: boolean;
}) {
  return (
    <article style={styles.providerCard}>
      <header style={styles.providerCardHeader}>
        <h4 style={styles.providerCardTitle}>{title}</h4>
        <div style={styles.cardHeaderActions}>
          <button
            type="button"
            style={styles.removeBtn}
            onClick={onDelete}
            disabled={busy}
          >
            {busy ? "Working..." : "Remove"}
          </button>
          <label style={styles.switchText}>
            <span>{enabled ? "ON" : "OFF"}</span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => onToggle(event.target.checked)}
              disabled={busy}
              style={styles.accentControl}
            />
          </label>
        </div>
      </header>
      <div style={styles.providerCardBody}>{children}</div>
    </article>
  );
}

export default function ThirdPartyConfigurationPage() {
  const [activeTab, setActiveTab] = useState<ThirdPartyTab>("payment-methods");
  const [mailInnerTab, setMailInnerTab] = useState<"config" | "test">("config");
  const [countryScope, setCountryScope] = useState(() => readAdminCountryScope());
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [paymentMeta, setPaymentMeta] = useState<AdminPaymentGatewayMeta | null>(null);

  const [isGatewayDrawerOpen, setIsGatewayDrawerOpen] = useState(false);
  const [draftGatewayName, setDraftGatewayName] = useState("");
  const [draftGatewayBrand, setDraftGatewayBrand] = useState("");
  const [draftGatewayTemplateKey, setDraftGatewayTemplateKey] = useState("custom");
  const [draftGatewayLogo, setDraftGatewayLogo] = useState("");
  const [draftGatewayLogoFile, setDraftGatewayLogoFile] = useState<File | null>(null);
  const [draftParameters, setDraftParameters] = useState<DraftParameterMap>(
    createDefaultDraftParameters(DEFAULT_GATEWAY_PARAMETER_LIBRARY),
  );
  const [paramToAddByGateway, setParamToAddByGateway] = useState<
    Record<string, string>
  >({});
  const [isPaymentLoading, setIsPaymentLoading] = useState(true);
  const [paymentLoadError, setPaymentLoadError] = useState<string | null>(null);
  const [isSubmittingGateway, setIsSubmittingGateway] = useState(false);
  const [savingGatewayId, setSavingGatewayId] = useState<string | null>(null);
  const [togglingGatewayId, setTogglingGatewayId] = useState<string | null>(null);
  const [uploadingGatewayLogoId, setUploadingGatewayLogoId] = useState<string | null>(null);
  const [defaultingGatewayId, setDefaultingGatewayId] = useState<string | null>(null);
  const [archivingGatewayId, setArchivingGatewayId] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<PlatformSettingsSection | null>(null);
  const [testMailTo, setTestMailTo] = useState("");
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const parameterLibrary = useMemo(
    () => parameterLibraryFromMeta(paymentMeta),
    [paymentMeta],
  );
  const gatewayTemplates = paymentMeta?.templates ?? [];
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const googleSocialLoginEndpoint = apiBaseUrl
    ? `${apiBaseUrl}/auth/social/google`
    : "";
  const defaultGoogleCallbackUrl = apiBaseUrl
    ? `${apiBaseUrl}/auth/social/google/callback`
    : "";
  const defaultFacebookCallbackUrl = apiBaseUrl
    ? `${apiBaseUrl}/auth/social/facebook/callback`
    : "";
  const defaultAppleCallbackUrl = apiBaseUrl
    ? `${apiBaseUrl}/auth/social/apple/callback`
    : "";
  const selectedCountryId = toCountryId(countryScope);

  useEffect(() => {
    let mounted = true;

    const loadCountries = async () => {
      try {
        setIsCountriesLoading(true);
        const items = await listAdminCountries();
        if (!mounted) return;
        setCountries(items);
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setIsCountriesLoading(false);
        }
      }
    };

    void loadCountries();

    return () => {
      mounted = false;
    };
  }, []);

  const loadPaymentGateways = useCallback(async (withSpinner = true) => {
    if (withSpinner) {
      setIsPaymentLoading(true);
    }

    try {
      const items = await listAdminPaymentGateways();
      setPaymentGateways(items.map(mapApiGatewayToUi));
      setPaymentLoadError(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setPaymentLoadError(message);
      toast.error(message);
    } finally {
      setIsPaymentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPaymentGateways();
  }, [loadPaymentGateways]);

  useEffect(() => {
    const loadPaymentMeta = async () => {
      try {
        const meta = await getAdminPaymentGatewayMeta();
        setPaymentMeta(meta);
        setDraftParameters(createDefaultDraftParameters(parameterLibraryFromMeta(meta)));
      } catch (error) {
        console.error(error);
      }
    };

    void loadPaymentMeta();
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydratePlatformSettings = async () => {
      const result = await listPlatformSettingsDraft({
        countryId: selectedCountryId,
      });
      if (!mounted) return;

      const sections = result.items;

      setForm((prev) => ({
        ...prev,
        ...(sections["sms-module"] as Partial<FormState> | undefined),
        ...(sections["mail-config"] as Partial<FormState> | undefined),
        ...(sections["map-apis"] as Partial<FormState> | undefined),
        ...(sections["social-logins"] as Partial<FormState> | undefined),
        ...(sections["firebase-otp"] as Partial<FormState> | undefined),
        ...(sections["recaptcha"] as Partial<FormState> | undefined),
        ...(sections["storage-connection"] as Partial<FormState> | undefined),
        socialGoogleCallbackUrl:
          String(
            (sections["social-logins"] as Partial<FormState> | undefined)
              ?.socialGoogleCallbackUrl ?? "",
          ) || defaultGoogleCallbackUrl,
        socialFacebookCallbackUrl:
          String(
            (sections["social-logins"] as Partial<FormState> | undefined)
              ?.socialFacebookCallbackUrl ?? "",
          ) || defaultFacebookCallbackUrl,
        socialAppleCallbackUrl:
          String(
            (sections["social-logins"] as Partial<FormState> | undefined)
              ?.socialAppleCallbackUrl ?? "",
          ) || defaultAppleCallbackUrl,
      }));
    };

    void hydratePlatformSettings();

    return () => {
      mounted = false;
    };
  }, [
    defaultAppleCallbackUrl,
    defaultFacebookCallbackUrl,
    defaultGoogleCallbackUrl,
    selectedCountryId,
  ]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveSection = async (
    section: PlatformSettingsSection,
    label: string,
    payload: Partial<FormState>,
  ) => {
    setSavingSection(section);
    try {
      const result = await savePlatformSettingsDraft(
        section,
        payload as Record<string, unknown>,
        {
          countryId: selectedCountryId,
        },
      );
      toast.success(
        result.source === "server"
          ? `${label} saved`
          : `${label} saved as draft (backend endpoint pending)`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingSection(null);
    }
  };

  const handleSendTestMail = async () => {
    if (!testMailTo.trim()) {
      toast.error("Enter a recipient email for the test");
      return;
    }

    try {
      setSendingTestMail(true);
      await sendPlatformTestMail(testMailTo.trim(), {
        mailEnabled: form.mailEnabled,
        mailerName: form.mailerName,
        mailHost: form.mailHost,
        mailDriver: form.mailDriver,
        mailPort: form.mailPort,
        mailUsername: form.mailUsername,
        mailEmailId: form.mailEmailId,
        mailEncryption: form.mailEncryption,
        mailPassword: form.mailPassword,
      });
      toast.success("Test email sent successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSendingTestMail(false);
    }
  };

  const resetGatewayDraft = () => {
    setDraftGatewayName("");
    setDraftGatewayBrand("");
    setDraftGatewayTemplateKey(gatewayTemplates[0]?.key ?? "custom");
    setDraftGatewayLogo("");
    setDraftGatewayLogoFile(null);
    setDraftParameters(createDefaultDraftParameters(parameterLibrary));
  };

  const openGatewayDrawer = () => {
    resetGatewayDraft();
    setIsGatewayDrawerOpen(true);
  };

  const handleCountryScopeChange = (scope: string) => {
    setCountryScope(scope);
    writeAdminCountryScope(scope);
  };

  const setGatewayMode = (gatewayId: string, mode: GatewayMode) => {
    setPaymentGateways((prev) =>
      prev.map((gateway) =>
        gateway.id === gatewayId ? { ...gateway, mode } : gateway,
      ),
    );
  };

  const setGatewayBrand = (gatewayId: string, brandText: string) => {
    setPaymentGateways((prev) =>
      prev.map((gateway) =>
        gateway.id === gatewayId ? { ...gateway, brandText } : gateway,
      ),
    );
  };

  const setGatewayLogo = (gatewayId: string, logoUrl: string) => {
    setPaymentGateways((prev) =>
      prev.map((gateway) =>
        gateway.id === gatewayId ? { ...gateway, logoUrl } : gateway,
      ),
    );
  };

  const setGatewayFieldValue = (
    gatewayId: string,
    fieldId: string,
    value: string,
  ) => {
    setPaymentGateways((prev) =>
      prev.map((gateway) => {
        if (gateway.id !== gatewayId) return gateway;
        return {
          ...gateway,
          fields: gateway.fields.map((field) =>
            field.id === fieldId ? { ...field, value } : field,
          ),
        };
      }),
    );
  };

  const setGatewayFieldRequired = (
    gatewayId: string,
    fieldId: string,
    required: boolean,
  ) => {
    setPaymentGateways((prev) =>
      prev.map((gateway) => {
        if (gateway.id !== gatewayId) return gateway;
        return {
          ...gateway,
          fields: gateway.fields.map((field) =>
            field.id === fieldId ? { ...field, required } : field,
          ),
        };
      }),
    );
  };

  const addGatewayField = (gatewayId: string, parameterId: string) => {
    setPaymentGateways((prev) =>
      prev.map((gateway) => {
        if (gateway.id !== gatewayId) return gateway;
        if (gateway.fields.some((existing) => existing.id === parameterId)) {
          return gateway;
        }

        const field = buildGatewayField(
          parameterLibrary,
          parameterId,
          true,
          gateway.fields.length + 1,
        );
        if (!field) return gateway;

        return {
          ...gateway,
          fields: [...gateway.fields, field],
        };
      }),
    );
  };

  const removeGatewayField = (gatewayId: string, fieldId: string) => {
    setPaymentGateways((prev) =>
      prev.map((gateway) => {
        if (gateway.id !== gatewayId) return gateway;
        const nextFields = gateway.fields
          .filter((field) => field.id !== fieldId)
          .map((field, index) => ({ ...field, sortOrder: index + 1 }));

        return {
          ...gateway,
          fields: nextFields,
        };
      }),
    );
  };

  const setGatewayEnabled = async (gatewayId: string, enabled: boolean) => {
    setTogglingGatewayId(gatewayId);
    try {
      const updated = await setAdminPaymentGatewayEnabled(gatewayId, enabled);
      const mapped = mapApiGatewayToUi(updated);
      setPaymentGateways((prev) =>
        prev.map((gateway) => (gateway.id === gatewayId ? mapped : gateway)),
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTogglingGatewayId(null);
    }
  };

  const removeGateway = async (gatewayId: string) => {
    setArchivingGatewayId(gatewayId);
    try {
      await archiveAdminPaymentGateway(gatewayId);
      setPaymentGateways((prev) =>
        prev.filter((gateway) => gateway.id !== gatewayId),
      );
      toast.success("Gateway archived");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setArchivingGatewayId(null);
    }
  };

  const setGatewayAsDefault = async (gatewayId: string) => {
    setDefaultingGatewayId(gatewayId);
    try {
      await setAdminDefaultPaymentGateway(gatewayId);
      await loadPaymentGateways(false);
      toast.success("Default gateway updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDefaultingGatewayId(null);
    }
  };

  const clearGatewayLogo = async (gatewayId: string) => {
    setUploadingGatewayLogoId(gatewayId);
    try {
      await updateAdminPaymentGateway(gatewayId, { logoUrl: null });
      setGatewayLogo(gatewayId, "");
      toast.success("Logo removed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingGatewayLogoId(null);
    }
  };

  const handleDraftLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      const dataUrl = await toDataUrl(file);
      setDraftGatewayLogo(dataUrl);
      setDraftGatewayLogoFile(file);
    } catch {
      toast.error("Could not read selected image");
    }
  };

  const handleGatewayLogoUpload = async (
    gatewayId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingGatewayLogoId(gatewayId);
    try {
      const result = await uploadAdminPaymentGatewayLogo(gatewayId, file);
      setGatewayLogo(gatewayId, result.logoUrl);
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingGatewayLogoId(null);
    }
  };

  const toggleDraftParameterInclude = (id: string, include: boolean) => {
    setDraftParameters((prev) => ({
      ...prev,
      [id]: {
        include,
        required: include ? (prev[id]?.required ?? false) : false,
      },
    }));
  };

  const toggleDraftParameterRequired = (id: string, required: boolean) => {
    setDraftParameters((prev) => ({
      ...prev,
      [id]: {
        include: prev[id]?.include ?? false,
        required,
      },
    }));
  };

  const addGateway = async () => {
    const name = draftGatewayName.trim();
    if (!name) {
      toast.error("Gateway name is required");
      return;
    }

    const gatewayKey = slugifyGatewayKey(name);
    if (!gatewayKey || gatewayKey.length < 2) {
      toast.error("Gateway name is invalid");
      return;
    }

    const selectedTemplate =
      gatewayTemplates.find((template) => template.key === draftGatewayTemplateKey) ?? null;
    const selectedFields = selectedTemplate
      ? selectedTemplate.fields.map((field, index) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          isSecret: field.isSecret,
          sortOrder: field.sortOrder ?? index + 1,
          placeholder: field.placeholder ?? undefined,
          helpText: field.helpText ?? undefined,
          defaultValue: field.defaultValue ?? undefined,
          validationRegex: field.validationRegex ?? undefined,
          options: field.options ?? undefined,
        }))
      : parameterLibrary
          .filter((item) => draftParameters[item.id]?.include)
          .map((item, index) => ({
            key: item.id,
            label: item.label,
            type: item.type,
            isRequired: Boolean(draftParameters[item.id]?.required),
            isSecret: Boolean(item.secret),
            sortOrder: index + 1,
            defaultValue: item.defaultValue,
          }));

    if (!selectedFields.length) {
      toast.error(
        selectedTemplate
          ? "Selected template has no fields configured"
          : "Select at least one parameter",
      );
      return;
    }

    setIsSubmittingGateway(true);
    try {
      await createAdminPaymentGateway({
        key: gatewayKey,
        displayName: draftGatewayBrand.trim() || name,
        runtimeAdapter: selectedTemplate?.runtimeAdapter ?? "CUSTOM",
        mode: selectedTemplate?.mode ?? "TEST",
        isEnabled: false,
        isDefault: false,
        merchantDisplayName: selectedTemplate?.merchantDisplayName ?? undefined,
        supportedCurrencies: selectedTemplate?.supportedCurrencies ?? ["ngn"],
        fields: selectedFields,
      });

      if (draftGatewayLogoFile) {
        await uploadAdminPaymentGatewayLogo(gatewayKey, draftGatewayLogoFile);
      }

      await loadPaymentGateways(false);
      setIsGatewayDrawerOpen(false);
      resetGatewayDraft();
      toast.success(`${name} added`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmittingGateway(false);
    }
  };

  const saveGateway = async (gatewayId: string) => {
    const gateway = paymentGateways.find((item) => item.id === gatewayId);
    if (!gateway) return;

    const displayName = gateway.brandText.trim() || gateway.name;

    const fieldsPayload = gateway.fields.map((field, index) => ({
      key: field.id,
      label: field.label,
      type: field.type,
      isRequired: field.required,
      isSecret: Boolean(field.secret),
      sortOrder: index + 1,
      placeholder: field.placeholder ?? undefined,
      helpText: field.helpText ?? undefined,
      defaultValue: field.defaultValue ?? undefined,
      validationRegex: field.validationRegex ?? undefined,
      options: field.options ?? undefined,
    }));

    const valuesPayload = gateway.fields.map((field) => ({
      fieldKey: field.id,
      value: field.value.trim(),
    }));

    setSavingGatewayId(gatewayId);
    try {
      await updateAdminPaymentGateway(gatewayId, {
        displayName,
        mode: toApiMode(gateway.mode),
      });

      await replaceAdminPaymentGatewayFields(gatewayId, {
        fields: fieldsPayload,
      });

      const updated = await replaceAdminPaymentGatewayValues(gatewayId, {
        values: valuesPayload,
      });

      const mapped = mapApiGatewayToUi(updated);
      const inputByFieldId = new Map(
        gateway.fields.map((field) => [field.id, field.value]),
      );

      setPaymentGateways((prev) =>
        prev.map((item) => {
          if (item.id !== gatewayId) return item;

          return {
            ...mapped,
            fields: mapped.fields.map((field) => {
              const inputValue = inputByFieldId.get(field.id) ?? "";
              return {
                ...field,
                value: inputValue,
                hasStoredValue:
                  Boolean(inputValue.trim()) || Boolean(field.hasStoredValue),
              };
            }),
          };
        }),
      );

      toast.success(`${displayName} saved`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingGatewayId(null);
    }
  };

  const renderPaymentMethods = () => {
    return (
      <div style={styles.stack12}>
        <div style={styles.paymentMethodsHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Configured Gateways</h3>
            <p style={styles.sectionSubtext}>
              Manage fields, logos, and required parameters.
            </p>
          </div>
          <div style={styles.paymentMethodsHeaderActions}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => void loadPaymentGateways()}
              disabled={isPaymentLoading}
            >
              {isPaymentLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={openGatewayDrawer}
            >
              + Add Gateway
            </button>
          </div>
        </div>

        {isPaymentLoading ? (
          <div style={styles.infoPanel}>Loading payment gateways...</div>
        ) : paymentLoadError ? (
          <div style={styles.errorPanel}>
            <div>
              <strong>Could not load gateways.</strong>
              <p style={styles.errorText}>{paymentLoadError}</p>
            </div>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => void loadPaymentGateways()}
            >
              Retry
            </button>
          </div>
        ) : paymentGateways.length === 0 ? (
          <div style={styles.infoPanel}>No gateways yet. Click Add Gateway to create one.</div>
        ) : (
          <div style={styles.grid2Large}>
            {paymentGateways.map((gateway) => {
              const availableParams = parameterLibrary.filter(
                (item) => !gateway.fields.some((field) => field.id === item.id),
              );
              const pendingParam =
                paramToAddByGateway[gateway.id] ?? availableParams[0]?.id ?? "";

              const isSaving = savingGatewayId === gateway.id;
              const isToggling = togglingGatewayId === gateway.id;
              const isUploadingLogo = uploadingGatewayLogoId === gateway.id;
              const isSettingDefault = defaultingGatewayId === gateway.id;
              const isArchiving = archivingGatewayId === gateway.id;
              const isBusy =
                isSaving ||
                isToggling ||
                isUploadingLogo ||
                isSettingDefault ||
                isArchiving;

              return (
                <ProviderCard
                  key={gateway.id}
                  title={gateway.name}
                  enabled={gateway.enabled}
                  onToggle={(value) => void setGatewayEnabled(gateway.id, value)}
                  onDelete={() => void removeGateway(gateway.id)}
                  busy={isBusy}
                >
                  <div style={styles.gatewayStatusRow}>
                    <span
                      style={{
                        ...styles.gatewayStatusBadge,
                        ...(gateway.isDefault ? styles.gatewayStatusDefault : null),
                      }}
                    >
                      {gateway.isDefault ? "Default" : "Secondary"}
                    </span>
                    <span
                      style={{
                        ...styles.gatewayStatusBadge,
                        ...(gateway.isRuntimeSupported
                          ? styles.gatewayStatusSuccess
                          : styles.gatewayStatusWarn),
                      }}
                    >
                      {gateway.isRuntimeSupported ? "Runtime Ready" : "Custom Runtime"}
                    </span>
                    <span
                      style={{
                        ...styles.gatewayStatusBadge,
                        ...(gateway.isReadyForCheckout
                          ? styles.gatewayStatusSuccess
                          : styles.gatewayStatusWarn),
                      }}
                    >
                      {gateway.isReadyForCheckout
                        ? "Checkout Ready"
                        : "Missing Required Values"}
                    </span>
                  </div>

                  {!gateway.isReadyForCheckout && gateway.readinessIssues.length ? (
                    <div style={styles.readinessList}>
                      {gateway.readinessIssues.map((issue) => (
                        <span key={`${gateway.id}:${issue}`} style={styles.readinessItem}>
                          {formatReadinessIssue(issue)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div style={styles.brandArea}>
                    {gateway.logoUrl ? (
                      <img
                        src={gateway.logoUrl}
                        alt={`${gateway.name} logo`}
                        style={styles.brandImage}
                      />
                    ) : (
                      <span style={styles.brandText}>
                        {gateway.brandText || gateway.name}
                      </span>
                    )}
                  </div>

                  <div style={styles.grid2Compact}>
                    <Field label="Display Text">
                      <input
                        style={styles.input}
                        value={gateway.brandText}
                        onChange={(event) =>
                          setGatewayBrand(gateway.id, event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Mode">
                      <select
                        style={styles.input}
                        value={gateway.mode}
                        onChange={(event) =>
                          setGatewayMode(
                            gateway.id,
                            event.target.value as GatewayMode,
                          )
                        }
                      >
                        <option value="Live">Live</option>
                        <option value="Test">Test</option>
                      </select>
                    </Field>
                  </div>

                  <div style={styles.logoControls}>
                    <label
                      style={{
                        ...styles.uploadBtnCompact,
                        ...(isBusy ? styles.btnDisabled : null),
                      }}
                    >
                      {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        style={styles.fileInput}
                        disabled={isBusy}
                        onChange={(event) =>
                          void handleGatewayLogoUpload(gateway.id, event)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      style={styles.secondaryBtnCompact}
                      onClick={() => void clearGatewayLogo(gateway.id)}
                      disabled={!gateway.logoUrl || isBusy}
                    >
                      Remove Logo
                    </button>
                    <button
                      type="button"
                      style={styles.secondaryBtnCompact}
                      onClick={() => void setGatewayAsDefault(gateway.id)}
                      disabled={gateway.isDefault || isBusy}
                    >
                      {isSettingDefault
                        ? "Setting..."
                        : gateway.isDefault
                          ? "Default"
                          : "Set Default"}
                    </button>
                    <button
                      type="button"
                      style={styles.primaryBtn}
                      onClick={() => void saveGateway(gateway.id)}
                      disabled={isBusy}
                    >
                      {isSaving ? "Saving..." : "Save Gateway"}
                    </button>
                  </div>

                  <div style={styles.parameterEditorCard}>
                    <div style={styles.parameterEditorHeader}>
                      <h5 style={styles.parameterEditorTitle}>Parameter Controls</h5>
                      <span style={styles.parameterCount}>
                        {gateway.fields.length} fields
                      </span>
                    </div>

                    <div style={styles.parameterAddRow}>
                      <select
                        style={styles.input}
                        value={pendingParam}
                        onChange={(event) =>
                          setParamToAddByGateway((prev) => ({
                            ...prev,
                            [gateway.id]: event.target.value,
                          }))
                        }
                        disabled={availableParams.length === 0 || isBusy}
                      >
                        {availableParams.length === 0 ? (
                          <option value="">No more parameters to add</option>
                        ) : (
                          availableParams.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        style={styles.secondaryBtnCompact}
                        disabled={
                          availableParams.length === 0 || !pendingParam || isBusy
                        }
                        onClick={() => addGatewayField(gateway.id, pendingParam)}
                      >
                        Add Parameter
                      </button>
                    </div>

                    <div style={styles.parameterList}>
                      {gateway.fields.map((field) => (
                        <div key={field.id} style={styles.parameterItem}>
                          <span style={styles.parameterLabel}>
                            {field.label}
                            {field.secret ? (
                              <small style={styles.secretTag}>Secret</small>
                            ) : null}
                          </span>
                          <label style={styles.parameterRequiredToggle}>
                            <input
                              type="checkbox"
                              checked={Boolean(field.required)}
                              disabled={isBusy}
                              style={styles.accentControl}
                              onChange={(event) =>
                                setGatewayFieldRequired(
                                  gateway.id,
                                  field.id,
                                  event.target.checked,
                                )
                              }
                            />
                            Required
                          </label>
                          <button
                            type="button"
                            style={styles.removeParamBtn}
                            disabled={isBusy}
                            onClick={() => removeGatewayField(gateway.id, field.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {gateway.fields.map((field) => (
                    <Field key={field.id} label={`${field.label}${field.required ? " *" : ""}`}>
                      <input
                        style={styles.input}
                        type="text"
                        value={field.value}
                        placeholder={
                          field.hasStoredValue && !field.value
                            ? "Value saved on server"
                            : undefined
                        }
                        onChange={(event) =>
                          setGatewayFieldValue(
                            gateway.id,
                            field.id,
                            event.target.value,
                          )
                        }
                      />
                    </Field>
                  ))}
                </ProviderCard>
              );
            })}
          </div>
        )}

        <button
          type="button"
          style={styles.gatewayBuilderTab}
          onClick={openGatewayDrawer}
          aria-label="Open Add Gateway drawer"
        >
          <span style={styles.gatewayBuilderTabIcon}>＋</span>
          <span style={styles.gatewayBuilderTabText}>Add Gateway</span>
        </button>

        <div
          style={{
            ...styles.gatewayDrawerOverlay,
            opacity: isGatewayDrawerOpen ? 1 : 0,
            pointerEvents: isGatewayDrawerOpen ? "auto" : "none",
          }}
          onClick={() => setIsGatewayDrawerOpen(false)}
        >
          <aside
            style={{
              ...styles.gatewayDrawer,
              transform: isGatewayDrawerOpen
                ? "translateX(0)"
                : "translateX(100%)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.gatewayDrawerHeader}>
              <h3 style={styles.gatewayDrawerTitle}>Create Payment Gateway</h3>
              <button
                type="button"
                style={styles.gatewayDrawerCloseBtn}
                onClick={() => setIsGatewayDrawerOpen(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.drawerBlock}>
              <Field label="Gateway Name *">
                <input
                  style={styles.input}
                  value={draftGatewayName}
                  onChange={(event) => setDraftGatewayName(event.target.value)}
                  placeholder="e.g. Flutterwave"
                />
              </Field>
              <Field label="Display Text">
                <input
                  style={styles.input}
                  value={draftGatewayBrand}
                  onChange={(event) => setDraftGatewayBrand(event.target.value)}
                  placeholder="Optional text shown when logo is absent"
                />
              </Field>
              <Field label="Gateway Template">
                <select
                  style={styles.input}
                  value={draftGatewayTemplateKey}
                  onChange={(event) => setDraftGatewayTemplateKey(event.target.value)}
                  disabled={isSubmittingGateway}
                >
                  {gatewayTemplates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.displayName} Template
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </Field>

              <div style={styles.drawerLogoCard}>
                <div style={styles.drawerLogoPreview}>
                  {draftGatewayLogo ? (
                    <img
                      src={draftGatewayLogo}
                      alt="Gateway preview"
                      style={styles.brandImage}
                    />
                  ) : (
                    <span style={styles.brandText}>
                      {draftGatewayBrand ||
                        draftGatewayName ||
                        "Gateway Logo Preview"}
                    </span>
                  )}
                </div>
                <div style={styles.logoControls}>
                  <label
                    style={{
                      ...styles.uploadBtnCompact,
                      ...(isSubmittingGateway ? styles.btnDisabled : null),
                    }}
                  >
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      style={styles.fileInput}
                      disabled={isSubmittingGateway}
                      onChange={(event) => void handleDraftLogoUpload(event)}
                    />
                  </label>
                  <button
                    type="button"
                    style={styles.secondaryBtnCompact}
                    onClick={() => {
                      setDraftGatewayLogo("");
                      setDraftGatewayLogoFile(null);
                    }}
                    disabled={isSubmittingGateway}
                  >
                    Remove Logo
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.drawerBlock}>
              <h4 style={styles.drawerBlockTitle}>Select Gateway Parameters</h4>
              <p style={styles.drawerHint}>
                {draftGatewayTemplateKey === "custom"
                  ? "Pick the fields you want in this gateway and mark which ones are required."
                  : "Template gateways come with preconfigured required fields from the backend."}
              </p>

              <div style={styles.drawerParameterList}>
                {(draftGatewayTemplateKey === "custom"
                  ? parameterLibrary
                  : gatewayTemplates.find((template) => template.key === draftGatewayTemplateKey)
                      ?.fields.map((field) => ({
                        id: field.key,
                        label: field.label,
                        type: field.type,
                        required: field.isRequired,
                        secret: field.isSecret,
                        defaultValue: field.defaultValue ?? undefined,
                      })) ?? []).map((item) => {
                  const state = draftParameters[item.id] ?? {
                    include: false,
                    required: false,
                  };

                  return (
                    <div key={item.id} style={styles.drawerParameterRow}>
                      <label style={styles.drawerCheckLabel}>
                        <input
                          type="checkbox"
                          checked={
                            draftGatewayTemplateKey === "custom" ? state.include : true
                          }
                          style={styles.accentControl}
                          disabled={isSubmittingGateway || draftGatewayTemplateKey !== "custom"}
                          onChange={(event) =>
                            toggleDraftParameterInclude(
                              item.id,
                              event.target.checked,
                            )
                          }
                        />
                        <span>{item.label}</span>
                        {item.secret ? (
                          <small style={styles.secretTag}>Secret</small>
                        ) : null}
                      </label>

                      <label style={styles.drawerCheckLabelMuted}>
                        <input
                          type="checkbox"
                          checked={
                            draftGatewayTemplateKey === "custom"
                              ? state.required
                              : Boolean(item.required)
                          }
                          style={styles.accentControl}
                          disabled={
                            draftGatewayTemplateKey !== "custom" ||
                            !state.include ||
                            isSubmittingGateway
                          }
                          onChange={(event) =>
                            toggleDraftParameterRequired(
                              item.id,
                              event.target.checked,
                            )
                          }
                        />
                        Required
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={styles.actionsInlineEnd}>
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={resetGatewayDraft}
                disabled={isSubmittingGateway}
              >
                Reset
              </button>
              <button
                type="button"
                style={styles.primaryBtn}
                onClick={() => void addGateway()}
                disabled={isSubmittingGateway}
              >
                {isSubmittingGateway ? "Creating..." : "Create Gateway"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  };

  const renderSmsModule = () => {
    return (
      <div style={styles.grid2Large}>
        <article style={styles.providerCard}>
          <header style={styles.providerCardHeader}>
            <h4 style={styles.providerCardTitle}>Twilio</h4>
          </header>
          <div style={styles.providerCardBody}>
            <div style={styles.radioInline}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="twilioState"
                  checked={form.twilioActive}
                  style={styles.accentControl}
                  onChange={() => set("twilioActive", true)}
                />
                Active
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="twilioState"
                  checked={!form.twilioActive}
                  style={styles.accentControl}
                  onChange={() => set("twilioActive", false)}
                />
                Inactive
              </label>
            </div>

            <Field label="Sid *">
              <input
                style={styles.input}
                value={form.twilioSid}
                onChange={(event) => set("twilioSid", event.target.value)}
              />
            </Field>
            <Field label="Messaging Service Sid *">
              <input
                style={styles.input}
                value={form.twilioMessagingSid}
                onChange={(event) =>
                  set("twilioMessagingSid", event.target.value)
                }
              />
            </Field>
            <Field label="Token *">
              <input
                style={styles.input}
                value={form.twilioToken}
                onChange={(event) => set("twilioToken", event.target.value)}
              />
            </Field>
            <Field label="From *">
              <input
                style={styles.input}
                value={form.twilioFrom}
                onChange={(event) => set("twilioFrom", event.target.value)}
              />
            </Field>
            <Field label="Otp Template *">
              <input
                style={styles.input}
                value={form.twilioOtpTemplate}
                onChange={(event) =>
                  set("twilioOtpTemplate", event.target.value)
                }
              />
            </Field>
          </div>
        </article>

        <article style={styles.providerCard}>
          <header style={styles.providerCardHeader}>
            <h4 style={styles.providerCardTitle}>2factor</h4>
          </header>
          <div style={styles.providerCardBody}>
            <div style={styles.radioInline}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="twofactorState"
                  checked={form.twoFactorActive}
                  style={styles.accentControl}
                  onChange={() => set("twoFactorActive", true)}
                />
                Active
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="twofactorState"
                  checked={!form.twoFactorActive}
                  style={styles.accentControl}
                  onChange={() => set("twoFactorActive", false)}
                />
                Inactive
              </label>
            </div>

            <Field label="Api Key *">
              <input
                style={styles.input}
                value={form.twoFactorApiKey}
                onChange={(event) => set("twoFactorApiKey", event.target.value)}
              />
            </Field>

            <div style={styles.actionsInline}>
              <button
                type="button"
                style={styles.primaryBtn}
                onClick={() =>
                  void saveSection("sms-module", "SMS Module", {
                    twilioActive: form.twilioActive,
                    twilioSid: form.twilioSid,
                    twilioMessagingSid: form.twilioMessagingSid,
                    twilioToken: form.twilioToken,
                    twilioFrom: form.twilioFrom,
                    twilioOtpTemplate: form.twilioOtpTemplate,
                    twoFactorActive: form.twoFactorActive,
                    twoFactorApiKey: form.twoFactorApiKey,
                  })
                }
                disabled={savingSection === "sms-module"}
              >
                {savingSection === "sms-module" ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </article>
      </div>
    );
  };

  const renderMailConfig = () => {
    return (
      <article style={styles.mailCard}>
        <header style={styles.mailTabsHeader}>
          <div style={styles.mailTabsLeft}>
            <button
              type="button"
              onClick={() => setMailInnerTab("config")}
              style={{
                ...styles.mailInnerTab,
                ...(mailInnerTab === "config" ? styles.mailInnerTabActive : {}),
              }}
            >
              <MailCheck size={16} />
              Mail Config
            </button>
            <button
              type="button"
              onClick={() => setMailInnerTab("test")}
              style={{
                ...styles.mailInnerTab,
                ...(mailInnerTab === "test" ? styles.mailInnerTabActive : {}),
              }}
            >
              <MessageSquareText size={16} />
              Send Test Mail
            </button>
          </div>
          <button type="button" style={styles.linkBtn}>
            How it Works
          </button>
        </header>

        <div style={styles.mailBody}>
          {mailInnerTab === "config" ? (
            <>
          <label style={styles.switchLine}>
            <span>{form.mailEnabled ? "Turn OFF" : "Turn ON"}</span>
            <input
              type="checkbox"
              checked={form.mailEnabled}
              style={styles.accentControl}
              onChange={(event) => set("mailEnabled", event.target.checked)}
            />
          </label>
          <p style={styles.helperText}>
            *By turning OFF mail configuration all your mailing services will be
            off.
          </p>

          {/* PROVIDER SELECTOR */}
          <p style={{ ...styles.helperText, fontWeight: 700, color: "var(--foreground)", marginBottom: 2 }}>
            Select Email Provider
          </p>
          <div style={styles.mailProviderGrid}>
            {(
              [
                {
                  id: "mailgun",
                  name: "Mailgun",
                  subtitle: "smtp.mailgun.org · Port 587",
                  color: "#E53935",
                  preset: {
                    mailHost: "smtp.mailgun.org",
                    mailPort: "587",
                    mailUsername: "",
                    mailEncryption: "tls",
                    mailDriver: "smtp",
                  },
                },
                {
                  id: "sendgrid",
                  name: "SendGrid",
                  subtitle: "smtp.sendgrid.net · Port 587",
                  color: "#1A82E2",
                  preset: {
                    mailHost: "smtp.sendgrid.net",
                    mailPort: "587",
                    mailUsername: "apikey",
                    mailEncryption: "tls",
                    mailDriver: "smtp",
                  },
                },
                {
                  id: "custom",
                  name: "Custom SMTP",
                  subtitle: "Enter your own SMTP settings",
                  color: "#6B7280",
                  preset: null,
                },
              ] as const
            ).map((provider) => {
              const active = form.mailProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      mailProvider: provider.id,
                      ...(provider.preset ?? {}),
                    }));
                  }}
                  style={{
                    ...styles.mailProviderTile,
                    ...(active ? styles.mailProviderTileActive : {}),
                    borderColor: active ? provider.color : undefined,
                  }}
                >
                  <span
                    style={{
                      ...styles.mailProviderDot,
                      background: provider.color,
                    }}
                  />
                  <span style={styles.mailProviderInfo}>
                    <span style={{ ...styles.mailProviderName, ...(active ? { color: provider.color } : {}) }}>
                      {provider.name}
                    </span>
                    <span style={styles.mailProviderSub}>{provider.subtitle}</span>
                  </span>
                  {active && (
                    <span style={{ ...styles.mailProviderCheck, background: provider.color }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <Field label="Mailer name">
            <input
              style={styles.input}
              value={form.mailerName}
              onChange={(event) => set("mailerName", event.target.value)}
            />
          </Field>

          <div style={styles.grid3}>
            <Field label="Host">
              <input
                style={styles.input}
                value={form.mailHost}
                onChange={(event) => set("mailHost", event.target.value)}
              />
            </Field>
            <Field label="Driver">
              <input
                style={styles.input}
                value={form.mailDriver}
                onChange={(event) => set("mailDriver", event.target.value)}
              />
            </Field>
            <Field label="Port">
              <input
                style={styles.input}
                value={form.mailPort}
                onChange={(event) => set("mailPort", event.target.value)}
              />
            </Field>
          </div>

          <Field label={form.mailProvider === "sendgrid" ? 'Username (always "apikey" for SendGrid)' : "Username"}>
            <input
              style={styles.input}
              value={form.mailUsername}
              onChange={(event) => set("mailUsername", event.target.value)}
            />
          </Field>

          <div style={styles.grid3}>
            <Field label="From Email">
              <input
                style={styles.input}
                value={form.mailEmailId}
                onChange={(event) => set("mailEmailId", event.target.value)}
              />
            </Field>
            <Field label="Encryption">
              <input
                style={styles.input}
                value={form.mailEncryption}
                onChange={(event) => set("mailEncryption", event.target.value)}
              />
            </Field>
            <Field label={form.mailProvider === "sendgrid" ? "API Key (Password)" : "Password"}>
              <input
                style={styles.input}
                type="password"
                value={form.mailPassword}
                onChange={(event) => set("mailPassword", event.target.value)}
              />
            </Field>
          </div>

          <div style={styles.actionsInlineEnd}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  mailEnabled: INITIAL_STATE.mailEnabled,
                  mailProvider: INITIAL_STATE.mailProvider,
                  mailerName: INITIAL_STATE.mailerName,
                  mailHost: INITIAL_STATE.mailHost,
                  mailDriver: INITIAL_STATE.mailDriver,
                  mailPort: INITIAL_STATE.mailPort,
                  mailUsername: INITIAL_STATE.mailUsername,
                  mailEmailId: INITIAL_STATE.mailEmailId,
                  mailEncryption: INITIAL_STATE.mailEncryption,
                  mailPassword: INITIAL_STATE.mailPassword,
                }))
              }
            >
              Reset
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() =>
                void saveSection("mail-config", "Mail Config", {
                  mailEnabled: form.mailEnabled,
                  mailProvider: form.mailProvider,
                  mailerName: form.mailerName,
                  mailHost: form.mailHost,
                  mailDriver: form.mailDriver,
                  mailPort: form.mailPort,
                  mailUsername: form.mailUsername,
                  mailEmailId: form.mailEmailId,
                  mailEncryption: form.mailEncryption,
                  mailPassword: form.mailPassword,
                })
              }
              disabled={savingSection === "mail-config"}
            >
              {savingSection === "mail-config" ? "Saving..." : "Save"}
            </button>
          </div>
            </>
          ) : (
            <div style={styles.simplePanel}>
              <h4 style={styles.simpleTitle}>Send Test Mail</h4>
              <p style={styles.simpleText}>
                This sends a real email using the SMTP values currently in the form,
                even if you have not saved them yet.
              </p>
              <Field label="Recipient Email">
                <input
                  style={styles.input}
                  type="email"
                  value={testMailTo}
                  onChange={(event) => setTestMailTo(event.target.value)}
                  placeholder="admin@example.com"
                />
              </Field>
              <div style={styles.actionsInlineEnd}>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={() => void handleSendTestMail()}
                  disabled={sendingTestMail}
                >
                  {sendingTestMail ? "Sending..." : "Send Test Email"}
                </button>
              </div>
            </div>
          )}
        </div>
      </article>
    );
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy text");
    }
  };

  const renderSocialLogins = () => {
    const socialCards = [
      {
        key: "google",
        label: "Google",
        enabled: form.socialGoogleEnabled,
        callbackUrl: form.socialGoogleCallbackUrl,
        clientId: form.socialGoogleClientId,
        clientSecret: form.socialGoogleClientSecret,
        referenceLabel: googleSocialLoginEndpoint ? "Login Endpoint" : "Callback URL",
        referenceValue: googleSocialLoginEndpoint || form.socialGoogleCallbackUrl,
        helperText:
          "Use the Google Client ID in your app and send the returned Google ID token to the backend login endpoint.",
        implementationStatus: "Live in backend",
      },
      {
        key: "facebook",
        label: "Facebook",
        enabled: form.socialFacebookEnabled,
        callbackUrl: form.socialFacebookCallbackUrl,
        clientId: form.socialFacebookClientId,
        clientSecret: form.socialFacebookClientSecret,
        referenceLabel: "Callback URL",
        referenceValue: form.socialFacebookCallbackUrl,
        helperText:
          "Credentials are saved here, but the backend Facebook login flow is not implemented yet.",
        implementationStatus: "Config only",
      },
      {
        key: "apple",
        label: "Apple",
        enabled: form.socialAppleEnabled,
        callbackUrl: form.socialAppleCallbackUrl,
        clientId: form.socialAppleClientId,
        clientSecret: form.socialAppleClientSecret,
        referenceLabel: "Callback URL",
        referenceValue: form.socialAppleCallbackUrl,
        helperText:
          "Credentials are saved here, but the backend Apple login flow is not implemented yet.",
        implementationStatus: "Config only",
      },
    ] as const;

    return (
      <div style={styles.stack12}>
        <div style={styles.integrationHeaderRow}>
          <h3 style={styles.sectionTitle}>Social Login Setup</h3>
          <p style={styles.sectionSubtext}>
            Configure provider credentials here. Google login is wired in the backend; Facebook and Apple are stored for rollout later.
          </p>
        </div>

        <div style={styles.grid2Large}>
          {socialCards.map((provider) => (
            <article key={provider.key} style={styles.integrationCard}>
              <header style={styles.integrationCardHeader}>
                <h4 style={styles.integrationCardTitle}>
                  {provider.label}
                  <span style={styles.requiredAsterisk}>*</span>
                </h4>
                <label style={styles.switchText}>
                  <input
                    type="checkbox"
                    checked={provider.enabled}
                    style={styles.accentControl}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      if (provider.key === "google") set("socialGoogleEnabled", checked);
                      if (provider.key === "facebook") set("socialFacebookEnabled", checked);
                      if (provider.key === "apple") set("socialAppleEnabled", checked);
                    }}
                  />
                </label>
              </header>

              <div style={styles.integrationCardBody}>
                <div style={styles.integrationHintRow}>
                  <span style={styles.sectionSubtext}>{provider.implementationStatus}</span>
                  <Info size={16} style={styles.mutedIcon} />
                </div>
                <p style={styles.helperText}>{provider.helperText}</p>

                {provider.referenceValue ? (
                  <Field label={provider.referenceLabel}>
                    <div style={styles.copyFieldWrap}>
                      <input
                        style={{ ...styles.input, ...styles.copyInput }}
                        value={provider.referenceValue}
                        readOnly
                      />
                      <button
                        type="button"
                        style={styles.copyBtn}
                        onClick={() => void copyText(provider.referenceValue)}
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </Field>
                ) : null}

                <Field label="Client ID">
                  <input
                    style={styles.input}
                    value={provider.clientId}
                    onChange={(event) => {
                      if (provider.key === "google") {
                        set("socialGoogleClientId", event.target.value);
                      }
                      if (provider.key === "facebook") {
                        set("socialFacebookClientId", event.target.value);
                      }
                      if (provider.key === "apple") {
                        set("socialAppleClientId", event.target.value);
                      }
                    }}
                  />
                </Field>

                <Field label="Client Secret">
                  <input
                    style={styles.input}
                    value={provider.clientSecret}
                    onChange={(event) => {
                      if (provider.key === "google") {
                        set("socialGoogleClientSecret", event.target.value);
                      }
                      if (provider.key === "facebook") {
                        set("socialFacebookClientSecret", event.target.value);
                      }
                      if (provider.key === "apple") {
                        set("socialAppleClientSecret", event.target.value);
                      }
                    }}
                  />
                </Field>

                <div style={styles.actionsInlineEnd}>
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    onClick={() => {
                      if (provider.key === "google") {
                        setForm((prev) => ({
                          ...prev,
                          socialGoogleEnabled: INITIAL_STATE.socialGoogleEnabled,
                          socialGoogleCallbackUrl: defaultGoogleCallbackUrl,
                          socialGoogleClientId: INITIAL_STATE.socialGoogleClientId,
                          socialGoogleClientSecret: INITIAL_STATE.socialGoogleClientSecret,
                        }));
                      }
                      if (provider.key === "facebook") {
                        setForm((prev) => ({
                          ...prev,
                          socialFacebookEnabled: INITIAL_STATE.socialFacebookEnabled,
                          socialFacebookCallbackUrl: defaultFacebookCallbackUrl,
                          socialFacebookClientId: INITIAL_STATE.socialFacebookClientId,
                          socialFacebookClientSecret: INITIAL_STATE.socialFacebookClientSecret,
                        }));
                      }
                      if (provider.key === "apple") {
                        setForm((prev) => ({
                          ...prev,
                          socialAppleEnabled: INITIAL_STATE.socialAppleEnabled,
                          socialAppleCallbackUrl: defaultAppleCallbackUrl,
                          socialAppleClientId: INITIAL_STATE.socialAppleClientId,
                          socialAppleClientSecret: INITIAL_STATE.socialAppleClientSecret,
                        }));
                      }
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    onClick={() =>
                      void saveSection("social-logins", "Social Logins", {
                        socialGoogleEnabled: form.socialGoogleEnabled,
                        socialGoogleCallbackUrl: form.socialGoogleCallbackUrl,
                        socialGoogleClientId: form.socialGoogleClientId,
                        socialGoogleClientSecret: form.socialGoogleClientSecret,
                        socialFacebookEnabled: form.socialFacebookEnabled,
                        socialFacebookCallbackUrl: form.socialFacebookCallbackUrl,
                        socialFacebookClientId: form.socialFacebookClientId,
                        socialFacebookClientSecret: form.socialFacebookClientSecret,
                        socialAppleEnabled: form.socialAppleEnabled,
                        socialAppleCallbackUrl: form.socialAppleCallbackUrl,
                        socialAppleClientId: form.socialAppleClientId,
                        socialAppleClientSecret: form.socialAppleClientSecret,
                      })
                    }
                    disabled={savingSection === "social-logins"}
                  >
                    {savingSection === "social-logins" ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  };

  const renderRecaptcha = () => {
    return (
      <article style={styles.integrationCard}>
        <header style={styles.integrationCardHeaderLarge}>
          <h3 style={styles.sectionTitle}>Google Recaptcha Information</h3>
          <button type="button" style={styles.credentialInfoBtn}>
            Credential Setup Information
          </button>
        </header>

        <div style={styles.integrationCardBodyLarge}>
          <p style={styles.helperText}>
            When enabled, the backend expects a `recaptchaToken` on public auth actions. Client apps should read the site key from `/platform/client-config`.
          </p>
          <div style={styles.noticeBanner}>
            <div>
              <strong style={styles.noticeTitle}>V3 Version is available now. Must setup for ReCAPTCHA V3</strong>
              <p style={styles.noticeText}>
                You must setup for V3 version. Otherwise the default reCAPTCHA will be displayed automatically.
              </p>
            </div>
          </div>

          <label style={styles.switchLine}>
            <span>{`ReCAPTCHA Status ${form.recaptchaEnabled ? "Turn OFF" : "Turn ON"}`}</span>
            <input
              type="checkbox"
              checked={form.recaptchaEnabled}
              style={styles.accentControl}
              onChange={(event) => set("recaptchaEnabled", event.target.checked)}
            />
          </label>

          <div style={styles.grid2Compact}>
            <Field label="Site Key">
              <input
                style={styles.input}
                value={form.recaptchaSiteKey}
                onChange={(event) => set("recaptchaSiteKey", event.target.value)}
              />
            </Field>
            <Field label="Secret Key">
              <input
                style={styles.input}
                value={form.recaptchaSecretKey}
                onChange={(event) => set("recaptchaSecretKey", event.target.value)}
              />
            </Field>
          </div>

          <div style={styles.actionsInlineEnd}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  recaptchaEnabled: INITIAL_STATE.recaptchaEnabled,
                  recaptchaSiteKey: INITIAL_STATE.recaptchaSiteKey,
                  recaptchaSecretKey: INITIAL_STATE.recaptchaSecretKey,
                }))
              }
            >
              Reset
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() =>
                void saveSection("recaptcha", "Recaptcha", {
                  recaptchaEnabled: form.recaptchaEnabled,
                  recaptchaSiteKey: form.recaptchaSiteKey,
                  recaptchaSecretKey: form.recaptchaSecretKey,
                })
              }
              disabled={savingSection === "recaptcha"}
            >
              {savingSection === "recaptcha" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderStorageConnection = () => {
    return (
      <article style={styles.integrationCard}>
        <header style={styles.integrationCardHeaderLarge}>
          <h3 style={styles.sectionTitle}>Storage Connection Settings</h3>
        </header>

        <div style={styles.integrationCardBodyLarge}>
          <p style={styles.helperText}>
            Upload flows now use this setting at runtime. Local storage writes to `/uploads`; third-party storage can target either an S3-compatible bucket or Cloudinary.
          </p>
          <div style={styles.grid2Compact}>
            <label style={styles.toggleTile}>
              <span>
                Local Storage <Info size={14} style={styles.inlineIcon} />
                <span style={styles.requiredAsterisk}>*</span>
              </span>
              <input
                type="checkbox"
                checked={form.storageLocalEnabled}
                style={styles.accentControl}
                onChange={(event) => set("storageLocalEnabled", event.target.checked)}
              />
            </label>
            <label style={styles.toggleTile}>
              <span>
                3rd Party Storage <Info size={14} style={styles.inlineIcon} />
                <span style={styles.requiredAsterisk}>*</span>
              </span>
              <input
                type="checkbox"
                checked={form.storageThirdPartyEnabled}
                style={styles.accentControl}
                onChange={(event) => set("storageThirdPartyEnabled", event.target.checked)}
              />
            </label>
          </div>

          <div style={styles.divider} />

          <div style={styles.storageSectionHeader}>
            <h4 style={styles.providerCardTitle}>3rd Party Provider</h4>
            <p style={styles.sectionSubtext}>
              Choose which third-party storage backend should receive uploaded assets.
            </p>
          </div>

          <Field label="Provider">
            <select
              style={styles.select}
              value={form.storageThirdPartyProvider}
              onChange={(event) =>
                set("storageThirdPartyProvider", event.target.value)
              }
            >
              <option value="s3">S3 Compatible</option>
              <option value="cloudinary">Cloudinary</option>
            </select>
          </Field>

          {form.storageThirdPartyProvider === "cloudinary" ? (
            <>
              <div style={styles.storageSectionHeader}>
                <h4 style={styles.providerCardTitle}>Cloudinary Credentials</h4>
                <p style={styles.sectionSubtext}>
                  Configure Cloudinary so uploads from the dashboard and mobile app are stored remotely through the backend.
                </p>
              </div>

              <Field label="Cloud Name">
                <input
                  style={styles.input}
                  value={form.storageCloudinaryCloudName}
                  onChange={(event) =>
                    set("storageCloudinaryCloudName", event.target.value)
                  }
                />
              </Field>
              <Field label="API Key">
                <input
                  style={styles.input}
                  value={form.storageCloudinaryApiKey}
                  onChange={(event) =>
                    set("storageCloudinaryApiKey", event.target.value)
                  }
                />
              </Field>
              <Field label="API Secret">
                <input
                  style={styles.input}
                  value={form.storageCloudinaryApiSecret}
                  onChange={(event) =>
                    set("storageCloudinaryApiSecret", event.target.value)
                  }
                />
              </Field>
              <Field label="Folder">
                <input
                  style={styles.input}
                  value={form.storageCloudinaryFolder}
                  onChange={(event) =>
                    set("storageCloudinaryFolder", event.target.value)
                  }
                />
              </Field>
            </>
          ) : (
            <>
              <div style={styles.storageSectionHeader}>
                <h4 style={styles.providerCardTitle}>S3 Credentials</h4>
                <p style={styles.sectionSubtext}>
                  Configure your S3-compatible credentials for asset uploads.
                </p>
              </div>

              <Field label="Key">
                <input
                  style={styles.input}
                  value={form.storageS3Key}
                  onChange={(event) => set("storageS3Key", event.target.value)}
                />
              </Field>
              <Field label="Secret">
                <input
                  style={styles.input}
                  value={form.storageS3Secret}
                  onChange={(event) => set("storageS3Secret", event.target.value)}
                />
              </Field>
              <Field label="Region">
                <input
                  style={styles.input}
                  value={form.storageS3Region}
                  onChange={(event) => set("storageS3Region", event.target.value)}
                />
              </Field>

              <div style={styles.grid2Compact}>
                <Field label="Bucket">
                  <input
                    style={styles.input}
                    value={form.storageS3Bucket}
                    onChange={(event) => set("storageS3Bucket", event.target.value)}
                  />
                </Field>
                <Field label="Endpoint URL">
                  <input
                    style={styles.input}
                    value={form.storageS3Endpoint}
                    onChange={(event) => set("storageS3Endpoint", event.target.value)}
                  />
                </Field>
              </div>
            </>
          )}

          <div style={styles.actionsInlineEnd}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  storageLocalEnabled: INITIAL_STATE.storageLocalEnabled,
                  storageThirdPartyEnabled: INITIAL_STATE.storageThirdPartyEnabled,
                  storageThirdPartyProvider: INITIAL_STATE.storageThirdPartyProvider,
                  storageS3Key: INITIAL_STATE.storageS3Key,
                  storageS3Secret: INITIAL_STATE.storageS3Secret,
                  storageS3Region: INITIAL_STATE.storageS3Region,
                  storageS3Bucket: INITIAL_STATE.storageS3Bucket,
                  storageS3Endpoint: INITIAL_STATE.storageS3Endpoint,
                  storageCloudinaryCloudName:
                    INITIAL_STATE.storageCloudinaryCloudName,
                  storageCloudinaryApiKey: INITIAL_STATE.storageCloudinaryApiKey,
                  storageCloudinaryApiSecret:
                    INITIAL_STATE.storageCloudinaryApiSecret,
                  storageCloudinaryFolder: INITIAL_STATE.storageCloudinaryFolder,
                }))
              }
            >
              Reset
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() =>
                void saveSection("storage-connection", "Storage Connection", {
                  storageLocalEnabled: form.storageLocalEnabled,
                  storageThirdPartyEnabled: form.storageThirdPartyEnabled,
                  storageThirdPartyProvider: form.storageThirdPartyProvider,
                  storageS3Key: form.storageS3Key,
                  storageS3Secret: form.storageS3Secret,
                  storageS3Region: form.storageS3Region,
                  storageS3Bucket: form.storageS3Bucket,
                  storageS3Endpoint: form.storageS3Endpoint,
                  storageCloudinaryCloudName: form.storageCloudinaryCloudName,
                  storageCloudinaryApiKey: form.storageCloudinaryApiKey,
                  storageCloudinaryApiSecret: form.storageCloudinaryApiSecret,
                  storageCloudinaryFolder: form.storageCloudinaryFolder,
                })
              }
              disabled={savingSection === "storage-connection"}
            >
              {savingSection === "storage-connection" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderMapApis = () => {
    return (
      <article style={styles.integrationCard}>
        <header style={styles.integrationCardHeaderLarge}>
          <div style={styles.titleRow}>
            <span style={styles.titleIconWrap}>
              <MapPinned size={16} />
            </span>
            <h3 style={styles.sectionTitle}>Map API Setup</h3>
          </div>
          <label style={styles.switchText}>
            <span>{form.mapEnabled ? "ON" : "OFF"}</span>
            <input
              type="checkbox"
              checked={form.mapEnabled}
              style={styles.accentControl}
              onChange={(event) => set("mapEnabled", event.target.checked)}
            />
          </label>
        </header>

        <div style={styles.integrationCardBodyLarge}>
          <p style={styles.helperText}>
            A single Google Maps key is used across maps, places, and geocoding integrations.
          </p>
          <Field label="Google Maps API Key">
            <input
              style={styles.input}
              value={form.mapApiKey}
              onChange={(event) => set("mapApiKey", event.target.value)}
            />
          </Field>

          <div style={styles.actionsInlineEnd}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  mapEnabled: INITIAL_STATE.mapEnabled,
                  mapApiKey: INITIAL_STATE.mapApiKey,
                }))
              }
            >
              Reset
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() =>
                void saveSection("map-apis", "Map APIs", {
                  mapEnabled: form.mapEnabled,
                  mapApiKey: form.mapApiKey,
                })
              }
              disabled={savingSection === "map-apis"}
            >
              {savingSection === "map-apis" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderFirebaseOtp = () => {
    return (
      <article style={styles.integrationCard}>
        <header style={styles.integrationCardHeaderLarge}>
          <div style={styles.titleRow}>
            <span style={styles.titleIconWrap}>
              <ShieldCheck size={16} />
            </span>
            <h3 style={styles.sectionTitle}>Firebase OTP</h3>
          </div>
          <label style={styles.switchText}>
            <span>{form.firebaseEnabled ? "ON" : "OFF"}</span>
            <input
              type="checkbox"
              checked={form.firebaseEnabled}
              style={styles.accentControl}
              onChange={(event) => set("firebaseEnabled", event.target.checked)}
            />
          </label>
        </header>

        <div style={styles.integrationCardBodyLarge}>
          <p style={styles.helperText}>
            Client apps should fetch `/platform/client-config` and use this Firebase config for phone verification when this section is enabled.
          </p>
          <div style={styles.grid2Compact}>
            <Field label="Firebase API Key">
              <input
                style={styles.input}
                value={form.firebaseApiKey}
                onChange={(event) => set("firebaseApiKey", event.target.value)}
              />
            </Field>
            <Field label="Project ID">
              <input
                style={styles.input}
                value={form.firebaseProjectId}
                onChange={(event) => set("firebaseProjectId", event.target.value)}
              />
            </Field>
          </div>

          <div style={styles.grid2Compact}>
            <Field label="Auth Domain">
              <input
                style={styles.input}
                value={form.firebaseAuthDomain}
                onChange={(event) => set("firebaseAuthDomain", event.target.value)}
              />
            </Field>
            <Field label="App ID">
              <input
                style={styles.input}
                value={form.firebaseAppId}
                onChange={(event) => set("firebaseAppId", event.target.value)}
              />
            </Field>
          </div>

          <Field label="Sender ID">
            <input
              style={styles.input}
              value={form.firebaseSenderId}
              onChange={(event) => set("firebaseSenderId", event.target.value)}
            />
          </Field>

          <div style={styles.actionsInlineEnd}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  firebaseEnabled: INITIAL_STATE.firebaseEnabled,
                  firebaseApiKey: INITIAL_STATE.firebaseApiKey,
                  firebaseProjectId: INITIAL_STATE.firebaseProjectId,
                  firebaseAuthDomain: INITIAL_STATE.firebaseAuthDomain,
                  firebaseAppId: INITIAL_STATE.firebaseAppId,
                  firebaseSenderId: INITIAL_STATE.firebaseSenderId,
                }))
              }
            >
              Reset
            </button>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() =>
                void saveSection("firebase-otp", "Firebase OTP", {
                  firebaseEnabled: form.firebaseEnabled,
                  firebaseApiKey: form.firebaseApiKey,
                  firebaseProjectId: form.firebaseProjectId,
                  firebaseAuthDomain: form.firebaseAuthDomain,
                  firebaseAppId: form.firebaseAppId,
                  firebaseSenderId: form.firebaseSenderId,
                })
              }
              disabled={savingSection === "firebase-otp"}
            >
              {savingSection === "firebase-otp" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </article>
    );
  };
  let panel: React.ReactNode;


  if (activeTab === "payment-methods") panel = renderPaymentMethods();
  else if (activeTab === "sms-module") panel = renderSmsModule();
  else if (activeTab === "mail-config") panel = renderMailConfig();
  else if (activeTab === "map-apis") panel = renderMapApis();
  else if (activeTab === "social-logins") panel = renderSocialLogins();
  else if (activeTab === "firebase-otp") panel = renderFirebaseOtp();
  else if (activeTab === "recaptcha") panel = renderRecaptcha();
  else panel = renderStorageConnection();

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div style={styles.titleRow}>
          <span style={styles.titleIconWrap}>
            <PlugZap size={18} />
          </span>
          <h1 style={styles.title}>3rd Party & Configuration</h1>
        </div>

        <div style={styles.tabsWrap}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tab,
                  ...(active ? styles.tabActive : null),
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <AdminCountryScopeBar
        scope={countryScope}
        countries={countries}
        loading={isCountriesLoading}
        onScopeChange={handleCountryScopeChange}
      />

      <section style={styles.panel}>{panel}</section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    maxWidth: 1420,
  },
  headerRow: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--surface-2)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  titleIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "grid",
    placeItems: "center",
    color: "#60A5FA",
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  tabsWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
  },
  tab: {
    height: 40,
    borderRadius: 999,
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontWeight: 500,
    padding: "0 16px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontSize: 15,
  },
  tabActive: {
    border: "1px solid rgba(37,99,235,0.45)",
    background: "#1275C5",
    color: "#FFFFFF",
    fontWeight: 700,
  },
  panel: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-1)",
    padding: 12,
  },
  stack12: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  paymentMethodsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    padding: "10px 12px",
    background: "var(--surface-2)",
  },
  paymentMethodsHeaderActions: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  infoPanel: {
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    background: "var(--surface-2)",
    padding: "14px 12px",
    fontSize: 14,
    color: "var(--muted-foreground)",
  },
  errorPanel: {
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 10,
    background: "rgba(239,68,68,0.12)",
    padding: "14px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    color: "#fecaca",
  },
  errorText: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#fca5a5",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  sectionSubtext: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "var(--muted-foreground)",
  },
  integrationHeaderRow: {
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    background: "var(--surface-2)",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  integrationCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-1)",
    overflow: "hidden",
  },
  integrationCardHeader: {
    borderBottom: "1px solid var(--input-border)",
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  integrationCardHeaderLarge: {
    borderBottom: "1px solid var(--input-border)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  integrationCardTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  requiredAsterisk: {
    color: "#ef4444",
    fontWeight: 800,
  },
  integrationCardBody: {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  integrationCardBodyLarge: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  integrationHintRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  mutedIcon: {
    color: "var(--muted-foreground)",
  },
  inlineIcon: {
    display: "inline-block",
    marginLeft: 4,
    marginRight: 2,
    color: "var(--muted-foreground)",
    verticalAlign: "text-bottom",
  },
  copyFieldWrap: {
    position: "relative",
  },
  copyInput: {
    paddingRight: 44,
  },
  copyBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--muted-foreground)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  credentialInfoBtn: {
    height: 40,
    borderRadius: 10,
    border: "1px solid rgba(18,117,197,0.55)",
    background: "rgba(18,117,197,0.08)",
    color: "#60a5fa",
    padding: "0 14px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  noticeBanner: {
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    background: "var(--surface-2)",
    padding: "14px 16px",
  },
  noticeTitle: {
    fontSize: 16,
    lineHeight: 1.25,
  },
  noticeText: {
    margin: "8px 0 0",
    fontSize: 14,
    color: "var(--muted-foreground)",
  },
  toggleTile: {
    minHeight: 60,
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    background: "var(--surface-1)",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 15,
    fontWeight: 600,
    color: "var(--foreground)",
  },
  divider: {
    height: 1,
    background: "var(--input-border)",
    margin: "4px 0",
  },
  storageSectionHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  grid2Large: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 14,
  },
  grid2Compact: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  providerCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    overflow: "hidden",
    background: "var(--surface-1)",
  },
  providerCardHeader: {
    padding: "12px 14px",
    borderBottom: "1px solid var(--input-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardHeaderActions: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  removeBtn: {
    height: 28,
    borderRadius: 6,
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    padding: "0 8px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  providerCardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  switchText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    color: "#1275C5",
    fontSize: 13,
  },
  providerCardBody: {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  gatewayStatusRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  readinessList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  readinessItem: {
    borderRadius: 8,
    background: "rgba(251,191,36,0.12)",
    color: "#FBBF24",
    fontSize: 12,
    lineHeight: 1.4,
    padding: "7px 10px",
  },
  gatewayStatusBadge: {
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--muted-foreground)",
    padding: "2px 10px",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  gatewayStatusDefault: {
    borderColor: "rgba(18,117,197,0.4)",
    background: "rgba(18,117,197,0.15)",
    color: "#93c5fd",
  },
  gatewayStatusSuccess: {
    borderColor: "rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.12)",
    color: "#86efac",
  },
  gatewayStatusWarn: {
    borderColor: "rgba(251,191,36,0.35)",
    background: "rgba(251,191,36,0.12)",
    color: "#fde68a",
  },
  brandArea: {
    height: 96,
    borderRadius: 10,
    border: "1px dashed var(--input-border)",
    background: "var(--surface-2)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    width: "100%",
  },
  brandImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  brandText: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--fg-75)",
    letterSpacing: 0.25,
    padding: "0 10px",
    textAlign: "center",
  },
  logoControls: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  uploadBtnCompact: {
    height: 34,
    borderRadius: 8,
    border: "1px solid rgba(18,117,197,0.35)",
    background: "rgba(18,117,197,0.12)",
    color: "#7cb4f5",
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },
  fileInput: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    cursor: "pointer",
  },
  secondaryBtnCompact: {
    height: 34,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 12px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  btnDisabled: {
    opacity: 0.55,
    pointerEvents: "none",
  },
  accentControl: {
    accentColor: "#1275C5",
    cursor: "pointer",
  },
  parameterEditorCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    background: "var(--surface-2)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  parameterEditorHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  parameterEditorTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
  },
  parameterCount: {
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  parameterAddRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 8,
  },
  parameterList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  parameterItem: {
    border: "1px solid var(--input-border)",
    borderRadius: 8,
    background: "var(--surface-1)",
    padding: "8px 10px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    gap: 10,
    alignItems: "center",
  },
  parameterLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "var(--fg-80)",
    minWidth: 0,
  },
  secretTag: {
    borderRadius: 999,
    border: "1px solid rgba(251,146,60,0.35)",
    background: "rgba(251,146,60,0.12)",
    color: "#fdba74",
    padding: "1px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  parameterRequiredToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  removeParamBtn: {
    height: 28,
    borderRadius: 7,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.1)",
    color: "#fca5a5",
    padding: "0 8px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  gatewayBuilderTab: {
    position: "fixed",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 58,
    height: 178,
    border: "1px solid var(--input-border)",
    borderRight: "none",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    cursor: "pointer",
    zIndex: 25,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
  },
  gatewayBuilderTabIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "#1d4ed8",
    color: "#fff",
    fontWeight: 700,
    fontSize: 18,
    lineHeight: 1,
  },
  gatewayBuilderTabText: {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 0.2,
    color: "var(--foreground)",
  },
  gatewayDrawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.6)",
    zIndex: 40,
    display: "flex",
    justifyContent: "flex-end",
    transition: "opacity 220ms ease",
  },
  gatewayDrawer: {
    width: "min(560px, 100vw)",
    height: "100%",
    background: "var(--surface-1)",
    borderLeft: "1px solid var(--input-border)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    overflowY: "auto",
    transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: "transform",
  },
  gatewayDrawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gatewayDrawerTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.15,
  },
  gatewayDrawerCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
  },
  drawerBlock: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-2)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  drawerLogoCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  drawerLogoPreview: {
    height: 96,
    borderRadius: 10,
    border: "1px dashed var(--input-border)",
    background: "var(--surface-1)",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },
  drawerBlockTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
  },
  drawerHint: {
    margin: 0,
    fontSize: 13,
    color: "var(--muted-foreground)",
  },
  drawerParameterList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  drawerParameterRow: {
    border: "1px solid var(--input-border)",
    borderRadius: 9,
    background: "var(--surface-1)",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  drawerCheckLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "var(--foreground)",
  },
  drawerCheckLabelMuted: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  radioInline: {
    display: "inline-flex",
    alignItems: "center",
    gap: 18,
    minHeight: 34,
  },
  radioLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "var(--fg-80)",
  },
  mailProviderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  },
  mailProviderTile: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1.5px solid var(--input-border)",
    background: "var(--surface-2)",
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "border-color 0.15s",
  },
  mailProviderTileActive: {
    background: "var(--surface-1)",
  },
  mailProviderDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  mailProviderInfo: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    gap: 1,
  },
  mailProviderName: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  mailProviderSub: {
    fontSize: 11,
    color: "var(--muted-foreground)",
  },
  mailProviderCheck: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    color: "#fff",
    fontWeight: 700,
    flexShrink: 0,
  },
  mailCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    background: "var(--surface-1)",
    overflow: "hidden",
  },
  mailTabsHeader: {
    borderBottom: "1px solid var(--input-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 12px",
  },
  mailTabsLeft: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  mailInnerTab: {
    height: 34,
    borderRadius: 8,
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontWeight: 600,
    fontSize: 14,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "default",
  },
  mailInnerTabActive: {
    color: "#1275C5",
    borderColor: "rgba(18,117,197,0.35)",
    background: "rgba(18,117,197,0.08)",
  },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#f97316",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  mailBody: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  switchLine: {
    minHeight: 44,
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    color: "#1275C5",
    fontWeight: 700,
    fontSize: 15,
  },
  helperText: {
    margin: 0,
    fontSize: 13,
    color: "var(--muted-foreground)",
  },
  simplePanel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 620,
  },
  simpleTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  simpleText: {
    margin: 0,
    fontSize: 14,
    color: "var(--muted-foreground)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-70)",
    letterSpacing: 0.2,
  },
  input: {
    height: 42,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 10px",
    outline: "none",
    fontSize: 14,
    width: "100%",
  },
  select: {
    height: 42,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 10px",
    outline: "none",
    fontSize: 14,
    width: "100%",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  actionsInline: {
    display: "flex",
    justifyContent: "flex-end",
  },
  actionsInlineEnd: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  actionsFooter: {
    display: "flex",
    justifyContent: "flex-end",
  },
  primaryBtn: {
    height: 40,
    borderRadius: 8,
    border: "1px solid rgba(18,117,197,0.45)",
    background: "#1275C5",
    color: "#FFFFFF",
    padding: "0 16px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 40,
    borderRadius: 8,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 16px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
};
