export type EmployeeStatus = "ACTIVE" | "SUSPENDED";

export type EmployeePermission =
  | "employees.read"
  | "employees.create"
  | "employees.update"
  | "employees.suspend"
  | "roles.read"
  | "roles.create"
  | "roles.update"
  | "roles.delete"
  | "providers.manage"
  | "cars.manage"
  | "bookings.manage"
  | "promotions.manage"
  | "settings.manage";

export type EmployeeRole = {
  id: string;
  name: string;
  description: string;
  permissions: EmployeePermission[];
  isSystem?: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  nationality: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  roleId?: string | null;
  roleName?: string | null;
};

export type EmployeeListResponse = {
  items: Employee[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
