"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  CheckCircle as CheckCircleAlt,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  Users as UsersIcon,
  UserCheck,
  UserPlus,
  Clock,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  approveAdminUserKyc,
  listAdminUsers,
  rejectAdminUserKyc,
  resetAdminUserPassword,
  updateAdminUserStatus,
  updateAdminUserVerification,
} from "@/src/lib/usersApi";
import type {
  AdminUser,
  UserKycStatus,
  UserProfileStatus,
} from "@/src/types/adminUser";
import AddUserModal from "@/src/components/rentals/users/AddUserModal";
import styles from "./styles";

const PROFILE_STATUS_OPTIONS: UserProfileStatus[] = [
  "INCOMPLETE",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
];

type DisplayKycStatus = UserKycStatus | "NOT_SUBMITTED";

function toCsvValue(input: string | number | boolean) {
  const value = String(input ?? "");
  return `"${value.replaceAll('"', '""')}"`;
}

function profilePillStyle(status: UserProfileStatus) {
  if (status === "VERIFIED") return styles.profileVerified;
  if (status === "PENDING_VERIFICATION") return styles.profilePending;
  if (status === "REJECTED") return styles.profileRejected;
  return styles.profileIncomplete;
}

function getKycStatus(user: AdminUser): DisplayKycStatus {
  const status = user.kyc?.status;
  if (status === "PENDING_VERIFICATION") return status;
  if (status === "VERIFIED") return status;
  if (status === "REJECTED") return status;
  return "NOT_SUBMITTED";
}

function kycPillStyle(status: DisplayKycStatus) {
  if (status === "VERIFIED") return styles.kycVerified;
  if (status === "PENDING_VERIFICATION") return styles.kycPending;
  if (status === "REJECTED") return styles.kycRejected;
  return styles.kycNone;
}

function normalizeKycStatusText(status: DisplayKycStatus) {
  if (status === "NOT_SUBMITTED") return "NOT_SUBMITTED";
  return status;
}

