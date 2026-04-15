import { SidebarItem } from "@/src/types/sidebar";
import { sidebarIcons } from "./icons";

export const rentalsMenu: SidebarItem[] = [
  {
    kind: "section",
    label: "RENTALS CORE",
  },
  {
    label: "Overview",
    path: "/rentals",
    icon: sidebarIcons.overview,
  },
  {
    label: "Bookings",
    path: "/rentals/bookings",
    icon: sidebarIcons.bookings,
  },

  {
    kind: "section",
    label: "FINANCE & PAYOUTS",
  },
  {
    label: "Finance Overview",
    path: "/rentals/finance",
    icon: sidebarIcons.pricing,
  },
  {
    label: "Payment & Payouts",
    icon: sidebarIcons.pricing,
    children: [
      {
        label: "Payment Gateways",
        path: "/rentals/platform/third-party-configuration",
        icon: sidebarIcons.settings,
      },
      {
        label: "Provider Payouts",
        path: "/rentals/payouts",
        icon: sidebarIcons.providers,
      },
    ],
  },

  {
    kind: "section",
    label: "NETWORK MANAGEMENT",
  },
  {
    label: "Providers",
    icon: sidebarIcons.providers,
    children: [
      {
        label: "Rental Providers",
        path: "/rentals/providers",
        icon: sidebarIcons.providers,
      },
      {
        label: "Add Provider",
        path: "/rentals/providers/new",
        icon: sidebarIcons.addProvider,
      },
      {
        label: "Provider Requests",
        path: "/rentals/providers/requests",
        icon: sidebarIcons.pendingProviders,
      },
    ],
  },
  {
    label: "Cars Management",
    icon: sidebarIcons.cars,
    children: [
      {
        label: "All Cars",
        path: "/rentals/cars",
        icon: sidebarIcons.cars,
      },
      {
        label: "Add Car",
        path: "/rentals/cars/new",
        icon: sidebarIcons.addProvider,
      },
      {
        label: "Pending Approval",
        path: "/rentals/cars/pending",
        icon: sidebarIcons.pendingProviders,
      },
      {
        label: "Flagged Cars",
        path: "/rentals/cars/flagged",
        icon: sidebarIcons.flaggedCars,
      },
    ],
  },
  {
    label: "Users",
    icon: sidebarIcons.users,
    children: [
      {
        label: "All Users",
        path: "/rentals/users",
        icon: sidebarIcons.users,
      },
      {
        label: "Add User",
        path: "/rentals/users/new",
        icon: sidebarIcons.addProvider,
      },
    ],
  },

  {
    kind: "section",
    label: "SYSTEM SETTINGS",
  },
  {
    label: "Pricing Rules",
    path: "/rentals/pricing-rules",
    icon: sidebarIcons.pricing,
  },
  {
    label: "Configuration",
    icon: sidebarIcons.settings,
    children: [
      {
        label: "Car Categories",
        path: "/rentals/configuration/car-categories",
        icon: sidebarIcons.category,
      },
      {
        label: "Car Brands",
        path: "/rentals/configuration/car-brands",
        icon: sidebarIcons.brand,
      },
      {
        label: "Car Models",
        path: "/rentals/configuration/car-models",
        icon: sidebarIcons.settings,
      },
      {
        label: "Car Features",
        path: "/rentals/configuration/car-features",
        icon: sidebarIcons.settings,
      },
      {
        label: "Model Requests",
        path: "/rentals/configuration/model-requests",
        icon: sidebarIcons.settings,
      },
    ],
  },

  {
    kind: "section",
    label: "ADMIN MODULES",
  },
  {
    label: "Business Settings",
    icon: sidebarIcons.settings,
    children: [
      {
        label: "Business Setup",
        path: "/rentals/business/business-setup",
        icon: sidebarIcons.settings,
      },
      {
        label: "System Tax",
        path: "/rentals/business/system-tax",
        icon: sidebarIcons.pricing,
      },
      {
        label: "Email Template",
        path: "/rentals/business/email-template",
        icon: sidebarIcons.reviews,
      },
      {
        label: "Theme Settings",
        path: "/rentals/business/theme-settings",
        icon: sidebarIcons.settings,
      },
      {
        label: "Gallery",
        path: "/rentals/business/gallery",
        icon: sidebarIcons.reviews,
      },
      {
        label: "Login Setup",
        path: "/rentals/business/login-setup",
        icon: sidebarIcons.users,
      },
      {
        label: "Pages & Social Media",
        path: "/rentals/business/pages-social-media",
        icon: sidebarIcons.reports,
      },
    ],
  },
  {
    label: "Platform Settings",
    icon: sidebarIcons.settings,
    children: [
      {
        label: "3rd Party & Configuration",
        path: "/rentals/platform/third-party-configuration",
        icon: sidebarIcons.settings,
      },
      {
        label: "App & Web Settings",
        path: "/rentals/platform/app-web-settings",
        icon: sidebarIcons.settings,
      },
      {
        label: "Notification Channels",
        path: "/rentals/platform/notification-channels",
        icon: sidebarIcons.pendingProviders,
      },
      {
        label: "Notification Messages",
        path: "/rentals/platform/notification-messages",
        icon: sidebarIcons.claims,
      },
      {
        label: "Landing Page Settings",
        path: "/rentals/platform/landing-page-settings",
        icon: sidebarIcons.settings,
      },
      {
        label: "Page Meta Data",
        path: "/rentals/platform/page-meta-data",
        icon: sidebarIcons.reports,
      },
      {
        label: "React Site",
        path: "/rentals/platform/react-site",
        icon: sidebarIcons.reports,
      },
      {
        label: "Clean Database",
        path: "/rentals/platform/clean-database",
        icon: sidebarIcons.claims,
      },
      {
        label: "Addon Activation",
        path: "/rentals/platform/addon-activation",
        icon: sidebarIcons.settings,
      },
    ],
  },
  {
    label: "Employee Management",
    icon: sidebarIcons.users,
    children: [
      {
        label: "Employee Role",
        path: "/rentals/employees/roles",
        icon: sidebarIcons.brand,
      },
      {
        label: "Employees",
        path: "/rentals/employees",
        icon: sidebarIcons.users,
      },
    ],
  },
  {
    label: "Promotions Management",
    icon: sidebarIcons.reports,
    children: [
      {
        label: "Campaigns",
        path: "/rentals/promotions/campaigns",
        icon: sidebarIcons.reports,
      },
      {
        label: "Coupons",
        path: "/rentals/promotions/coupons",
        icon: sidebarIcons.pricing,
      },
      {
        label: "Promo Campaigns",
        path: "/rentals/promotions/promo-campaigns",
        icon: sidebarIcons.reviews,
      },
      {
        label: "Cashback",
        path: "/rentals/promotions/cashback",
        icon: sidebarIcons.pricing,
      },
      {
        label: "Banners",
        path: "/rentals/promotions/banners",
        icon: sidebarIcons.settings,
      },
      {
        label: "Promotional Banner",
        path: "/rentals/promotions/promotional-banner",
        icon: sidebarIcons.settings,
      },
      {
        label: "Advertisement",
        path: "/rentals/promotions/advertisement",
        icon: sidebarIcons.claims,
      },
      {
        label: "Push Notification",
        path: "/rentals/promotions/push-notification",
        icon: sidebarIcons.pendingProviders,
      },
    ],
  },
];
