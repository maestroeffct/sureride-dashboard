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
  label: string;
  icon: SidebarIconKey;
  items: AdminMenuItem[];
}

/**
 * PLATFORM ADMIN MENU (SUPER ADMIN / OPS)
 * - Manages vendors
 * - Oversees cars & bookings
 * - Controls pricing rules
 */
export const adminMenu: AdminMenuSection[] = [
  /* =========================
     DASHBOARD
  ========================= */
  {
    label: "Dashboard",
    icon: "dashboard",
    items: [{ label: "Overview", path: "/dashboard" }],
  },

  /* =========================
     USER MANAGEMENT
  ========================= */
  {
    label: "Users",
    icon: "users",
    items: [
      { label: "All Users", path: "/users" },
      { label: "Active Users", path: "/users/active" },
      { label: "Suspended Users", path: "/users/suspended" },
      { label: "Verification", path: "/users/verification" },
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
      { label: "Devices", path: "/auth/devices" },
      { label: "IP Restrictions", path: "/auth/ip-rules" },
    ],
  },

  /* =========================
     CAR RENTAL (PLATFORM VIEW)
  ========================= */
  {
    label: "Car Rental",
    icon: "rentals",
    items: [
      { label: "Overview", path: "/rentals" },

      // PROVIDERS (VENDORS)
      { label: "Rental Providers", path: "/rentals/providers" },
      { label: "Pending Providers", path: "/rentals/providers/pending" },

      // INVENTORY (OWNED BY PROVIDERS)
      { label: "All Cars", path: "/rentals/cars" },
      { label: "Pending Car Approval", path: "/rentals/cars/pending" },
      { label: "Flagged Cars", path: "/rentals/cars/flagged" },

      // OPERATIONS
      { label: "Bookings", path: "/rentals/bookings" },
      { label: "Issues & Claims", path: "/rentals/issues" },

      // BUSINESS RULES
      { label: "Pricing & Deposits", path: "/rentals/pricing" },
      { label: "Reviews & Ratings", path: "/rentals/reviews" },
    ],
  },

  /* =========================
     PAYMENTS & REVENUE
  ========================= */
  {
    label: "Payments",
    icon: "payments",
    items: [
      { label: "Transactions", path: "/payments" },
      { label: "Vendor Payouts", path: "/payments/payouts" },
      { label: "Commissions", path: "/payments/commissions" },
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
