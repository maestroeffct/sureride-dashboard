import { SidebarItem } from "@/src/types/sidebar";
import { sidebarIcons } from "./icons";

// Section order reflects daily-use precedence for a car-rental provider:
//   1. Overview + inbox  — first thing they open every morning
//   2. Live operations   — rents in flight, availability blocks
//   3. Fleet management  — cars, maintenance, insurance
//   4. Post-rental       — damage, refunds, reviews
//   5. Money             — earnings, fines, analytics
//   6. Growth surface    — add-ons for checkout
//   7. Account admin     — team, settings, support (rarely touched)
// Within a section, items are ordered by how often they're used.
export const providerRentalsMenu: SidebarItem[] = [
  {
    kind: "section",
    label: "OVERVIEW",
  },
  {
    label: "Dashboard",
    path: "/provider",
    icon: sidebarIcons.overview,
  },
  {
    label: "Notifications",
    path: "/provider/notifications",
    icon: sidebarIcons.notifications,
  },

  {
    kind: "section",
    label: "OPERATIONS",
    allowedRoles: ["OWNER", "OPERATIONS", "CUSTOMER_SERVICE", "FLEET_MANAGER"],
  },
  {
    label: "Rents",
    path: "/provider/rents",
    icon: sidebarIcons.rentals,
    allowedRoles: ["OWNER", "OPERATIONS", "CUSTOMER_SERVICE", "FLEET_MANAGER"],
    requiresVerification: true,
  },
  {
    label: "Availability",
    path: "/provider/availability",
    icon: sidebarIcons.availability,
    allowedRoles: ["OWNER", "FLEET_MANAGER", "OPERATIONS"],
    requiresVerification: true,
  },

  {
    kind: "section",
    label: "FLEET",
    allowedRoles: ["OWNER", "FLEET_MANAGER", "OPERATIONS", "FINANCE"],
  },
  {
    label: "Cars",
    path: "/provider/cars",
    icon: sidebarIcons.cars,
    allowedRoles: ["OWNER", "FLEET_MANAGER", "OPERATIONS"],
    requiresVerification: true,
  },
  {
    label: "Add Car",
    path: "/provider/cars/new",
    icon: sidebarIcons.addCar,
    allowedRoles: ["OWNER", "FLEET_MANAGER"],
    requiresVerification: true,
  },
  {
    label: "Maintenance",
    path: "/provider/maintenance",
    icon: sidebarIcons.maintenance,
    allowedRoles: ["OWNER", "FLEET_MANAGER", "OPERATIONS"],
    requiresVerification: true,
  },
  {
    label: "Protection Plans",
    path: "/provider/insurance",
    icon: sidebarIcons.insurance,
    allowedRoles: ["OWNER", "FLEET_MANAGER", "FINANCE"],
    requiresVerification: true,
  },
  {
    label: "Locations",
    path: "/provider/locations",
    icon: sidebarIcons.locations,
    allowedRoles: ["OWNER", "FLEET_MANAGER"],
    requiresVerification: true,
  },

  {
    kind: "section",
    label: "POST-RENTAL",
    allowedRoles: ["OWNER", "OPERATIONS", "FLEET_MANAGER", "CUSTOMER_SERVICE"],
  },
  {
    label: "Damage Claims",
    path: "/provider/damages",
    icon: sidebarIcons.damages,
    allowedRoles: ["OWNER", "OPERATIONS", "FLEET_MANAGER", "CUSTOMER_SERVICE"],
    requiresVerification: true,
  },
  {
    label: "Refunds",
    path: "/provider/refunds",
    icon: sidebarIcons.refunds,
    allowedRoles: ["OWNER", "OPERATIONS", "FINANCE", "CUSTOMER_SERVICE"],
    requiresVerification: true,
  },
  {
    label: "Reviews",
    path: "/provider/reviews",
    icon: sidebarIcons.reviews,
    allowedRoles: ["OWNER", "OPERATIONS", "CUSTOMER_SERVICE"],
    requiresVerification: true,
  },

  {
    kind: "section",
    label: "FINANCE",
    allowedRoles: ["OWNER", "FINANCE", "OPERATIONS"],
  },
  {
    label: "Earnings",
    path: "/provider/earnings",
    icon: sidebarIcons.earnings,
    allowedRoles: ["OWNER", "FINANCE"],
    requiresVerification: true,
  },
  {
    label: "Analytics",
    path: "/provider/analytics",
    icon: sidebarIcons.analytics,
    allowedRoles: ["OWNER", "FINANCE", "OPERATIONS"],
    requiresVerification: true,
  },
  {
    label: "Fines",
    path: "/provider/fines",
    icon: sidebarIcons.fines,
    allowedRoles: ["OWNER", "FINANCE"],
    requiresVerification: true,
  },

  {
    kind: "section",
    label: "STOREFRONT",
    allowedRoles: ["OWNER", "FLEET_MANAGER", "OPERATIONS"],
  },
  {
    label: "Add-ons",
    path: "/provider/addons",
    icon: sidebarIcons.addons,
    allowedRoles: ["OWNER", "FLEET_MANAGER", "OPERATIONS"],
    requiresVerification: true,
  },

  {
    kind: "section",
    label: "ACCOUNT",
  },
  {
    label: "Team",
    path: "/provider/team",
    icon: sidebarIcons.team,
    allowedRoles: ["OWNER"],
  },
  {
    label: "Settings",
    path: "/provider/settings",
    icon: sidebarIcons.settings,
  },
  {
    label: "Help & Support",
    path: "/provider/support",
    icon: sidebarIcons.help,
  },
];
