import { apiRequest } from "@/src/lib/api";

export type AdminPaymentMode = "TEST" | "LIVE";
export type AdminPaymentGatewayRuntimeAdapter =
  | "STRIPE"
  | "PAYSTACK"
  | "FLUTTERWAVE"
  | "CUSTOM";
export type AdminPaymentFieldType =
  | "TEXT"
  | "SECRET"
  | "EMAIL"
  | "URL"
  | "NUMBER"
  | "BOOLEAN"
  | "JSON";

export type AdminGatewayFieldCredentialState = {
  hasValue: boolean;
  updatedAt: string | null;
};

export type AdminPaymentGatewayField = {
  key: string;
  label: string;
  type: AdminPaymentFieldType;
  isRequired: boolean;
  isSecret: boolean;
  sortOrder: number;
  placeholder?: string | null;
  helpText?: string | null;
  defaultValue?: string | null;
  validationRegex?: string | null;
  options?: Record<string, unknown> | null;
  credentialState: AdminGatewayFieldCredentialState;
};

export type AdminPaymentGateway = {
  key: string;
  displayName: string;
  logoUrl?: string | null;
  runtimeAdapter: AdminPaymentGatewayRuntimeAdapter;
  mode: AdminPaymentMode;
  isEnabled: boolean;
  isDefault: boolean;
  merchantDisplayName?: string | null;
  supportedCurrencies: string[];
  metadata?: Record<string, unknown> | null;
  fields: AdminPaymentGatewayField[];
  isRuntimeSupported: boolean;
  isReadyForCheckout: boolean;
};

export type CreateAdminPaymentGatewayPayload = {
  key: string;
  displayName: string;
  logoUrl?: string;
  runtimeAdapter?: AdminPaymentGatewayRuntimeAdapter;
  mode?: AdminPaymentMode;
  isEnabled?: boolean;
  isDefault?: boolean;
  merchantDisplayName?: string;
  supportedCurrencies?: string[];
  metadata?: Record<string, unknown>;
  fields?: Array<{
    key: string;
    label: string;
    type: AdminPaymentFieldType;
    isRequired?: boolean;
    isSecret?: boolean;
    sortOrder?: number;
    placeholder?: string;
    helpText?: string;
    defaultValue?: string;
    validationRegex?: string;
    options?: Record<string, unknown>;
  }>;
  values?: Array<{
    fieldKey: string;
    value: string;
  }>;
};

export type UpdateAdminPaymentGatewayPayload = {
  displayName?: string;
  logoUrl?: string | null;
  runtimeAdapter?: AdminPaymentGatewayRuntimeAdapter;
  mode?: AdminPaymentMode;
  merchantDisplayName?: string | null;
  supportedCurrencies?: string[];
  metadata?: Record<string, unknown> | null;
};

export type ReplaceAdminPaymentGatewayFieldsPayload = {
  fields: Array<{
    key: string;
    label: string;
    type: AdminPaymentFieldType;
    isRequired?: boolean;
    isSecret?: boolean;
    sortOrder?: number;
    placeholder?: string;
    helpText?: string;
    defaultValue?: string;
    validationRegex?: string;
    options?: Record<string, unknown>;
  }>;
};

export type ReplaceAdminPaymentGatewayValuesPayload = {
  values: Array<{
    fieldKey: string;
    value: string;
  }>;
};

type ListAdminPaymentGatewaysResponse = {
  items: AdminPaymentGateway[];
};

export async function listAdminPaymentGateways() {
  const data = await apiRequest<ListAdminPaymentGatewaysResponse>(
    "/admin/payments/gateways",
  );
  return data.items ?? [];
}

export function createAdminPaymentGateway(payload: CreateAdminPaymentGatewayPayload) {
  return apiRequest<AdminPaymentGateway>("/admin/payments/gateways", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminPaymentGateway(
  key: string,
  payload: UpdateAdminPaymentGatewayPayload,
) {
  return apiRequest<AdminPaymentGateway>(`/admin/payments/gateways/${key}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function replaceAdminPaymentGatewayFields(
  key: string,
  payload: ReplaceAdminPaymentGatewayFieldsPayload,
) {
  return apiRequest<AdminPaymentGateway>(`/admin/payments/gateways/${key}/fields`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function replaceAdminPaymentGatewayValues(
  key: string,
  payload: ReplaceAdminPaymentGatewayValuesPayload,
) {
  return apiRequest<AdminPaymentGateway>(`/admin/payments/gateways/${key}/values`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function setAdminPaymentGatewayEnabled(key: string, isEnabled: boolean) {
  return apiRequest<AdminPaymentGateway>(`/admin/payments/gateways/${key}/enable`, {
    method: "PATCH",
    body: JSON.stringify({ isEnabled }),
  });
}

export function setAdminDefaultPaymentGateway(key: string) {
  return apiRequest<AdminPaymentGateway>(`/admin/payments/gateways/${key}/default`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export function archiveAdminPaymentGateway(key: string) {
  return apiRequest<{ message: string }>(`/admin/payments/gateways/${key}`, {
    method: "DELETE",
  });
}

export function uploadAdminPaymentGatewayLogo(key: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<{ logoUrl: string }>(`/admin/payments/gateways/${key}/logo`, {
    method: "POST",
    body: formData,
  });
}
