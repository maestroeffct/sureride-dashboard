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
  },
  {
    label: "Cars",
    path: "/provider/cars",
    icon: sidebarIcons.cars,
  },
  {
    label: "Locations",
    path: "/provider/locations",
    icon: sidebarIcons.providers,
  },
  {
    label: "Add Car",
    path: "/provider/cars/new",
    icon: sidebarIcons.addProvider,
  },
  {
    kind: "section",
    label: "OPERATIONS",
  },
  {
    label: "Rents",
    path: "/provider/rents",
    icon: sidebarIcons.bookings,
  },
  {
    kind: "section",
    label: "ACCOUNT",
  },
  {
    label: "Settings",
    path: "/provider/settings",
    icon: sidebarIcons.settings,
  },
];