export default function UsersManagementPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [profileStatus, setProfileStatus] = useState<UserProfileStatus | "">("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "suspended">("all");
  // User Type filter — Authenticated = fully verified user, Guest = not yet.
  // Lets admin scope the list to onboarding-incomplete accounts when triaging.
  const [userTypeFilter, setUserTypeFilter] = useState<"all" | "authenticated" | "guest">("all");

  // Sort state — clickable headers cycle the same key asc → desc → asc.
  type SortKey = "name" | "type" | "joined";
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination — client-side over the loaded page (we already fetch up to 100).
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // 3-dot action menu — id of the row whose menu is open.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [sendResetEmail, setSendResetEmail] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Close the open kebab menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!openMenuId) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-row-menu]") && !target?.closest?.("[data-row-menu-trigger]")) {
        setOpenMenuId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  // Reset to page 1 whenever filters/search change so the user isn't stranded
  // on page 5 of a now 3-page result set.
  useEffect(() => {
    setPage(1);
  }, [search, profileStatus, activeFilter, userTypeFilter]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await listAdminUsers({
        q: search.trim() || undefined,
        profileStatus: profileStatus || undefined,
        isActive:
          activeFilter === "all"
            ? undefined
            : activeFilter === "active",
        page: 1,
        limit: 100,
      });

      setRows(response.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, profileStatus, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadUsers();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadUsers]);

  // Derive the user-type label used in the Type column + filter. Authenticated
  // = profile fully verified by KYC review. Anything else (incomplete signup,
  // pending review, rejected) reads as Guest in the admin's mental model.
  const userTypeOf = (user: AdminUser): "Authenticated" | "Guest" =>
    user.profileStatus === "VERIFIED" ? "Authenticated" : "Guest";

  const filteredRows = useMemo(() => {
    if (userTypeFilter === "all") return rows;
    return rows.filter((u) => userTypeOf(u).toLowerCase() === userTypeFilter);
  }, [rows, userTypeFilter]);

  const sortedRows = useMemo(() => {
    const arr = [...filteredRows];
    arr.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = `${a.firstName} ${a.lastName}`.toLowerCase();
        bv = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortKey === "type") {
        av = userTypeOf(a);
        bv = userTypeOf(b);
      } else {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredRows, sortKey, sortDir]);

  // KPI counts derived from the unfiltered `rows` so the tiles always reflect
  // the dataset, not the current filter view.
  const kpiCounts = useMemo(() => {
    let active = 0;
    let pending = 0;
    let authenticated = 0;
    for (const u of rows) {
      if (u.isActive) active += 1;
      if (u.profileStatus === "PENDING_VERIFICATION") pending += 1;
      if (u.profileStatus === "VERIFIED") authenticated += 1;
    }
    return { total: rows.length, active, pending, authenticated };
  }, [rows]);

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => sortedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedRows, safePage],
  );
  const rangeFrom = totalRows === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(totalRows, safePage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const downloadableRows = useMemo(
    () =>
      sortedRows.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        type: userTypeOf(user),
        verified: user.isVerified ? "Verified" : "Unverified",
        email: user.email,
        phone: `${user.phoneCountry}${user.phoneNumber}`,
        nationality: user.nationality,
        profileStatus: user.profileStatus,
        kycStatus: normalizeKycStatusText(getKycStatus(user)),
        joinedOn: new Date(user.createdAt).toISOString(),
      })),
    [sortedRows],
  );

  const exportCsv = () => {
    const header = [
      "ID",
      "Name",
      "Type",
      "Verified",
      "Email",
      "Phone No",
      "Nationality",
      "Profile Status",
      "KYC",
      "Joined On",
    ];

    const lines = downloadableRows.map((row) =>
      [
        row.id,
        row.name,
        row.type,
        row.verified,
        row.email,
        row.phone,
        row.nationality,
        row.profileStatus,
        row.kycStatus,
        row.joinedOn,
      ]
        .map(toCsvValue)
        .join(","),
    );

    const csv = [header.map(toCsvValue).join(","), ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = href;
    anchor.setAttribute("download", "sureride-users.csv");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);

    setExportOpen(false);
  };

  const handleToggleActive = async (user: AdminUser) => {
    const nextState = !user.isActive;
    try {
      setProcessingId(`${user.id}:active`);
      const response = await updateAdminUserStatus(user.id, nextState);
      toast.success(response.message || "User status updated");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVerification = async (user: AdminUser) => {
    const nextVerified = !user.isVerified;
    try {
      setProcessingId(`${user.id}:verify`);

      const response = await updateAdminUserVerification(user.id, {
        isVerified: nextVerified,
        profileStatus: nextVerified ? "VERIFIED" : undefined,
      });

      toast.success(response.message || "User verification updated");
      await loadUsers();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update verification";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveKyc = async (user: AdminUser) => {
    try {
      setProcessingId(`${user.id}:kyc-approve`);
      const response = await approveAdminUserKyc(user.id);
      toast.success(response.message || "KYC approved");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to approve KYC";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectKyc = async (user: AdminUser) => {
    const reason = window.prompt("Reason for rejecting KYC:", "Document details do not match.");
    if (!reason || reason.trim().length < 2) return;

    try {
      setProcessingId(`${user.id}:kyc-reject`);
      const response = await rejectAdminUserKyc(user.id, reason.trim());
      toast.success(response.message || "KYC rejected");
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject KYC";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };


  const handleResetPassword = async () => {
    if (!resetTarget) return;

    try {
      setProcessingId(`${resetTarget.id}:reset-password`);
      const response = await resetAdminUserPassword(resetTarget.id, {
        sendEmail: sendResetEmail,
      });
      const expiry = response.temporaryPasswordExpiresAt
        ? new Date(response.temporaryPasswordExpiresAt).toLocaleString()
        : null;

      toast.success(
        response.emailSent
          ? `Temporary password sent by email${expiry ? ` and expires ${expiry}` : ""}.`
          : `Password reset initiated${expiry ? `. Temporary password expires ${expiry}` : "."}`,
      );
      setResetTarget(null);
      setSendResetEmail(true);
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Users Management</h1>
          <p style={styles.subtitle}>Manage users, verification and KYC reviews</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.exportWrap}>
            <button
              type="button"
              style={styles.exportButton}
              onClick={() => setExportOpen((v) => !v)}
            >
              <Download size={16} />
              <span>Export</span>
              <ChevronDown size={16} />
            </button>

            {exportOpen && (
              <div style={styles.exportDropdown}>
                <button style={styles.exportItem} onClick={exportCsv}>
                  Export CSV
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            style={addUserBtn}
            onClick={() => setAddOpen(true)}
          >
            <UserPlus size={15} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div style={kpiGrid}>
        <UserKpiCard
          label="Total Users"
          value={kpiCounts.total}
          hint="All users in database"
          icon={<UsersIcon size={16} />}
        />
        <UserKpiCard
          label="Active"
          value={kpiCounts.active}
          hint="Currently active users"
          icon={<CheckCircleAlt size={16} />}
        />
        <UserKpiCard
          label="Authenticated"
          value={kpiCounts.authenticated}
          hint="Profile fully verified"
          icon={<UserCheck size={16} />}
        />
        <UserKpiCard
          label="Pending Review"
          value={kpiCounts.pending}
          hint="KYC awaiting admin"
          icon={<Clock size={16} />}
        />
      </div>

      <div style={styles.filtersRow}>
        <div style={styles.searchBox}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email"
            style={styles.searchInput}
          />

          <div style={styles.searchIconWrap}>
            <Search size={18} />
          </div>
        </div>

        <select
          value={profileStatus}
          onChange={(e) =>
            setProfileStatus((e.target.value as UserProfileStatus | "") || "")
          }
          style={styles.select}
        >
          <option value="">Profile Status</option>
          {PROFILE_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(e) =>
            setActiveFilter(
              (e.target.value as "all" | "active" | "suspended") || "all",
            )
          }
          style={styles.select}
        >
          <option value="all">Account Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={userTypeFilter}
          onChange={(e) =>
            setUserTypeFilter(
              (e.target.value as "all" | "authenticated" | "guest") || "all",
            )
          }
          style={styles.select}
        >
          <option value="all">User Type</option>
          <option value="authenticated">Authenticated</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th
                  style={{ ...styles.th, cursor: "pointer" }}
                  onClick={() => toggleSort("name")}
                >
                  <SortHeader label="Name" active={sortKey === "name"} dir={sortDir} />
                </th>
                <th
                  style={{ ...styles.th, cursor: "pointer" }}
                  onClick={() => toggleSort("type")}
                >
                  <SortHeader label="Type" active={sortKey === "type"} dir={sortDir} />
                </th>
                <th style={styles.th}>Verified</th>
                <th style={styles.th}>Contact</th>
                <th
                  style={{ ...styles.th, cursor: "pointer" }}
                  onClick={() => toggleSort("joined")}
                >
                  <SortHeader label="Joined" active={sortKey === "joined"} dir={sortDir} />
                </th>
                <th style={styles.th}>View</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    Loading users...
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    No users found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((user) => {
                  const kycStatus = getKycStatus(user);
                  const type = userTypeOf(user);
                  const menuOpen = openMenuId === user.id;
                  const anyBusy =
                    processingId === `${user.id}:active` ||
                    processingId === `${user.id}:verify` ||
                    processingId === `${user.id}:reset-password` ||
                    processingId === `${user.id}:kyc-approve` ||
                    processingId === `${user.id}:kyc-reject`;

                  return (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong style={{ fontWeight: 600 }}>
                          {user.firstName} {user.lastName}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            type === "Authenticated"
                              ? typePillAuthenticated
                              : typePillGuest
                          }
                        >
                          {type}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={
                            user.isVerified
                              ? verifiedTextYes
                              : verifiedTextNo
                          }
                        >
                          {user.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={contactStack}>
                          <span style={contactLine}>
                            <Mail size={12} /> {user.email}
                          </span>
                          {user.phoneNumber ? (
                            <span style={contactLineMuted}>
                              <Phone size={12} /> {user.phoneCountry}
                              {user.phoneNumber}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      <td style={styles.td}>
                        <Link
                          href={`/rentals/users/${user.id}`}
                          style={styles.actionBtn}
                          title="View user"
                        >
                          <Eye size={15} />
                        </Link>
                      </td>

                      <td style={styles.tdRight}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <button
                            type="button"
                            data-row-menu-trigger
                            style={styles.actionBtn}
                            title="More actions"
                            disabled={anyBusy}
                            onClick={() =>
                              setOpenMenuId(menuOpen ? null : user.id)
                            }
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {menuOpen ? (
                            <div data-row-menu style={kebabMenu}>
                              <Link
                                href={`/rentals/users/${user.id}`}
                                style={kebabItem}
                                onClick={() => setOpenMenuId(null)}
                              >
                                <Pencil size={14} /> Edit
                              </Link>
                              {!user.isVerified ? (
                                <button
                                  type="button"
                                  style={kebabItem}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    void handleToggleVerification(user);
                                  }}
                                >
                                  <ShieldCheck size={14} /> Start Verification
                                </button>
                              ) : null}
                              {kycStatus === "PENDING_VERIFICATION" ? (
                                <>
                                  <button
                                    type="button"
                                    style={kebabItem}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      void handleApproveKyc(user);
                                    }}
                                  >
                                    <CheckCircleAlt size={14} /> Approve KYC
                                  </button>
                                  <button
                                    type="button"
                                    style={kebabItem}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      void handleRejectKyc(user);
                                    }}
                                  >
                                    <XCircle size={14} /> Reject KYC
                                  </button>
                                </>
                              ) : null}
                              <button
                                type="button"
                                style={kebabItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setResetTarget(user);
                                  setSendResetEmail(true);
                                }}
                              >
                                <KeyRound size={14} /> Reset Password
                              </button>
                              <div style={kebabDivider} />
                              <button
                                type="button"
                                style={{ ...kebabItem, ...kebabItemDanger }}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  void handleToggleActive(user);
                                }}
                              >
                                <Ban size={14} />{" "}
                                {user.isActive ? "Block User" : "Unblock User"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: count summary + paginator. Hidden while loading so
            "Showing 0-0 of 0" doesn't flash before data lands. */}
        {!loading ? (
          <div style={footerRow}>
            <span style={footerCount}>
              Showing {rangeFrom}-{rangeTo} of {totalRows} users
            </span>
            <div style={pagerWrap}>
              <button
                type="button"
                style={{
                  ...pagerBtn,
                  opacity: safePage <= 1 ? 0.45 : 1,
                  cursor: safePage <= 1 ? "default" : "pointer",
                }}
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={pagerLabel}>
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                style={{
                  ...pagerBtn,
                  opacity: safePage >= totalPages ? 0.45 : 1,
                  cursor: safePage >= totalPages ? "default" : "pointer",
                }}
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>


      {resetTarget ? (
        <div style={styles.modalOverlay}>
          <div style={styles.resetModal}>
            <div style={styles.resetModalHeader}>
              <h3 style={styles.resetModalTitle}>Reset User Password</h3>
              <p style={styles.resetModalText}>
                Reset password for <strong>{resetTarget.firstName} {resetTarget.lastName}</strong>.
                This will invalidate the user&apos;s active sessions and issue a temporary password.
              </p>
            </div>

            <label style={styles.resetOptionRow}>
              <input
                type="checkbox"
                checked={sendResetEmail}
                onChange={(event) => setSendResetEmail(event.target.checked)}
                style={styles.resetCheckbox}
              />
              <span style={styles.resetOptionText}>
                Email the temporary password to the user immediately
              </span>
            </label>

            <p style={styles.resetHint}>
              {sendResetEmail
                ? "The backend will attempt to send the temporary password by email."
                : "The password will be reset without email delivery. Use this only if you have another secure channel."}
            </p>

            <div style={styles.resetModalActions}>
              <button
                type="button"
                style={styles.resetCancelBtn}
                onClick={() => {
                  if (processingId === `${resetTarget.id}:reset-password`) return;
                  setResetTarget(null);
                  setSendResetEmail(true);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.resetConfirmBtn}
                onClick={() => void handleResetPassword()}
                disabled={processingId === `${resetTarget.id}:reset-password`}
              >
                {processingId === `${resetTarget.id}:reset-password` ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => void loadUsers()}
      />
    </div>
  );
}

// ── KPI tile ────────────────────────────────────────────────────────────────
function UserKpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <article style={kpiCard}>
      <div style={kpiCardHeader}>
        <span style={kpiCardLabel}>{label}</span>
        <span style={kpiCardIcon}>{icon}</span>
      </div>
      <strong style={kpiCardValue}>{value}</strong>
      <span style={kpiCardHint}>{hint}</span>
    </article>
  );
}

// ── Sortable column header ──────────────────────────────────────────────────
function SortHeader({
  label,
  active,
  dir,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {label}
      <span
        style={{
          display: "inline-flex",
          flexDirection: "column",
          lineHeight: 0.6,
          opacity: active ? 1 : 0.35,
        }}
      >
        <ChevronUp size={9} strokeWidth={3} color={active && dir === "asc" ? "var(--brand-primary)" : "currentColor"} />
        <ChevronDown size={9} strokeWidth={3} color={active && dir === "desc" ? "var(--brand-primary)" : "currentColor"} />
      </span>
    </span>
  );
}

// ── Inline styles used only by the new column layout ────────────────────────
const typePillBase: CSSPropertiesShort = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};
const typePillAuthenticated: CSSPropertiesShort = {
  ...typePillBase,
  background: "rgba(34,197,94,0.12)",
  color: "var(--brand-secondary)",
};
const typePillGuest: CSSPropertiesShort = {
  ...typePillBase,
  background: "var(--surface-2)",
  color: "var(--muted-foreground)",
  border: "1px solid var(--input-border)",
};
const verifiedTextYes: CSSPropertiesShort = {
  color: "var(--brand-secondary)",
  fontSize: 13,
  fontWeight: 600,
};
const verifiedTextNo: CSSPropertiesShort = {
  color: "var(--muted-foreground)",
  fontSize: 13,
};
const contactStack: CSSPropertiesShort = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const contactLine: CSSPropertiesShort = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  color: "var(--foreground)",
};
const contactLineMuted: CSSPropertiesShort = {
  ...contactLine,
  color: "var(--muted-foreground)",
  fontSize: 12,
};

const kebabMenu: CSSPropertiesShort = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 4px)",
  background: "var(--surface-1)",
  border: "1px solid var(--input-border)",
  borderRadius: 10,
  padding: 6,
  minWidth: 200,
  zIndex: 5,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};
const kebabItem: CSSPropertiesShort = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 6,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--foreground)",
  fontSize: 13,
  textAlign: "left",
  textDecoration: "none",
  width: "100%",
};
const kebabItemDanger: CSSPropertiesShort = {
  color: "#f87171",
};
const kebabDivider: CSSPropertiesShort = {
  height: 1,
  background: "var(--input-border)",
  margin: "4px 0",
};

const footerRow: CSSPropertiesShort = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 18px",
  borderTop: "1px solid var(--input-border)",
};
const footerCount: CSSPropertiesShort = {
  fontSize: 13,
  color: "var(--muted-foreground)",
};
const pagerWrap: CSSPropertiesShort = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};
const pagerBtn: CSSPropertiesShort = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "1px solid var(--input-border)",
  background: "var(--surface-1)",
  color: "var(--foreground)",
  fontSize: 13,
  fontWeight: 600,
};
const pagerLabel: CSSPropertiesShort = {
  fontSize: 13,
  color: "var(--muted-foreground)",
};

