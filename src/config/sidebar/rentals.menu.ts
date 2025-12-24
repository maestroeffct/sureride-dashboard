import { SidebarItem } from "@/src/types/sidebar";
import { sidebarIcons } from "./icons";

export const rentalsMenu: SidebarItem[] = [
  {
    label: "Overview",
    path: "/rentals",
    icon: sidebarIcons.overview,
  },

  // PROVIDERS
  {
    label: "Providers",
    icon: sidebarIcons.providers,
    children: [
      {
        label: "Rental Providers",
        path: "/rentals/providers",
        icon: sidebarIcons.providers,
      },
      {
        label: "Add Provider",
        path: "/rentals/providers/new",
        icon: sidebarIcons.addProvider,
      },
      {
        label: "Providers Requests",
        path: "/rentals/providers/requests",
        icon: sidebarIcons.pendingProviders,
      },
    ],
  },

  // INVENTORY
  {
    label: "Cars",
    icon: sidebarIcons.cars,
    children: [
      {
        label: "All Cars",
        path: "/rentals/cars",
        icon: sidebarIcons.cars,
      },
      {
        label: "Pending Approval",
        path: "/rentals/cars/pending",
        icon: sidebarIcons.pendingProviders,
      },
      {
        label: "Flagged Cars",
        path: "/rentals/cars/flagged",
        icon: sidebarIcons.flaggedCars,
      },
    ],
  },

  // OPERATIONS
  {
    label: "Bookings",
    path: "/rentals/bookings",
    icon: sidebarIcons.bookings,
  },
  {
    label: "Issues & Claims",
    path: "/rentals/issues",
    icon: sidebarIcons.claims,
  },

  // BUSINESS RULES
  {
    label: "Pricing & Deposits",
    path: "/rentals/pricing",
    icon: sidebarIcons.pricing,
  },
  {
    label: "Reviews & Ratings",
    path: "/rentals/reviews",
    icon: sidebarIcons.reviews,
  },
];
