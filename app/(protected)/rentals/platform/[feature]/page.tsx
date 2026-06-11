import { notFound } from "next/navigation";
import ThirdPartyConfigurationPage from "@/src/components/rentals/platform/ThirdPartyConfigurationPage";
import AppWebSettingsPage from "@/src/components/rentals/platform/AppWebSettingsPage";
import NotificationChannelsPage from "@/src/components/rentals/platform/NotificationChannelsPage";
import NotificationMessagesPage from "@/src/components/rentals/platform/NotificationMessagesPage";
import LandingPageSettingsPage from "@/src/components/rentals/platform/LandingPageSettingsPage";
import PageMetaDataPage from "@/src/components/rentals/platform/PageMetaDataPage";
import CleanDatabasePage from "@/src/components/rentals/platform/CleanDatabasePage";

const PAGES: Record<string, { title: string; description: string; Component: React.ComponentType }> = {
  "third-party-configuration": {
    title: "3rd Party & Configuration",
    description: "Manage external integrations, API keys, and service configuration.",
    Component: ThirdPartyConfigurationPage,
  },
  "app-web-settings": {
    title: "App & Web Settings",
    description: "Manage shared app/web behavior and global presentation options.",
    Component: AppWebSettingsPage,
  },
  "notification-channels": {
    title: "Notification Channels",
    description: "Configure available channels for outbound notification delivery.",
    Component: NotificationChannelsPage,
  },
  "notification-messages": {
    title: "Notification Messages",
    description: "Manage reusable notification message templates and content.",
    Component: NotificationMessagesPage,
  },
  "landing-page-settings": {
    title: "Landing Page Settings",
    description: "Control landing-page modules, ordering, and public visibility.",
    Component: LandingPageSettingsPage,
  },
  "page-meta-data": {
    title: "Page Meta Data",
    description: "Configure SEO metadata and structured page-level descriptors.",
    Component: PageMetaDataPage,
  },
  "clean-database": {
    title: "Clean Database",
    description: "Trigger controlled cleanup workflows for stale or test records.",
    Component: CleanDatabasePage,
  },
};

export default async function PlatformFeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  const config = PAGES[feature];

  if (!config) notFound();

  const { Component, title, description } = config;

  // ThirdParty page brings its own header/layout
  if (feature === "third-party-configuration") {
    return <Component />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 750, letterSpacing: -0.4 }}>{title}</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>{description}</p>
      </div>
      <Component />
    </div>
  );
}
