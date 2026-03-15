"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  approveAdminUserKyc,
  getAdminUser,
  rejectAdminUserKyc,
  updateAdminUserProfileStatus,
  updateAdminUserStatus,
  updateAdminUserVerification,
} from "@/src/lib/usersApi";
import type { AdminUser, UserKycStatus, UserProfileStatus } from "@/src/types/adminUser";
import styles from "./styles";

const PROFILE_STATUS_OPTIONS: UserProfileStatus[] = [
  "INCOMPLETE",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REJECTED",
];

type DisplayKycStatus = UserKycStatus | "NOT_SUBMITTED";

function toDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getKycStatus(user: AdminUser): DisplayKycStatus {
  const status = user.kyc?.status;
  if (status === "PENDING_VERIFICATION") return status;
  if (status === "VERIFIED") return status;
  if (status === "REJECTED") return status;
  return "NOT_SUBMITTED";
}

function resolveAssetUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
    return base ? `${base}${url}` : url;
  }
  return url;
}

export default function UserDetailsPage() {
  const params = useParams<{ userId: string }>();
  const userId = Array.isArray(params?.userId) ? params.userId[0] : params?.userId;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileStatus, setProfileStatus] = useState<UserProfileStatus>("INCOMPLETE");

  const loadUser = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getAdminUser(userId);
      setUser(response);
      setProfileStatus(response.profileStatus);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const fullName = useMemo(() => {
    if (!user) return "User";
    return `${user.firstName} ${user.lastName}`.trim() || "User";
  }, [user]);

  const kycStatus = useMemo<DisplayKycStatus>(() => {
    if (!user) return "NOT_SUBMITTED";
    return getKycStatus(user);
  }, [user]);

  const kycDocLinks = useMemo(() => {
    if (!user?.kyc) return [] as Array<{ label: string; url: string }>;

    const docs = [
      { label: "Passport Photo", key: "passportPhotoUrl" },
      { label: "Government ID Front", key: "governmentIdFrontUrl" },
      { label: "Government ID Back", key: "governmentIdBackUrl" },
      { label: "Driver License Front", key: "driverLicenseFrontUrl" },
      { label: "Driver License Back", key: "driverLicenseBackUrl" },
    ] as const;

    return docs
      .map((doc) => {
        const raw = user.kyc?.[doc.key];
        const url = typeof raw === "string" ? resolveAssetUrl(raw) : "";
        return { label: doc.label, url };
      })
      .filter((doc) => Boolean(doc.url));
  }, [user]);

  const handleToggleActive = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      const response = await updateAdminUserStatus(user.id, !user.isActive);
      toast.success(response.message || "User status updated");
      await loadUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!user) return;

    const nextVerified = !user.isVerified;

    try {
      setUpdating(true);
      const response = await updateAdminUserVerification(user.id, {
        isVerified: nextVerified,
        profileStatus: nextVerified ? "VERIFIED" : undefined,
      });
      toast.success(response.message || "User verification updated");
      await loadUser();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update verification";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleProfileStatusUpdate = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      const response = await updateAdminUserProfileStatus(user.id, profileStatus);
      toast.success(response.message || "Profile status updated");
      await loadUser();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile status";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveKyc = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      const response = await approveAdminUserKyc(user.id);
      toast.success(response.message || "KYC approved");
      await loadUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to approve KYC";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectKyc = async () => {
    if (!user) return;

    const reason = window.prompt("Reason for rejecting KYC:", "Document details do not match.");
    if (!reason || reason.trim().length < 2) return;

    try {
      setUpdating(true);
      const response = await rejectAdminUserKyc(user.id, reason.trim());
      toast.success(response.message || "KYC rejected");
      await loadUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject KYC";
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading user details...</div>;
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <Link href="/rentals/users" style={styles.topLink}>
          ← Back to Users
        </Link>
        <div style={styles.loading}>User not found.</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link href="/rentals/users" style={styles.topLink}>
        ← Back to Users
      </Link>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{fullName}</h1>
          <p style={styles.subtitle}>
            {user.email} • {user.phoneCountry}
            {user.phoneNumber}
          </p>
        </div>

        <div style={styles.actionRow}>
          {kycStatus === "PENDING_VERIFICATION" && (
            <>
              <button
                type="button"
                style={{
                  ...styles.actionBtn,
                  ...styles.kycApproveBtn,
                  opacity: updating ? 0.65 : 1,
                }}
                onClick={() => void handleApproveKyc()}
                disabled={updating}
              >
                Approve KYC
              </button>

              <button
                type="button"
                style={{
                  ...styles.actionBtn,
                  ...styles.kycRejectBtn,
                  opacity: updating ? 0.65 : 1,
                }}
                onClick={() => void handleRejectKyc()}
                disabled={updating}
              >
                Reject KYC
              </button>
            </>
          )}

          <button
            type="button"
            style={{
              ...styles.actionBtn,
              ...(user.isVerified ? styles.verifyBtn : undefined),
              opacity: updating ? 0.65 : 1,
            }}
            onClick={() => void handleToggleVerification()}
            disabled={updating}
          >
            {user.isVerified ? "Unverify User" : "Verify User"}
          </button>

          <button
            type="button"
            style={{
              ...styles.actionBtn,
              ...(user.isActive ? styles.suspendBtn : styles.activateBtn),
              opacity: updating ? 0.65 : 1,
            }}
            onClick={() => void handleToggleActive()}
            disabled={updating}
          >
            {user.isActive ? "Suspend User" : "Activate User"}
          </button>

          <select
            value={profileStatus}
            onChange={(e) => setProfileStatus(e.target.value as UserProfileStatus)}
            style={styles.select}
            disabled={updating}
          >
            {PROFILE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button
            type="button"
            style={{
              ...styles.actionBtn,
              opacity: updating ? 0.65 : 1,
            }}
            onClick={() => void handleProfileStatusUpdate()}
            disabled={updating}
          >
            Save Status
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Account</h2>

          <div style={styles.row}>
            <span style={styles.rowLabel}>User ID</span>
            <span style={styles.rowValue}>{user.id}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Email</span>
            <span style={styles.rowValue}>{user.email}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Profile Status</span>
            <span style={styles.rowValue}>{user.profileStatus}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>KYC Status</span>
            <span style={styles.rowValue}>{kycStatus}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Verification</span>
            <span style={styles.rowValue}>{user.isVerified ? "Verified" : "Unverified"}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Account Status</span>
            <span style={styles.rowValue}>{user.isActive ? "Active" : "Suspended"}</span>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Personal & Contact</h2>

          <div style={styles.row}>
            <span style={styles.rowLabel}>First Name</span>
            <span style={styles.rowValue}>{user.firstName}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Last Name</span>
            <span style={styles.rowValue}>{user.lastName}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Phone</span>
            <span style={styles.rowValue}>
              {user.phoneCountry}
              {user.phoneNumber}
            </span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Nationality</span>
            <span style={styles.rowValue}>{user.nationality || "-"}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Date of Birth</span>
            <span style={styles.rowValue}>{toDisplayDate(user.dateOfBirth)}</span>
          </div>
        </section>
      </div>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>KYC Details</h2>

        {user.kyc?.rejectionReason && (
          <div style={styles.block}>
            <span style={styles.muted}>Rejection Reason</span>
            <div style={styles.rowValue}>{user.kyc.rejectionReason}</div>
          </div>
        )}

        <div style={styles.docGrid}>
          {kycDocLinks.map((doc) => (
            <a
              key={doc.label}
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              style={styles.docLink}
            >
              Open {doc.label}
            </a>
          ))}
        </div>

        {kycDocLinks.length === 0 && (
          <span style={styles.muted}>No KYC documents available yet.</span>
        )}

        <div style={styles.block}>
          <pre style={styles.json}>
            {user.kyc ? JSON.stringify(user.kyc, null, 2) : "No KYC data available"}
          </pre>
        </div>

        <div style={styles.row}>
          <span style={styles.rowLabel}>Created</span>
          <span style={styles.rowValue}>{toDisplayDate(user.createdAt)}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.rowLabel}>Last Updated</span>
          <span style={styles.rowValue}>{toDisplayDate(user.updatedAt)}</span>
        </div>
      </section>
    </div>
  );
}
