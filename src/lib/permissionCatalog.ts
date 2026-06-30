import type { EmployeePermission } from "@/src/types/employee";

/**
 * Single source of truth for translating raw `module.action` permission
 * keys into a human-friendly grouped catalog. Used by the Employee Role
 * modal so admins choose "Add new employees" instead of seeing the raw
 * literal `employees.create`.
 *
 * Adding a new permission?
 *   1. Add it to EmployeePermission in src/types/employee.ts (and the
 *      backend's allowlist).
 *   2. Add a row here under the right module.
 * The modal picks the new row up automatically.
 */

export type PermissionAction = {
  key: EmployeePermission;
  label: string;
  // Plain-language explainer shown under the checkbox on hover/help.
  hint?: string;
  // Most module.write/update/delete actions are only meaningful when
  // the matching read is on. We flag those here so the modal can lock
  // them out until read is checked.
  requires?: EmployeePermission;
};

export type PermissionModule = {
  key: string;
  label: string;
  description: string;
  actions: PermissionAction[];
};

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "employees",
    label: "Employees",
    description: "Admin staff inside the rentals dashboard.",
    actions: [
      {
        key: "employees.read",
        label: "View employees",
        hint: "See the employee directory and individual profiles.",
      },
      {
        key: "employees.create",
        label: "Add new employees",
        hint: "Invite new admin staff to the dashboard.",
        requires: "employees.read",
      },
      {
        key: "employees.update",
        label: "Edit existing employees",
        hint: "Change role assignments, profile fields, etc.",
        requires: "employees.read",
      },
      {
        key: "employees.suspend",
        label: "Suspend / reactivate employees",
        hint: "Disable an employee's access without deleting their record.",
        requires: "employees.read",
      },
    ],
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    description: "Who can do what inside the dashboard.",
    actions: [
      {
        key: "roles.read",
        label: "View roles",
        hint: "See the list of roles and their permissions.",
      },
      {
        key: "roles.create",
        label: "Create new roles",
        requires: "roles.read",
      },
      {
        key: "roles.update",
        label: "Edit existing roles",
        requires: "roles.read",
      },
      {
        key: "roles.delete",
        label: "Delete roles",
        hint: "Permanent. Cannot delete a role that's still assigned to staff.",
        requires: "roles.read",
      },
    ],
  },
  {
    key: "providers",
    label: "Providers",
    description: "Rental providers + their onboarding queue.",
    actions: [
      {
        key: "providers.manage",
        label: "Manage providers",
        hint: "Approve, suspend, edit, reset passwords, and review documents.",
      },
    ],
  },
  {
    key: "cars",
    label: "Fleet (Cars)",
    description: "Cars listed by all providers + the moderation queue.",
    actions: [
      {
        key: "cars.manage",
        label: "Manage cars",
        hint: "Approve / flag / unflag / activate / deactivate listings.",
      },
    ],
  },
  {
    key: "bookings",
    label: "Bookings",
    description: "Customer rental reservations.",
    actions: [
      {
        key: "bookings.manage",
        label: "Manage bookings",
        hint: "Cancel bookings, contact customers, override states.",
      },
    ],
  },
  {
    key: "promotions",
    label: "Promotions",
    description: "Banners, coupons, push campaigns, limousine requests.",
    actions: [
      {
        key: "promotions.manage",
        label: "Manage promotions",
        hint: "Create / edit / delete promotional content across all surfaces.",
      },
    ],
  },
  {
    key: "settings",
    label: "Platform Settings",
    description:
      "Third-party config (Stripe, FCM, storage, etc.) + global platform behaviour.",
    actions: [
      {
        key: "settings.manage",
        label: "Manage platform settings",
        hint:
          "Edit third-party credentials, payment gateways, notification channels, theme. Dangerous — typically Owner-only.",
      },
    ],
  },
];

// Total count helper so the modal footer can render "x of N permissions".
export const TOTAL_PERMISSION_COUNT = PERMISSION_MODULES.reduce(
  (sum, mod) => sum + mod.actions.length,
  0,
);

// ── Preset role templates ──────────────────────────────────────────────────
// One-click apply. Mirror the most common rental-admin staffing tiers so
// the average admin doesn't have to think about it.

export type RolePreset = {
  key: string;
  label: string;
  description: string;
  permissions: EmployeePermission[];
};

export const ROLE_PRESETS: RolePreset[] = [
  {
    key: "owner",
    label: "Owner",
    description: "Full access to everything, including platform settings.",
    permissions: PERMISSION_MODULES.flatMap((m) => m.actions.map((a) => a.key)),
  },
  {
    key: "operations",
    label: "Operations Manager",
    description:
      "Day-to-day moderation: approves providers + cars, manages bookings + promotions. No platform settings.",
    permissions: [
      "employees.read",
      "roles.read",
      "providers.manage",
      "cars.manage",
      "bookings.manage",
      "promotions.manage",
    ],
  },
  {
    key: "support",
    label: "Customer Support",
    description:
      "Reads everything for triage, can manage bookings (cancellations, refunds). No staffing or settings.",
    permissions: [
      "employees.read",
      "roles.read",
      "bookings.manage",
    ],
  },
  {
    key: "finance",
    label: "Finance",
    description:
      "Reads providers + bookings for reconciliation. Manages promotions (coupon limits, cashback). No moderation.",
    permissions: [
      "employees.read",
      "roles.read",
      "bookings.manage",
      "promotions.manage",
    ],
  },
  {
    key: "read-only",
    label: "Read-only Auditor",
    description: "Can see everything, change nothing.",
    permissions: ["employees.read", "roles.read"],
  },
];

/** Find which preset (if any) exactly matches a given permission set. */
export function matchPreset(
  permissions: EmployeePermission[],
): RolePreset | null {
  const sorted = [...permissions].sort().join(",");
  return (
    ROLE_PRESETS.find(
      (p) => [...p.permissions].sort().join(",") === sorted,
    ) ?? null
  );
}