// Local alias so we don't have to import CSSProperties from react in this file
// (it's already imported via the top-of-file styles barrel).
type CSSPropertiesShort = React.CSSProperties;

// KPI tile styles — token-only (no gradients) so they sit cleanly next to the
// rest of the admin design system.
const kpiGrid: CSSPropertiesShort = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};
const kpiCard: CSSPropertiesShort = {
  background: "var(--surface-1)",
  border: "1px solid var(--input-border)",
  borderRadius: 14,
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
const kpiCardHeader: CSSPropertiesShort = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const kpiCardLabel: CSSPropertiesShort = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};
const kpiCardIcon: CSSPropertiesShort = {
  display: "inline-flex",
  width: 28,
  height: 28,
  borderRadius: 8,
  background: "var(--surface-2)",
  color: "var(--brand-primary)",
  alignItems: "center",
  justifyContent: "center",
};
const kpiCardValue: CSSPropertiesShort = {
  fontSize: 28,
  fontWeight: 700,
  color: "var(--foreground)",
  lineHeight: 1.1,
};
const kpiCardHint: CSSPropertiesShort = {
  fontSize: 12,
  color: "var(--muted-foreground)",
};

// Add User — proper text CTA. The earlier `styles.actionBtn` is a 32×32
// icon-only square, so the label was crammed and unreadable. This mirrors
// the mint-green primary used elsewhere (Save Working Hours, Banners).
const addUserBtn: CSSPropertiesShort = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  height: 44,
  padding: "0 18px",
  borderRadius: 12,
  border: "none",
  background: "var(--brand-secondary)",
  color: "#022c22",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
