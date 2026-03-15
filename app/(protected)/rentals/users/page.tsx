"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  approveAdminUserKyc,
  listAdminUsers,
  rejectAdminUserKyc,
  updateAdminUserStatus,
  updateAdminUserVerification,
} from "@/src/lib/usersApi";
import type {
  AdminUser,
  UserKycStatus,
  UserProfileStatus,
} from "@/src/types/adminUser";
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
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "suspended">("all");

  const [exportOpen, setExportOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await listAdminUsers({
        q: search.trim() || undefined,
        profileStatus: profileStatus || undefined,
        isVerified:
          verifiedFilter === "all"
            ? undefined
            : verifiedFilter === "verified",
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
  }, [activeFilter, profileStatus, search, verifiedFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadUsers();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadUsers]);

  const downloadableRows = useMemo(
    () =>
      rows.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: `${user.phoneCountry}${user.phoneNumber}`,
        nationality: user.nationality,
        profileStatus: user.profileStatus,
        kycStatus: normalizeKycStatusText(getKycStatus(user)),
        joinedOn: new Date(user.createdAt).toISOString(),
      })),
    [rows],
  );

  const exportCsv = () => {
    const header = [
      "ID",
      "Name",
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

          <Link href="/rentals/users/new" style={styles.actionBtn}>
            Add User
          </Link>
        </div>
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
          value={verifiedFilter}
          onChange={(e) =>
            setVerifiedFilter(
              (e.target.value as "all" | "verified" | "unverified") || "all",
            )
          }
          style={styles.select}
        >
          <option value="all">Verification</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
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
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>S/N</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone No</th>
                <th style={styles.th}>Nationality</th>
                <th style={styles.th}>Profile Status</th>
                <th style={styles.th}>KYC</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.thRight}>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={styles.empty}>
                    Loading users...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={styles.empty}>
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((user, index) => {
                  const kycStatus = getKycStatus(user);
                  const activeBusy = processingId === `${user.id}:active`;
                  const verifyBusy = processingId === `${user.id}:verify`;
                  const approveKycBusy = processingId === `${user.id}:kyc-approve`;
                  const rejectKycBusy = processingId === `${user.id}:kyc-reject`;
                  const kycBusy = approveKycBusy || rejectKycBusy;

                  return (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>{user.firstName} {user.lastName}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>{user.phoneCountry}{user.phoneNumber}</td>
                      <td style={styles.td}>{user.nationality || "-"}</td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusPill,
                            ...profilePillStyle(user.profileStatus),
                          }}
                        >
                          {user.profileStatus}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusPill,
                            ...kycPillStyle(kycStatus),
                          }}
                        >
                          {normalizeKycStatusText(kycStatus)}
                        </span>
                      </td>

                      <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString()}</td>

                      <td style={styles.tdRight}>
                        <div style={styles.actions}>
                          <Link href={`/rentals/users/${user.id}`} style={styles.actionBtn}>
                            <Eye size={14} />
                            <span>View</span>
                          </Link>

                          {kycStatus === "PENDING_VERIFICATION" && (
                            <>
                              <button
                                type="button"
                                style={{
                                  ...styles.actionBtn,
                                  ...styles.kycApproveBtn,
                                  opacity: kycBusy ? 0.65 : 1,
                                }}
                                onClick={() => void handleApproveKyc(user)}
                                disabled={kycBusy}
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve KYC</span>
                              </button>

                              <button
                                type="button"
                                style={{
                                  ...styles.actionBtn,
                                  ...styles.kycRejectBtn,
                                  opacity: kycBusy ? 0.65 : 1,
                                }}
                                onClick={() => void handleRejectKyc(user)}
                                disabled={kycBusy}
                              >
                                <XCircle size={14} />
                                <span>Reject KYC</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            style={{
                              ...styles.actionBtn,
                              ...styles.verifyBtn,
                              opacity: verifyBusy ? 0.65 : 1,
                            }}
                            onClick={() => void handleToggleVerification(user)}
                            disabled={verifyBusy}
                          >
                            <ShieldCheck size={14} />
                            <span>{user.isVerified ? "Unverify" : "Verify"}</span>
                          </button>

                          <button
                            type="button"
                            style={{
                              ...styles.actionBtn,
                              ...(user.isActive ? styles.suspendBtn : styles.activateBtn),
                              opacity: activeBusy ? 0.65 : 1,
                            }}
                            onClick={() => void handleToggleActive(user)}
                            disabled={activeBusy}
                          >
                            <Ban size={14} />
                            <span>{user.isActive ? "Suspend" : "Activate"}</span>
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
    </div>
  );
}
