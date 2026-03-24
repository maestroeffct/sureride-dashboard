import { LucideIcon } from "lucide-react";

export interface SidebarItem {
  label: string;
  path?: string; // optional for parent groups
  icon?: LucideIcon;
  children?: SidebarItem[];
  kind?: "section";
}

export type SidebarModule = "rentals" | "rideshare" | "insurance";
