export type PublicPlatformConfig = {
  recaptcha?: {
    enabled?: boolean;
    siteKey?: string;
  };
  maps?: {
    enabled?: boolean;
    apiKey?: string;
  };
  businessSetup?: {
    companyName?: string;
    email?: string;
    phoneCode?: string;
    phone?: string;
    country?: string;
    businessDescription?: string;
    latitude?: string;
    longitude?: string;
    logoUrl?: string;
    faviconUrl?: string;
    timezone?: string;
    timeFormat?: string;
    countryPickerEnabled?: boolean;
    currency?: string;
    currencySymbolPosition?: string;
    decimalDigits?: string;
    copyrightText?: string;
    cookiesText?: string;
  };
  themeSettings?: {
    brandColor?: string;
    secondaryColor?: string;
    logoLightText?: string;
    logoDarkText?: string;
  };
  gallery?: {
    items?: string[];
  };
  loginSetup?: {
    allowPasswordLogin?: boolean;
    allowMagicLink?: boolean;
    requireMfaForAdmins?: boolean;
    showRememberMe?: boolean;
  };
  pagesSocialMedia?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    twitterHandle?: string;
    facebookPage?: string;
    instagramPage?: string;
    linkedinPage?: string;
  };
  systemTax?: {
    taxInclusivePricing?: boolean;
    rows?: Array<{
      label?: string;
      code?: string;
      rate?: number;
      active?: boolean;
    }>;
  };
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";
}

export async function fetchPublicPlatformConfig(
  init?: RequestInit,
): Promise<PublicPlatformConfig | null> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/platform/client-config`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
      },
      cache: init?.cache ?? "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PublicPlatformConfig;
  } catch {
    return null;
  }
}
