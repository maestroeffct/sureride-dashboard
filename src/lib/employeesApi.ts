import { apiRequest } from "@/src/lib/api";
import type {
  Employee,
  EmployeeListResponse,
  EmployeePermission,
  EmployeeRole,
} from "@/src/types/employee";

type ListEmployeesParams = {
  q?: string;
  isActive?: boolean;
  roleId?: string;
  page?: number;
  limit?: number;
};

type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  nationality: string;
  dateOfBirth: string;
  password?: string;
  roleId: string;
  sendInvite?: boolean;
};

type UpsertRolePayload = {
  name: string;
  description?: string;
  permissions: EmployeePermission[];
};

type ListEmployeeRolesResponse = EmployeeRole[];

type CreateEmployeeResponse = {
  message: string;
  employee: Employee;
  inviteEmailSent: boolean;
  temporaryPasswordGenerated: boolean;
};

function makeQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function listEmployeeRoles() {
  return apiRequest<ListEmployeeRolesResponse>("/admin/employee-roles");
}

export async function createEmployeeRole(payload: UpsertRolePayload) {
  return apiRequest<EmployeeRole>("/admin/employee-roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmployeeRole(roleId: string, payload: UpsertRolePayload) {
  return apiRequest<EmployeeRole>(`/admin/employee-roles/${roleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmployeeRole(roleId: string) {
  return apiRequest<{ message: string }>(`/admin/employee-roles/${roleId}`, {
    method: "DELETE",
  });
}

export async function listEmployees(
  params: ListEmployeesParams = {},
): Promise<EmployeeListResponse> {
  const query = makeQuery({
    q: params.q,
    isActive: params.isActive,
    roleId: params.roleId,
    page: params.page,
    limit: params.limit,
  });

  return apiRequest<EmployeeListResponse>(`/admin/employees${query}`);
}

export async function getEmployeeById(employeeId: string) {
  try {
    return await apiRequest<Employee>(`/admin/employees/${employeeId}`);
  } catch {
    const pageSize = 100;
    const firstPage = await listEmployees({ page: 1, limit: pageSize });
    const firstMatch = firstPage.items.find((item) => item.id === employeeId);

    if (firstMatch) return firstMatch;

    const maxPagesToScan = Math.min(firstPage.meta.totalPages || 1, 25);

    for (let page = 2; page <= maxPagesToScan; page += 1) {
      const response = await listEmployees({ page, limit: pageSize });
      const match = response.items.find((item) => item.id === employeeId);
      if (match) return match;
    }

    throw new Error("Employee not found");
  }
}

export async function createEmployee(payload: CreateEmployeePayload) {
  return apiRequest<CreateEmployeeResponse>("/admin/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function assignEmployeeRole(employeeId: string, roleId: string) {
  return apiRequest<{ message: string }>(
    `/admin/employees/${employeeId}/assign-role`,
    {
      method: "PATCH",
      body: JSON.stringify({ roleId }),
    },
  );
}

export async function resetEmployeePassword(employeeId: string, sendEmail = true) {
  return apiRequest<{ message: string }>(
    `/admin/employees/${employeeId}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({ sendEmail }),
    },
  );
}

export async function updateEmployeeStatus(employeeId: string, isActive: boolean) {
  return apiRequest<{ message: string }>(`/admin/employees/${employeeId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}
