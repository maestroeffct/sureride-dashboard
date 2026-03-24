"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  assignEmployeeRole,
  getEmployeeById,
  listEmployeeRoles,
  resetEmployeePassword,
  updateEmployeeStatus,
} from "@/src/lib/employeesApi";
import type { Employee, EmployeeRole } from "@/src/types/employee";
import styles from "./styles";

function toDisplayDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function EmployeeDetailsPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = Array.isArray(params?.employeeId)
    ? params.employeeId[0]
    : params?.employeeId;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadEmployee = useCallback(async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const [employeeResponse, rolesResponse] = await Promise.all([
        getEmployeeById(employeeId),
        listEmployeeRoles(),
      ]);

      setEmployee(employeeResponse);
      setRoles(rolesResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load employee";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  const fullName = useMemo(() => {
    if (!employee) return "Employee";
    return `${employee.firstName} ${employee.lastName}`.trim() || "Employee";
  }, [employee]);

  const selectedRole = useMemo(() => {
    if (!employee?.roleId) return null;
    return roles.find((role) => role.id === employee.roleId) ?? null;
  }, [employee?.roleId, roles]);

  const handleToggleStatus = async () => {
    if (!employee) return;

    try {
      setUpdating(true);
      const response = await updateEmployeeStatus(employee.id, !employee.isActive);
      toast.success(response.message || "Employee status updated");
      await loadEmployee();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!employee) return;

    try {
      setUpdating(true);
      const response = await resetEmployeePassword(employee.id, true);
      toast.success(response.message || "Password reset initiated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignRole = async (roleId: string) => {
    if (!employee || !roleId) return;

    try {
      setUpdating(true);
      const response = await assignEmployeeRole(employee.id, roleId);
      toast.success(response.message || "Role assigned");
      await loadEmployee();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign role";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading employee details...</div>;
  }

  if (!employee) {
    return (
      <div style={styles.page}>
        <Link href="/rentals/employees" style={styles.topLink}>
          ← Back to Employees
        </Link>
        <div style={styles.loading}>Employee not found.</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link href="/rentals/employees" style={styles.topLink}>
        ← Back to Employees
      </Link>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{fullName}</h1>
          <p style={styles.subtitle}>
            {employee.email} • {employee.phoneCountry}
            {employee.phoneNumber}
          </p>
        </div>

        <div style={styles.actionRow}>
          <button
            type="button"
            style={{
              ...styles.actionBtn,
              ...styles.resetBtn,
              opacity: updating ? 0.65 : 1,
            }}
            onClick={() => void handleResetPassword()}
            disabled={updating}
          >
            Reset Password
          </button>

          <button
            type="button"
            style={{
              ...styles.actionBtn,
              ...(employee.isActive ? styles.suspendBtn : styles.activateBtn),
              opacity: updating ? 0.65 : 1,
            }}
            onClick={() => void handleToggleStatus()}
            disabled={updating}
          >
            {employee.isActive ? "Suspend Employee" : "Activate Employee"}
          </button>

          <select
            value={employee.roleId || ""}
            onChange={(e) => void handleAssignRole(e.target.value)}
            style={styles.select}
            disabled={updating}
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
        </div>
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Account</h2>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Employee ID</span>
            <span style={styles.rowValue}>{employee.id}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Role</span>
            <span style={styles.rowValue}>{employee.roleName || "Unassigned"}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Status</span>
            <span style={styles.rowValue}>{employee.isActive ? "ACTIVE" : "SUSPENDED"}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Created</span>
            <span style={styles.rowValue}>{toDisplayDate(employee.createdAt)}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Last Updated</span>
            <span style={styles.rowValue}>{toDisplayDate(employee.updatedAt)}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Last Login</span>
            <span style={styles.rowValue}>{toDisplayDate(employee.lastLoginAt)}</span>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Profile</h2>

          <div style={styles.row}>
            <span style={styles.rowLabel}>First Name</span>
            <span style={styles.rowValue}>{employee.firstName || "-"}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Last Name</span>
            <span style={styles.rowValue}>{employee.lastName || "-"}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Email</span>
            <span style={styles.rowValue}>{employee.email}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Phone</span>
            <span style={styles.rowValue}>
              {employee.phoneCountry}
              {employee.phoneNumber}
            </span>
          </div>

          <div style={styles.row}>
            <span style={styles.rowLabel}>Nationality</span>
            <span style={styles.rowValue}>{employee.nationality || "-"}</span>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Role Permissions</h2>

          {selectedRole ? (
            <>
              <div style={styles.row}>
                <span style={styles.rowLabel}>Role</span>
                <span style={styles.rowValue}>{selectedRole.name}</span>
              </div>

              <p style={styles.muted}>{selectedRole.description || "No role description."}</p>

              <div style={styles.permissionWrap}>
                {selectedRole.permissions.map((permission) => (
                  <span key={permission} style={styles.permissionPill}>
                    {permission}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p style={styles.muted}>No role assigned to this employee.</p>
          )}
        </section>
      </div>
    </div>
  );
}
