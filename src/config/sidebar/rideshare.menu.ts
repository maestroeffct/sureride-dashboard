import { SidebarItem } from "@/src/types/sidebar";
import { sidebarIcons } from "./icons";

export const rideshareMenu: SidebarItem[] = [
  {
    label: "Overview",
    path: "/dashboard/rideshare",
    icon: sidebarIcons.overview,
  },
  {
    label: "Trips",
    path: "/dashboard/rideshare/trips",
    icon: sidebarIcons.bookings,
  },
  {
    label: "Drivers",
    path: "/dashboard/rideshare/drivers",
    icon: sidebarIcons.users,
  },
  {
    label: "Riders",
    path: "/dashboard/rideshare/riders",
    icon: sidebarIcons.users,
  },
];
