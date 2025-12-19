// src/config/adminMenu.ts

export type SidebarIconKey =
  | "dashboard"
  | "users"
  | "security"
  | "providers"
  | "rentals"
  | "rides"
  | "payments"
  | "support"
  | "admin"
  | "settings";

export interface AdminMenuItem {
  label: string;
  path: string;
}

export interface AdminMenuSection {
  label: string; // 👈 this IS the label shown before SidebarSection
  icon: SidebarIconKey;
  items: AdminMenuItem[];
}

export const adminMenu: AdminMenuSection[] = [
  /* =========================
     DASHBOARD
  ========================= */
  {
    label: "Dashboard",
    icon: "dashboard",
    items: [
      { label: "Overview", path: "/dashboard" },
      { label: "KPI Overview", path: "/dashboard/kpi" },
      { label: "Live Activity", path: "/dashboard/activity" },
      { label: "Alerts", path: "/dashboard/alerts" },
    ],
  },

  /* =========================
     USER MANAGEMENT
  ========================= */
  {
    label: "User Management",
    icon: "users",
    items: [
      { label: "All Users", path: "/users" },
      { label: "Active Users", path: "/users/active" },
      { label: "Suspended Users", path: "/users/suspended" },
      { label: "User Verification", path: "/users/verification" },
      { label: "Reports & Flags", path: "/users/reports" },
    ],
  },

  /* =========================
     AUTH & SECURITY
  ========================= */
  {
    label: "Auth & Security",
    icon: "security",
    items: [
      { label: "Login Sessions", path: "/auth/sessions" },
      { label: "Failed Logins", path: "/auth/failed-logins" },
      { label: "Device Management", path: "/auth/devices" },
      { label: "IP Restrictions", path: "/auth/ip-rules" },
    ],
  },

  /* =========================
     CAR RENTAL MANAGEMENT
  ========================= */
  {
    label: "Car Rental",
    icon: "rentals",
    items: [
      { label: "Rentals Dashboard", path: "/rentals" },
      { label: "Cars", path: "/rentals/cars" },
      { label: "Bookings", path: "/rentals/bookings" },
      { label: "Issues", path: "/rentals/issues" },
      { label: "Pricing & Deposits", path: "/rentals/pricing" },
      { label: "Reviews", path: "/rentals/reviews" },
    ],
  },

  /* =========================
     ADMIN & ROLES
  ========================= */
  {
    label: "Admin & Roles",
    icon: "admin",
    items: [
      { label: "Admin Users", path: "/admin/users" },
      { label: "Roles", path: "/admin/roles" },
      { label: "Permissions", path: "/admin/permissions" },
      { label: "Activity Logs", path: "/admin/activity-logs" },
      { label: "Audit Trails", path: "/admin/audit-trails" },
    ],
  },
];
