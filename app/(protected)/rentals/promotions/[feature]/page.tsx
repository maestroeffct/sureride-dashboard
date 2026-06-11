import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import CampaignsPage from "@/src/components/rentals/promotions/CampaignsPage";
import CashbackPage from "@/src/components/rentals/promotions/CashbackPage";
import BannersPage from "@/src/components/rentals/promotions/BannersPage";
import PushNotificationPage from "@/src/components/rentals/promotions/PushNotificationPage";

const PROMOTIONS_PAGES: Record<string, { title: string; Component: ComponentType }> = {
  campaigns: {
    title: "Campaigns",
    Component: CampaignsPage,
  },
  // coupons has a dedicated page at /rentals/promotions/coupons
  cashback: {
    title: "Cashback",
    Component: CashbackPage,
  },
  banners: {
    title: "Banners",
    Component: BannersPage,
  },
  "push-notification": {
    title: "Push Notification",
    Component: PushNotificationPage,
  },
};

export default async function PromotionsFeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  const config = PROMOTIONS_PAGES[feature];

  if (!config) {
    notFound();
  }

  const { Component } = config;
  return <Component />;
}
