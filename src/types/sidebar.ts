import { LucideIcon } from "lucide-react";

/**
 * Provider portal staff roles. "OWNER" is the registered RentalProvider account.
 * Other roles are explicit staff scopes invited by the owner.
 */
export type ProviderPortalRole =
  | "OWNER"
  | "FLEET_MANAGER"
  | "OPERATIONS"
  | "FINANCE"
  | "CUSTOMER_SERVICE";

export interface SidebarItem {
  label: string;
  path?: string; // optional for parent groups
  icon?: LucideIcon;
  children?: SidebarItem[];
  kind?: "section";
  /**
   * If present, only sessions whose role is in this list see this entry.
   * OWNER always sees everything (filter short-circuits).
   * Omit to grant all roles access.
   */
  allowedRoles?: ProviderPortalRole[];
  /**
   * If true, this item is rendered as locked/disabled when the provider has
   * not yet completed business verification. The link still navigates so
   * users can read more, but a lock affordance reminds them why it's
   * unavailable. Only applies to operational items (cars, locations, etc.).
   */
  requiresVerification?: boolean;
}

export type SidebarModule =
  | "rentals"
  | "rideshare"
  | "insurance"
  | "providerRentals";
