import { AdminRole } from "./adminRoles";

export interface AdminMenuItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles: AdminRole[];
}

export interface AdminMenuSection {
  label: string;
  items: AdminMenuItem[];
}

export const adminMenu: AdminMenuSection[] = [
  {
    label: "MAIN",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        roles: ["SUPER_ADMIN", "OPS", "SUPPORT"],
      },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      {
        label: "Users",
        path: "/dashboard/users",
        roles: ["SUPER_ADMIN", "OPS"],
      },
      {
        label: "Service Providers",
        path: "/dashboard/providers",
        roles: ["SUPER_ADMIN", "OPS"],
      },
      {
        label: "Car Rental",
        path: "/dashboard/rentals",
        roles: ["SUPER_ADMIN", "OPS"],
      },
      {
        label: "Ride Share",
        path: "/dashboard/rides",
        roles: ["SUPER_ADMIN", "OPS"],
      },
    ],
  },
  {
    label: "FINANCE",
    items: [
      {
        label: "Payments",
        path: "/dashboard/payments",
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      {
        label: "Support Tickets",
        path: "/dashboard/support",
        roles: ["SUPER_ADMIN", "SUPPORT"],
      },
    ],
  },
];
