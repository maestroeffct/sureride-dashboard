import { notFound } from "next/navigation";
import BusinessSettingsFeaturePage from "@/src/components/rentals/business/BusinessSettingsFeaturePage";
import type { BusinessFeature } from "@/src/types/businessSettings";

const BUSINESS_PAGES: Record<BusinessFeature, { title: string; description: string }> = {
  "business-setup": {
    title: "Business Setup",
    description: "Set core business details, branding defaults, and base policies.",
  },
  "system-tax": {
    title: "System Tax",
    description: "Configure tax rules, rates, and tax handling for rental transactions.",
  },
  "email-template": {
    title: "Email Template",
    description: "Manage transactional email templates and delivery variants.",
  },
  "theme-settings": {
    title: "Theme Settings",
    description: "Control branding, palette, and appearance presets for dashboards.",
  },
  gallery: {
    title: "Gallery",
    description: "Manage reusable media assets for pages and campaigns.",
  },
  "login-setup": {
    title: "Login Setup",
    description: "Configure login experience, copy, and auth entry options.",
  },
  "pages-social-media": {
    title: "Pages & Social Media",
    description: "Set page-level social metadata and external channel links.",
  },
};

function isBusinessFeature(value: string): value is BusinessFeature {
  return value in BUSINESS_PAGES;
}

export default async function BusinessFeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;

  if (!isBusinessFeature(feature)) {
    notFound();
  }

  const config = BUSINESS_PAGES[feature];

  return (
    <BusinessSettingsFeaturePage
      feature={feature}
      title={config.title}
      description={config.description}
    />
  );
}
