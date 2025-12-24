export type SidebarModule = "rentals" | "rideshare" | "insurance";

export interface SidebarItem {
  label: string;
  path: string;
}

export const sidebarMenus: Record<SidebarModule, SidebarItem[]> = {
  rentals: [
    { label: "Overview", path: "/rentals" },
    { label: "Cars", path: "/rentals/cars" },
    { label: "Bookings", path: "/rentals/bookings" },
    { label: "Pricing & Deposits", path: "/rentals/pricing" },
  ],

  rideshare: [
    { label: "Overview", path: "/dashboard/rideshare" },
    { label: "Trips", path: "/dashboard/rideshare/trips" },
    { label: "Drivers", path: "/dashboard/rideshare/drivers" },
    { label: "Riders", path: "/dashboard/rideshare/riders" },
    { label: "Earnings", path: "/dashboard/rideshare/earnings" },
  ],

  insurance: [
    { label: "Overview", path: "/dashboard/insurance" },
    { label: "Policies", path: "/dashboard/insurance/policies" },
    { label: "Claims", path: "/dashboard/insurance/claims" },
    { label: "Partners", path: "/dashboard/insurance/partners" },
  ],
};
