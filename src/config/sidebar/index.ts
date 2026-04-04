import { rentalsMenu } from "./rentals.menu";
import { rideshareMenu } from "./rideshare.menu";
import { insuranceMenu } from "./insurance.menu";
import { providerRentalsMenu } from "./provider-rentals.menu";
import { SidebarItem, SidebarModule } from "@/src/types/sidebar";

export const sidebarMenus: Record<SidebarModule, SidebarItem[]> = {
  rentals: rentalsMenu,
  rideshare: rideshareMenu,
  insurance: insuranceMenu,
  providerRentals: providerRentalsMenu,
};
