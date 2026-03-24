import { notFound } from "next/navigation";
import FeaturePlaceholderPage from "@/src/components/rentals/common/FeaturePlaceholderPage";
import ThirdPartyConfigurationPage from "@/src/components/rentals/platform/ThirdPartyConfigurationPage";

const PLATFORM_PAGES: Record<string, { title: string; description: string }> = {
  "third-party-configuration": {
    title: "3rd Party & Configuration",
    description: "Manage external integrations, API keys, and service configuration.",
  },
  "app-web-settings": {
    title: "App & Web Settings",
    description: "Manage shared app/web behavior and global presentation options.",
  },
  "notification-channels": {
    title: "Notification Channels",
    description: "Configure available channels for outbound notification delivery.",
  },
  "notification-messages": {
    title: "Notification Messages",
    description: "Manage reusable notification message templates and content.",
  },
  "landing-page-settings": {
    title: "Landing Page Settings",
    description: "Control landing-page modules, ordering, and public visibility.",
  },
  "page-meta-data": {
    title: "Page Meta Data",
    description: "Configure SEO metadata and structured page-level descriptors.",
  },
  "react-site": {
    title: "React Site",
    description: "Manage runtime flags and deployment-facing site parameters.",
  },
  "clean-database": {
    title: "Clean Database",
    description: "Trigger controlled cleanup workflows for stale or test records.",
  },
  "addon-activation": {
    title: "Addon Activation",
    description: "Enable or disable optional add-on modules for the platform.",
  },
};

export default async function PlatformFeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  const config = PLATFORM_PAGES[feature];

  if (!config) {
    notFound();
  }

  if (feature === "third-party-configuration") {
    return <ThirdPartyConfigurationPage />;
  }

  return (
    <FeaturePlaceholderPage
      section="System Settings"
      title={config.title}
      description={config.description}
    />
  );
}
