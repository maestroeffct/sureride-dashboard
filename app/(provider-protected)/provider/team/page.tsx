"use client";

import { useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  listProviderStaff,
  inviteProviderStaff,
  resendProviderStaffInvite,
  updateProviderStaffRole,
  updateProviderStaffStatus,
  deleteProviderStaff,
  type ProviderStaffMember,
  type ProviderStaffRole,
} from "@/src/lib/providerApi";

// ── Zod schema (client) ──────────────────────────────────────────────────────
const InviteSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || v.length >= 7,
      "Phone number is too short",
    ),
  role: z.enum([
    "FLEET_MANAGER",
    "OPERATIONS",
    "FINANCE",
    "CUSTOMER_SERVICE",
  ]),
});

type InviteForm = z.infer<typeof InviteSchema>;

const ROLE_LABEL: Record<ProviderStaffRole, string> = {
  OWNER: "Owner",
  FLEET_MANAGER: "Fleet Manager",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  CUSTOMER_SERVICE: "Customer Service",
};

const ASSIGNABLE_ROLES: Exclude<ProviderStaffRole, "OWNER">[] = [
  "FLEET_MANAGER",
  "OPERATIONS",
  "FINANCE",
  "CUSTOMER_SERVICE",
];

const EMPTY_FORM: InviteForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "OPERATIONS",
};

export default function ProviderTeamPage() {
  const [staff, setStaff] = useState<ProviderStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<InviteForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InviteForm, string>>>({});

  const load = async () => {
    try {
      setLoading(true);
      const list = await listProviderStaff();
      setStaff(list);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load staff",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = InviteSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof InviteForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof InviteForm;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});

    try {
      setSubmitting(true);
      await inviteProviderStaff({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone || undefined,
        role: parsed.data.role,
      });
      toast.success("Invitation sent");
      setForm(EMPTY_FORM);
      void load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send invitation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resendProviderStaffInvite(id);
      toast.success("Invite resent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    }
  };

  const handleRoleChange = async (
    id: string,
    role: Exclude<ProviderStaffRole, "OWNER">,
  ) => {
    try {
      await updateProviderStaffRole(id, role);
      toast.success("Role updated");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleStatusToggle = async (m: ProviderStaffMember) => {
    if (m.status === "PENDING") return;
    const next = m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateProviderStaffStatus(m.id, next);
      toast.success(next === "SUSPENDED" ? "Member suspended" : "Member reinstated");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this team member? This cannot be undone.")) return;
    try {
      await deleteProviderStaff(id);
      toast.success("Removed");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const setField = <K extends keyof InviteForm>(k: K, v: InviteForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>Team</h1>
        <p style={s.subtitle}>
          Invite people to help run your business. They'll get an email with a
          one-time setup link.
        </p>
      </header>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Invite a team member</h2>
        <form style={s.form} onSubmit={handleInvite} noValidate>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>First name</label>
              <input
                style={{ ...s.input, ...(errors.firstName ? s.inputError : {}) }}
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                placeholder="Jane"
              />
              {errors.firstName && <span style={s.err}>{errors.firstName}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Last name</label>
              <input
                style={{ ...s.input, ...(errors.lastName ? s.inputError : {}) }}
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                placeholder="Doe"
              />
              {errors.lastName && <span style={s.err}>{errors.lastName}</span>}
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                type="email"
                style={{ ...s.input, ...(errors.email ? s.inputError : {}) }}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="jane@company.com"
              />
              {errors.email && <span style={s.err}>{errors.email}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone (optional)</label>
              <input
                style={{ ...s.input, ...(errors.phone ? s.inputError : {}) }}
                value={form.phone ?? ""}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+234 801 234 5678"
              />
              {errors.phone && <span style={s.err}>{errors.phone}</span>}
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Role</label>
            <select
              style={s.input}
              value={form.role}
              onChange={(e) =>
                setField("role", e.target.value as InviteForm["role"])
              }
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <span style={s.help}>
              {form.role === "FLEET_MANAGER" &&
                "Can manage cars, locations and insurance."}
              {form.role === "OPERATIONS" &&
                "Can view fleet and manage bookings."}
              {form.role === "FINANCE" &&
                "Can manage payouts, earnings and insurance."}
              {form.role === "CUSTOMER_SERVICE" &&
                "Can view and update bookings."}
            </span>
          </div>

          <button style={s.primaryBtn} type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send invitation"}
          </button>
        </form>
      </section>

      <section style={s.card}>
        <h2 style={s.cardTitle}>Members</h2>
        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : staff.length === 0 ? (
          <div style={s.empty}>
            No team members yet. Invite someone above to get started.
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((m) => (
                  <tr key={m.id}>
                    <td style={s.td}>
                      {m.firstName} {m.lastName}
                    </td>
                    <td style={s.td}>{m.email}</td>
                    <td style={s.td}>
                      <select
                        style={s.smallSelect}
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(
                            m.id,
                            e.target.value as Exclude<ProviderStaffRole, "OWNER">,
                          )
                        }
                        disabled={m.role === "OWNER"}
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={s.td}>
                      <span style={statusStyle(m.status)}>{m.status}</span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        {m.status === "PENDING" && (
                          <button
                            style={s.linkBtn}
                            onClick={() => handleResend(m.id)}
                          >
                            Resend invite
                          </button>
                        )}
                        {m.status !== "PENDING" && (
                          <button
                            style={s.linkBtn}
                            onClick={() => handleStatusToggle(m)}
                          >
                            {m.status === "ACTIVE" ? "Suspend" : "Reinstate"}
                          </button>
                        )}
                        <button
                          style={{ ...s.linkBtn, color: "#b91c1c" }}
                          onClick={() => handleDelete(m.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function statusStyle(status: ProviderStaffMember["status"]): CSSProperties {
  const palette: Record<ProviderStaffMember["status"], { bg: string; fg: string }> = {
    PENDING: { bg: "#fef3c7", fg: "#92400e" },
    ACTIVE: { bg: "#dcfce7", fg: "#166534" },
    SUSPENDED: { bg: "#fee2e2", fg: "#991b1b" },
  };
  const c = palette[status];
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    background: c.bg,
    color: c.fg,
    fontSize: 12,
    fontWeight: 600,
  };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 24, maxWidth: 920 },
  header: { display: "flex", flexDirection: "column", gap: 4 },
  title: { fontSize: 26, fontWeight: 700, margin: 0 },
  subtitle: { color: "#475569", margin: 0 },
  card: {
    background: "var(--card-bg, #fff)",
    border: "1px solid var(--input-border, #e5e7eb)",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#334155" },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border, #d1d5db)",
    fontSize: 14,
    outline: "none",
  },
  inputError: { borderColor: "#dc2626" },
  err: { fontSize: 12, color: "#dc2626" },
  help: { fontSize: 12, color: "#64748b" },
  primaryBtn: {
    alignSelf: "flex-start",
    padding: "10px 18px",
    borderRadius: 10,
    background: "var(--brand-primary, #2563eb)",
    color: "#fff",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
  empty: { color: "#64748b", padding: "20px 0", textAlign: "center" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    padding: "10px 8px",
    borderBottom: "1px solid var(--input-border, #e5e7eb)",
  },
  td: {
    padding: "12px 8px",
    fontSize: 14,
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  smallSelect: {
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid var(--input-border, #d1d5db)",
    fontSize: 13,
  },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 500,
    padding: 0,
    fontSize: 13,
  },
};
