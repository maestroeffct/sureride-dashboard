import { rentalsMenu } from "./rentals.menu";
import { rideshareMenu } from "./rideshare.menu";
import { insuranceMenu } from "./insurance.menu";
import { SidebarModule } from "@/src/types/sidebar";

export const sidebarMenus: Record<SidebarModule, any[]> = {
  rentals: rentalsMenu,
  rideshare: rideshareMenu,
  insurance: insuranceMenu,
};
