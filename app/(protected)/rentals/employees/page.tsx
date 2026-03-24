"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Ban, Download, Eye, Plus, RefreshCcw, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
  assignEmployeeRole,
  createEmployee,
  listEmployeeRoles,
  listEmployees,
  resetEmployeePassword,
  updateEmployeeStatus,
} from "@/src/lib/employeesApi";
import type { Employee, EmployeeRole } from "@/src/types/employee";
import styles from "./styles";

type EmployeeFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  nationality: string;
  dateOfBirth: string;
  roleId: string;
  password: string;
  sendInvite: boolean;
};

const DEFAULT_FORM: EmployeeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCountry: "+234",
  phoneNumber: "",
  nationality: "Nigeria",
  dateOfBirth: "1990-01-01",
  roleId: "",
  password: "",
  sendInvite: true,
};

function toCsvValue(input: string | number | boolean) {
  const value = String(input ?? "");
  return `"${value.replaceAll('"', '""')}"`;
}

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<EmployeeFormState>(DEFAULT_FORM);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [rolesResponse, employeesResponse] = await Promise.all([
        listEmployeeRoles(),
        listEmployees({
          q: search.trim() || undefined,
          isActive:
            statusFilter === "all"
              ? undefined
              : statusFilter === "active",
          roleId: roleFilter === "all" ? undefined : roleFilter,
          page: 1,
          limit: 100,
        }),
      ]);

      setRoles(rolesResponse);
      setRows(employeesResponse.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load employees";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadData();
    }, 250);

    return () => clearTimeout(t);
  }, [loadData]);

  const handleRoleAssign = async (employee: Employee, nextRoleId: string) => {
    if (!nextRoleId) {
      toast.error("Please select a valid role");
      return;
    }

    try {
      setProcessingKey(`${employee.id}:role`);
      await assignEmployeeRole(employee.id, nextRoleId);
      toast.success("Role assigned successfully");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign role";
      toast.error(message);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    try {
      setProcessingKey(`${employee.id}:status`);
      const response = await updateEmployeeStatus(employee.id, !employee.isActive);
      toast.success(response.message || "Employee status updated");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      toast.error(message);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleResetPassword = async (employee: Employee) => {
    try {
      setProcessingKey(`${employee.id}:reset`);
      const response = await resetEmployeePassword(employee.id, true);
      toast.success(response.message || "Password reset triggered");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleCreateEmployee = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phoneNumber || !form.roleId) {
      toast.error("First name, last name, email, phone number and role are required");
      return;
    }

    try {
      setProcessingKey("create");
      await createEmployee({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneCountry: form.phoneCountry,
        phoneNumber: form.phoneNumber,
        nationality: form.nationality,
        dateOfBirth: form.dateOfBirth,
        roleId: form.roleId,
        password: form.password || undefined,
        sendInvite: form.sendInvite,
      });

      toast.success("Employee created successfully");
      setForm(DEFAULT_FORM);
      setOpenCreate(false);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create employee";
      toast.error(message);
    } finally {
      setProcessingKey(null);
    }
  };

  const exportCsv = () => {
    const header = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Nationality",
      "Role",
      "Status",
      "Joined On",
    ];

    const lines = rows.map((row) =>
      [
        row.id,
        `${row.firstName} ${row.lastName}`.trim(),
        row.email,
        `${row.phoneCountry}${row.phoneNumber}`,
        row.nationality || "-",
        row.roleName || "Unassigned",
        row.isActive ? "ACTIVE" : "SUSPENDED",
        new Date(row.createdAt).toISOString(),
      ]
        .map(toCsvValue)
        .join(","),
    );

    const csv = [header.map(toCsvValue).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.setAttribute("download", "sureride-employees.csv");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Employee Management</h1>
          <p style={styles.subtitle}>Manage staff access, role assignment, and account status</p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.actionBtn} onClick={exportCsv}>
            <Download size={16} />
            Export
          </button>

          <button
            style={{ ...styles.actionBtn, ...styles.primaryBtn }}
            onClick={() => setOpenCreate(true)}
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      <div style={styles.filtersRow}>
        <div style={styles.searchBox}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee by name or email"
            style={styles.searchInput}
          />
          <div style={styles.searchIconWrap}>
            <Search size={18} />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter((e.target.value as "all" | "active" | "suspended") || "all")
          }
          style={styles.select}
        >
          <option value="all">Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={styles.select}
        >
          <option value="all">Role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>S/N</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.thRight}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={styles.empty}>Loading employees...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.empty}>No employees found.</td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const statusBusy = processingKey === `${row.id}:status`;
                  const resetBusy = processingKey === `${row.id}:reset`;
                  const roleBusy = processingKey === `${row.id}:role`;

                  return (
                    <tr key={row.id} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>{row.firstName} {row.lastName}</td>
                      <td style={styles.td}>{row.email}</td>
                      <td style={styles.td}>{row.phoneCountry}{row.phoneNumber}</td>

                      <td style={styles.td}>
                        <select
                          value={row.roleId || ""}
                          onChange={(e) => void handleRoleAssign(row, e.target.value)}
                          disabled={roleBusy}
                          style={styles.roleSelect}
                        >
                          <option value="" disabled>
                            Select role
                          </option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusPill,
                            ...(row.isActive ? styles.statusActive : styles.statusSuspended),
                          }}
                        >
                          {row.isActive ? "ACTIVE" : "SUSPENDED"}
                        </span>
                      </td>

                      <td style={styles.td}>{new Date(row.createdAt).toLocaleDateString()}</td>

                      <td style={styles.tdRight}>
                        <div style={styles.actions}>
                          <Link href={`/rentals/employees/${row.id}`} style={styles.smallActionBtn}>
                            <Eye size={14} />
                            View
                          </Link>

                          <button
                            style={{ ...styles.smallActionBtn, ...styles.resetBtn, opacity: resetBusy ? 0.65 : 1 }}
                            onClick={() => void handleResetPassword(row)}
                            disabled={resetBusy}
                          >
                            <RefreshCcw size={14} />
                            Reset Password
                          </button>

                          <button
                            style={{
                              ...styles.smallActionBtn,
                              ...(row.isActive ? styles.suspendBtn : styles.activateBtn),
                              opacity: statusBusy ? 0.65 : 1,
                            }}
                            onClick={() => void handleToggleStatus(row)}
                            disabled={statusBusy}
                          >
                            <Ban size={14} />
                            {row.isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openCreate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Add Employee</h2>

            <div style={styles.modalGrid}>
              <div style={styles.field}>
                <label style={styles.label}>First Name *</label>
                <input
                  style={styles.input}
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Last Name *</label>
                <input
                  style={styles.input}
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email *</label>
                <input
                  style={styles.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone Number *</label>
                <input
                  style={styles.input}
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone Country</label>
                <input
                  style={styles.input}
                  value={form.phoneCountry}
                  onChange={(e) => setForm((p) => ({ ...p, phoneCountry: e.target.value }))}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Nationality</label>
                <input
                  style={styles.input}
                  value={form.nationality}
                  onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Date of Birth *</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Role *</label>
                <select
                  style={styles.input}
                  value={form.roleId}
                  onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Temporary Password (Optional)</label>
                <input
                  style={styles.input}
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
            </div>

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.sendInvite}
                onChange={(e) => setForm((p) => ({ ...p, sendInvite: e.target.checked }))}
              />
              Send invite email immediately
            </label>

            <div style={styles.modalActions}>
              <button style={styles.ghostBtn} onClick={() => setOpenCreate(false)}>
                Cancel
              </button>
              <button
                style={{ ...styles.actionBtn, ...styles.primaryBtn, height: 40 }}
                onClick={() => void handleCreateEmployee()}
                disabled={processingKey === "create"}
              >
                {processingKey === "create" ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
