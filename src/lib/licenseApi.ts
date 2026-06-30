import { apiRequest } from "@/src/lib/api";

export type LicenseStatus =
  | "UNLICENSED"
  | "ACTIVE"
  | "DEGRADED"
  | "INVALID"
  | "EXPIRED";

export type LicenseInfo = {
  status: LicenseStatus;
  productCode: string | null;
  plan: string | null;
  customerName: string | null;
  customerEmail: string | null;
  allowedDomains: string[];
  expiresAt: string | null;
  installationId: string;
  keyPreview: string | null;
  lastVerifiedOkAt: string | null;
  lastVerifyAttemptAt: string | null;
  lastError: string | null;
};

export async function getLicenseInfo() {
  return apiRequest<LicenseInfo>("/platform/license");
}

export async function activateLicense(input: {
  licenseKey: string;
  domain?: string;
}) {
  return apiRequest<LicenseInfo & { message: string }>(
    "/platform/license/activate",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function reverifyLicense() {
  return apiRequest<LicenseInfo>("/platform/license/reverify", {
    method: "POST",
  });
}
