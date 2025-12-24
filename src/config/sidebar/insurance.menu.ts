import { SidebarItem } from "@/src/types/sidebar";
import { sidebarIcons } from "./icons";

export const insuranceMenu: SidebarItem[] = [
  {
    label: "Overview",
    path: "/dashboard/insurance",
    icon: sidebarIcons.overview,
  },
  {
    label: "Policies",
    path: "/dashboard/insurance/policies",
    icon: sidebarIcons.policies,
  },
  {
    label: "Claims",
    path: "/dashboard/insurance/claims",
    icon: sidebarIcons.claims,
  },
];
