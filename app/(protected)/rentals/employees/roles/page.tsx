"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  createEmployeeRole,
  deleteEmployeeRole,
  listEmployeeRoles,
  updateEmployeeRole,
} from "@/src/lib/employeesApi";
import type { EmployeePermission, EmployeeRole } from "@/src/types/employee";
import styles from "./styles";

const PERMISSION_OPTIONS: EmployeePermission[] = [
  "employees.read",
  "employees.create",
  "employees.update",
  "employees.suspend",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
  "providers.manage",
  "cars.manage",
  "bookings.manage",
  "promotions.manage",
  "settings.manage",
];

type RoleFormState = {
  name: string;
  description: string;
  permissions: EmployeePermission[];
};

const DEFAULT_FORM: RoleFormState = {
  name: "",
  description: "",
  permissions: ["employees.read", "roles.read"],
};

export default function EmployeeRolesPage() {
  const [rows, setRows] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingRole, setEditingRole] = useState<EmployeeRole | null>(null);
  const [form, setForm] = useState<RoleFormState>(DEFAULT_FORM);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listEmployeeRoles();
      setRows(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load roles";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((role) => {
      return (
        role.name.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q) ||
        role.permissions.some((permission) => permission.toLowerCase().includes(q))
      );
    });
  }, [rows, query]);

  const openCreate = () => {
    setEditingRole(null);
    setForm(DEFAULT_FORM);
    setOpenModal(true);
  };

  const openEdit = (role: EmployeeRole) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setOpenModal(true);
  };

  const togglePermission = (permission: EmployeePermission) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission],
      };
    });
  };

  const saveRole = async () => {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (form.permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    try {
      setSaving(true);

      if (editingRole) {
        await updateEmployeeRole(editingRole.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: form.permissions,
        });
        toast.success("Role updated");
      } else {
        await createEmployeeRole({
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: form.permissions,
        });
        toast.success("Role created");
      }

      setOpenModal(false);
      setForm(DEFAULT_FORM);
      await loadRoles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save role";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (role: EmployeeRole) => {
    if (role.isSystem) {
      toast.error("System role cannot be deleted");
      return;
    }

    const yes = window.confirm(`Delete role \"${role.name}\"?`);
    if (!yes) return;

    try {
      await deleteEmployeeRole(role.id);
      toast.success("Role deleted");
      await loadRoles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete role";
      toast.error(message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Employee Role</h1>
          <p style={styles.subtitle}>Create, edit and govern permission sets for employees</p>
        </div>

        <button style={styles.actionBtn} onClick={openCreate}>
          <Plus size={16} />
          Add Role
        </button>
      </div>

      <div style={styles.searchBox}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles by name, description or permission"
          style={styles.searchInput}
        />
        <div style={styles.searchIconWrap}>
          <Search size={18} />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>S/N</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Permissions</th>
                <th style={styles.th}>Members</th>
                <th style={styles.th}>Type</th>
                <th style={styles.thRight}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>Loading roles...</td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>No roles found.</td>
                </tr>
              ) : (
                visibleRows.map((row, index) => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{row.name}</td>
                    <td style={styles.td}>{row.description || "-"}</td>
                    <td style={styles.td}>
                      <div style={styles.permissionWrap}>
                        {row.permissions.slice(0, 3).map((permission) => (
                          <span key={permission} style={styles.permissionPill}>
                            {permission}
                          </span>
                        ))}
                        {row.permissions.length > 3 && (
                          <span style={styles.permissionPill}>
                            +{row.permissions.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>{row.userCount ?? 0}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.typePill,
                          ...(row.isSystem ? styles.typeSystem : styles.typeCustom),
                        }}
                      >
                        {row.isSystem ? "SYSTEM" : "CUSTOM"}
                      </span>
                    </td>
                    <td style={styles.tdRight}>
                      <div style={styles.actions}>
                        <button
                          style={{
                            ...styles.smallActionBtn,
                            opacity: row.isSystem ? 0.5 : 1,
                            cursor: row.isSystem ? "not-allowed" : "pointer",
                          }}
                          onClick={() => openEdit(row)}
                          disabled={row.isSystem}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          style={{
                            ...styles.smallActionBtn,
                            ...styles.deleteBtn,
                            opacity: row.isSystem ? 0.5 : 1,
                            cursor: row.isSystem ? "not-allowed" : "pointer",
                          }}
                          onClick={() => void removeRole(row)}
                          disabled={row.isSystem}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>{editingRole ? "Edit Role" : "Add Role"}</h2>

            <div style={styles.field}>
              <label style={styles.label}>Role Name *</label>
              <input
                style={styles.input}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea
                style={styles.textArea}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Permissions *</label>
              <div style={styles.permissionGrid}>
                {PERMISSION_OPTIONS.map((permission) => (
                  <label key={permission} style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.ghostBtn} onClick={() => setOpenModal(false)}>
                Cancel
              </button>
              <button
                style={styles.actionBtn}
                onClick={() => void saveRole()}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
