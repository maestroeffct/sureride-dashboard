import { SidebarItem } from "@/src/types/sidebar";
import { sidebarIcons } from "./icons";

export const providerRentalsMenu: SidebarItem[] = [
  {
    kind: "section",
    label: "PROVIDER PORTAL",
  },
  {
    label: "Overview",
    path: "/provider",
    icon: sidebarIcons.overview,
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
    label: "Locations",
    path: "/provider/locations",
    icon: sidebarIcons.providers,
    allowedRoles: ["OWNER", "FLEET_MANAGER"],
    requiresVerification: true,
  },
  {
    label: "Insurance",
    path: "/provider/insurance",
    icon: sidebarIcons.insurance,
    allowedRoles: ["OWNER", "FLEET_MANAGER", "FINANCE"],
    requiresVerification: true,
  },
  {
    label: "Add Car",
    path: "/provider/cars/new",
    icon: sidebarIcons.addProvider,
    allowedRoles: ["OWNER", "FLEET_MANAGER"],
    requiresVerification: true,
  },
  {
    kind: "section",
    label: "OPERATIONS",
    allowedRoles: ["OWNER", "OPERATIONS", "CUSTOMER_SERVICE", "FLEET_MANAGER"],
  },
  {
    label: "Rents",
    path: "/provider/rents",
    icon: sidebarIcons.bookings,
    allowedRoles: ["OWNER", "OPERATIONS", "CUSTOMER_SERVICE", "FLEET_MANAGER"],
    requiresVerification: true,
  },
  {
    kind: "section",
    label: "FINANCE",
    allowedRoles: ["OWNER", "FINANCE"],
  },
  {
    label: "Earnings",
    path: "/provider/earnings",
    icon: sidebarIcons.bookings,
    allowedRoles: ["OWNER", "FINANCE"],
    requiresVerification: true,
  },
  {
    kind: "section",
    label: "ACCOUNT",
  },
  {
    label: "Team",
    path: "/provider/team",
    icon: sidebarIcons.providers,
    allowedRoles: ["OWNER"],
  },
  {
    label: "Settings",
    path: "/provider/settings",
    icon: sidebarIcons.settings,
  },
];
