// src/components/dashboard/Sidebar/SidebarIcons.tsx
import {
  LayoutDashboard,
  Users,
  Shield,
  UserCog,
  Settings,
} from "lucide-react";
import { SidebarIconKey } from "@/src/config/adminMenu";

const ICON_MAP: Record<SidebarIconKey, any> = {
  dashboard: LayoutDashboard,
  users: Users,
  security: Shield,
  providers: Users,
  rentals: LayoutDashboard,
  rides: LayoutDashboard,
  payments: LayoutDashboard,
  support: Users,
  admin: UserCog,
  settings: Settings,
};

export function SidebarIcon({ name }: { name: SidebarIconKey }) {
  const Icon = ICON_MAP[name];
  return <Icon size={18} />;
}
