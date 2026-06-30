"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, Edit2, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  createEmployeeRole,
  deleteEmployeeRole,
  listEmployeeRoles,
  updateEmployeeRole,
} from "@/src/lib/employeesApi";
import type { EmployeePermission, EmployeeRole } from "@/src/types/employee";
import {
  PERMISSION_MODULES,
  ROLE_PRESETS,
  TOTAL_PERMISSION_COUNT,
  matchPreset,
} from "@/src/lib/permissionCatalog";
import styles from "./styles";

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

  // Permission set is normalized through `recompute` so dependency rules
  // always hold: turning off X.read auto-removes X.create/update/delete,
  // and turning on X.create auto-adds X.read.
  const recompute = (set: EmployeePermission[]): EmployeePermission[] => {
    const out = new Set<EmployeePermission>(set);
    // Pass 1: add prerequisites for everything currently in the set.
    for (const mod of PERMISSION_MODULES) {
      for (const action of mod.actions) {
        if (action.requires && out.has(action.key)) out.add(action.requires);
      }
    }
    // Pass 2: remove children whose prerequisite isn't in the set.
    for (const mod of PERMISSION_MODULES) {
      for (const action of mod.actions) {
        if (action.requires && !out.has(action.requires)) out.delete(action.key);
      }
    }
    return Array.from(out);
  };

  const togglePermission = (permission: EmployeePermission) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(permission);
      const next = exists
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions: recompute(next) };
    });
  };

  const toggleModule = (moduleKey: string, on: boolean) => {
    const mod = PERMISSION_MODULES.find((m) => m.key === moduleKey);
    if (!mod) return;
    setForm((prev) => {
      const keys = mod.actions.map((a) => a.key);
      const next = on
        ? Array.from(new Set([...prev.permissions, ...keys]))
        : prev.permissions.filter((p) => !keys.includes(p));
      return { ...prev, permissions: recompute(next) };
    });
  };

  const selectAll = () => {
    setForm((prev) => ({
      ...prev,
      permissions: PERMISSION_MODULES.flatMap((m) => m.actions.map((a) => a.key)),
    }));
  };

  const clearAll = () => {
    setForm((prev) => ({ ...prev, permissions: [] }));
  };

  const applyPreset = (key: string) => {
    const preset = ROLE_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      permissions: recompute([...preset.permissions]),
      // Auto-fill name + description if blank so admin doesn't have to type.
      name: prev.name.trim() || preset.label,
      description: prev.description.trim() || preset.description,
    }));
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
        <div
          style={styles.modalOverlay}
          onClick={() => !saving && setOpenModal(false)}
        >
          <div
            style={{ ...styles.modalCard, ...m.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={m.header}>
              <h2 style={styles.modalTitle}>
                {editingRole ? "Edit Role" : "Add Role"}
              </h2>
              <button
                type="button"
                style={m.closeBtn}
                onClick={() => setOpenModal(false)}
                disabled={saving}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={m.body}>
              {/* Identity */}
              <div style={m.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Role name *</label>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Operations Manager"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Description</label>
                  <input
                    style={styles.input}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="What does someone with this role do?"
                  />
                </div>
              </div>

              {/* Preset templates */}
              <div>
                <label style={styles.label}>Start from a preset</label>
                <div style={m.presetRow}>
                  {ROLE_PRESETS.map((preset) => {
                    const active = matchPreset(form.permissions)?.key === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => applyPreset(preset.key)}
                        title={preset.description}
                        style={{
                          ...m.presetChip,
                          ...(active ? m.presetChipActive : {}),
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions header with master toggles */}
              <div style={m.permsHeader}>
                <div>
                  <label style={styles.label}>Permissions *</label>
                  <span style={m.summary}>
                    {form.permissions.length} of {TOTAL_PERMISSION_COUNT}{" "}
                    selected across{" "}
                    {
                      PERMISSION_MODULES.filter((mod) =>
                        mod.actions.some((a) =>
                          form.permissions.includes(a.key),
                        ),
                      ).length
                    }{" "}
                    module
                    {PERMISSION_MODULES.filter((mod) =>
                      mod.actions.some((a) => form.permissions.includes(a.key)),
                    ).length === 1
                      ? ""
                      : "s"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={m.linkBtn}
                    onClick={selectAll}
                  >
                    Select all
                  </button>
                  <span style={{ color: "var(--muted-foreground)" }}>·</span>
                  <button
                    type="button"
                    style={m.linkBtn}
                    onClick={clearAll}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Per-module groups */}
              <div style={m.modulesWrap}>
                {PERMISSION_MODULES.map((mod) => {
                  const allKeys = mod.actions.map((a) => a.key);
                  const checkedCount = allKeys.filter((k) =>
                    form.permissions.includes(k),
                  ).length;
                  const allOn = checkedCount === allKeys.length;
                  const someOn = checkedCount > 0 && !allOn;
                  return (
                    <div key={mod.key} style={m.moduleCard}>
                      <div style={m.moduleHead}>
                        <div>
                          <strong style={m.moduleTitle}>{mod.label}</strong>
                          <p style={m.moduleDesc}>{mod.description}</p>
                        </div>
                        <button
                          type="button"
                          style={{
                            ...m.moduleToggle,
                            ...(allOn ? m.moduleToggleAll : {}),
                          }}
                          onClick={() => toggleModule(mod.key, !allOn)}
                        >
                          {allOn ? "All on" : someOn ? `${checkedCount}/${allKeys.length}` : "All off"}
                        </button>
                      </div>
                      <div style={m.actionGrid}>
                        {mod.actions.map((action) => {
                          const checked = form.permissions.includes(action.key);
                          const requiresMissing =
                            action.requires &&
                            !form.permissions.includes(action.requires);
                          return (
                            <label
                              key={action.key}
                              style={{
                                ...m.actionRow,
                                borderColor: checked
                                  ? "color-mix(in srgb, var(--brand-primary) 45%, transparent)"
                                  : "var(--input-border)",
                                background: checked
                                  ? "color-mix(in srgb, var(--brand-primary) 8%, transparent)"
                                  : "var(--surface-1)",
                                opacity: requiresMissing ? 0.55 : 1,
                              }}
                              title={action.hint}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={requiresMissing && !checked}
                                onChange={() => togglePermission(action.key)}
                                style={{
                                  accentColor: "var(--brand-primary)",
                                  width: 16,
                                  height: 16,
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ display: "flex", flexDirection: "column" }}>
                                <span style={m.actionLabel}>{action.label}</span>
                                {action.hint ? (
                                  <span style={m.actionHint}>{action.hint}</span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...styles.modalActions, ...m.footer }}>
              <button
                style={styles.ghostBtn}
                onClick={() => setOpenModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                style={styles.actionBtn}
                onClick={() => void saveRole()}
                disabled={saving}
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Check size={14} /> Save Role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles for the rebuilt modal — token-only so they pick up theme
// changes. Kept here (not in styles.ts) because they're modal-specific.
const m: Record<string, CSSProperties> = {
  card: {
    width: "100%",
    maxWidth: 880,
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 22px",
    borderBottom: "1px solid var(--input-border)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "var(--muted-foreground)",
    padding: 6,
    borderRadius: 6,
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  footer: {
    padding: "14px 22px",
    borderTop: "1px solid var(--input-border)",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },

  presetRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  presetChip: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  presetChipActive: {
    background: "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
    color: "var(--brand-primary)",
    borderColor: "color-mix(in srgb, var(--brand-primary) 45%, transparent)",
  },

  permsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
    flexWrap: "wrap",
    paddingTop: 6,
    borderTop: "1px solid var(--input-border)",
  },
  summary: {
    display: "block",
    marginTop: 4,
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "var(--brand-primary)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: 0,
  },

  modulesWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  moduleCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-2)",
    overflow: "hidden",
  },
  moduleHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 14px",
    gap: 14,
    borderBottom: "1px solid var(--input-border)",
    background: "var(--surface-1)",
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  moduleDesc: {
    margin: "2px 0 0",
    fontSize: 12,
    color: "var(--muted-foreground)",
    maxWidth: 480,
  },
  moduleToggle: {
    padding: "4px 12px",
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "transparent",
    color: "var(--muted-foreground)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  moduleToggleAll: {
    background: "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
    color: "var(--brand-primary)",
    borderColor: "color-mix(in srgb, var(--brand-primary) 45%, transparent)",
  },
  actionGrid: {
    padding: 10,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 8,
  },
  actionRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 12px",
    border: "1px solid var(--input-border)",
    borderRadius: 10,
    cursor: "pointer",
    background: "var(--surface-1)",
  },
  actionLabel: { fontSize: 13, fontWeight: 600, color: "var(--foreground)" },
  actionHint: {
    fontSize: 11,
    color: "var(--muted-foreground)",
    marginTop: 2,
    lineHeight: 1.4,
  },
};
