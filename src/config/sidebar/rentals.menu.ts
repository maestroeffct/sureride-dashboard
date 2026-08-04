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
    kind: "section",
    label: "FINANCE & PAYOUTS",
  },
  {
    label: "Finance",
    icon: sidebarIcons.finance,
    children: [
      {
        label: "Payments",
        path: "/rentals/finance/payments",
        icon: sidebarIcons.payments,
      },
      {
        label: "Invoices",
        path: "/rentals/finance/invoices",
        icon: sidebarIcons.invoices,
      },
      {
        label: "Fines",
        path: "/rentals/finance/fines",
        icon: sidebarIcons.fines,
      },
      {
        label: "Expenses",
        path: "/rentals/finance/expenses",
        icon: sidebarIcons.expenses,
      },
      {
        label: "Credits",
        path: "/rentals/finance/credits",
        icon: sidebarIcons.credits,
      },
    ],
  },
  {
    label: "Provider Payouts",
    path: "/rentals/payouts",
    icon: sidebarIcons.payouts,
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
        icon: sidebarIcons.providerRequests,
      },
    ],
  },
  {
    label: "Fleet Management",
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
        icon: sidebarIcons.addCar,
      },
      {
        label: "Pending Approval",
        path: "/rentals/cars/pending",
        icon: sidebarIcons.pendingProviders,
      },
      {
        label: "Bookings",
        path: "/rentals/bookings",
        icon: sidebarIcons.bookings,
      },
      {
        label: "Rentals",
        path: "/rentals/fleet/rentals",
        icon: sidebarIcons.rentals,
      },
      {
        label: "Availability",
        path: "/rentals/fleet/availability",
        icon: sidebarIcons.availability,
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
        icon: sidebarIcons.addUser,
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
    label: "Protection Plans",
    path: "/rentals/insurance",
    icon: sidebarIcons.insurance,
  },
  {
    label: "Configuration",
    icon: sidebarIcons.cog,
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
        icon: sidebarIcons.car,
      },
      {
        label: "Car Features",
        path: "/rentals/configuration/car-features",
        icon: sidebarIcons.feature,
      },
      {
        label: "Model Requests",
        path: "/rentals/configuration/model-requests",
        icon: sidebarIcons.modelRequests,
      },
    ],
  },

  {
    kind: "section",
    label: "ADMIN MODULES",
  },
  {
    label: "Support Tickets",
    path: "/rentals/support-tickets",
    icon: sidebarIcons.help,
  },
  {
    label: "Business Settings",
    icon: sidebarIcons.business,
    children: [
      {
        label: "Business Setup",
        path: "/rentals/business/business-setup",
        icon: sidebarIcons.business,
      },
      {
        label: "System Tax",
        path: "/rentals/business/system-tax",
        icon: sidebarIcons.tax,
      },
      {
        label: "Email Template",
        path: "/rentals/business/email-template",
        icon: sidebarIcons.emailTemplate,
      },
      {
        label: "Theme Settings",
        path: "/rentals/business/theme-settings",
        icon: sidebarIcons.theme,
      },
      {
        label: "Gallery",
        path: "/rentals/business/gallery",
        icon: sidebarIcons.gallery,
      },
      {
        label: "Login Setup",
        path: "/rentals/business/login-setup",
        icon: sidebarIcons.loginSetup,
      },
      {
        label: "Pages & Social Media",
        path: "/rentals/business/pages-social-media",
        icon: sidebarIcons.social,
      },
    ],
  },
  {
    label: "Employee Management",
    icon: sidebarIcons.team,
    children: [
      {
        label: "Employee Role",
        path: "/rentals/employees/roles",
        icon: sidebarIcons.employeeRole,
      },
      {
        label: "Employees",
        path: "/rentals/employees",
        icon: sidebarIcons.employee,
      },
    ],
  },
  {
    label: "Promotions Management",
    icon: sidebarIcons.campaigns,
    children: [
      {
        label: "Campaigns",
        path: "/rentals/promotions/campaigns",
        icon: sidebarIcons.campaigns,
      },
      {
        label: "Coupons",
        path: "/rentals/promotions/coupons",
        icon: sidebarIcons.coupons,
      },
      {
        label: "Cashback",
        path: "/rentals/promotions/cashback",
        icon: sidebarIcons.cashback,
      },
      {
        label: "Banners",
        path: "/rentals/promotions/banners",
        icon: sidebarIcons.banners,
      },
      {
        label: "Push Notification",
        path: "/rentals/promotions/push-notification",
        icon: sidebarIcons.pushNotifications,
      },
      {
        label: "Limousine Requests",
        path: "/rentals/promotions/limousine-requests",
        icon: sidebarIcons.limousine,
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
        icon: sidebarIcons.thirdParty,
      },
      {
        label: "App & Web Settings",
        path: "/rentals/platform/app-web-settings",
        icon: sidebarIcons.appSettings,
      },
      {
        label: "Notification Channels",
        path: "/rentals/platform/notification-channels",
        icon: sidebarIcons.notificationChannels,
      },
      {
        label: "Notification Messages",
        path: "/rentals/platform/notification-messages",
        icon: sidebarIcons.notificationMessages,
      },
      {
        label: "Landing Page Settings",
        path: "/rentals/platform/landing-page-settings",
        icon: sidebarIcons.landingPage,
      },
      {
        label: "Page Meta Data",
        path: "/rentals/platform/page-meta-data",
        icon: sidebarIcons.meta,
      },
      {
        label: "Clean Database",
        path: "/rentals/platform/clean-database",
        icon: sidebarIcons.database,
      },
      {
        label: "Audit Log",
        path: "/rentals/platform/audit-log",
        icon: sidebarIcons.auditLog,
      },
      {
        label: "License",
        path: "/rentals/platform/license",
        icon: sidebarIcons.license,
      },
    ],
  },
];
