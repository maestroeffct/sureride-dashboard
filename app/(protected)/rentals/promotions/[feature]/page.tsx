import { notFound } from "next/navigation";
import FeaturePlaceholderPage from "@/src/components/rentals/common/FeaturePlaceholderPage";

const PROMOTIONS_PAGES: Record<string, { title: string; description: string }> = {
  campaigns: {
    title: "Campaigns",
    description: "Create and manage time-bound promotional campaigns.",
  },
  coupons: {
    title: "Coupons",
    description: "Issue and track coupon usage, limits, and expiration windows.",
  },
  "promo-campaigns": {
    title: "Promo Campaigns",
    description: "Coordinate bundled promotion flows across provider segments.",
  },
  cashback: {
    title: "Cashback",
    description: "Manage cashback percentages, eligibility rules, and payout states.",
  },
  banners: {
    title: "Banners",
    description: "Manage top-level in-app and web banners for rental promotions.",
  },
  "promotional-banner": {
    title: "Promotional Banner",
    description: "Configure dedicated promotional banner slots and scheduling.",
  },
  advertisement: {
    title: "Advertisement",
    description: "Control advertisement placements, content, and targeting.",
  },
  "push-notification": {
    title: "Push Notification",
    description: "Design and schedule promotional push notifications.",
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

  return (
    <FeaturePlaceholderPage
      section="Promotions Management"
      title={config.title}
      description={config.description}
    />
  );
}
