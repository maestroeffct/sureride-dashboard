export const ADMIN_ROUTES = {
  SUPER_ADMIN: ["/dashboard"],
  OPS: [
    "/dashboard",
    "/dashboard/users",
    "/dashboard/providers",
    "/dashboard/rides",
    "/dashboard/rentals",
    "/dashboard/support",
  ],
  SUPPORT: ["/dashboard/support", "/dashboard/tickets"],
};

export const DEFAULT_REDIRECT = "/login";
