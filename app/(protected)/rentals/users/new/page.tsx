"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { createAdminUser } from "@/src/lib/usersApi";
import type { UserProfileStatus } from "@/src/types/adminUser";
import styles from "./styles";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  password: string;
  isActive: boolean;
  isVerified: boolean;
  profileStatus: UserProfileStatus;
  sendInvite: boolean;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCountry: "+234",
  phoneNumber: "",
  dateOfBirth: "",
  nationality: "Nigeria",
  password: "",
  isActive: true,
  isVerified: false,
  profileStatus: "INCOMPLETE",
  sendInvite: true,
};

export default function AddUserPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.sendInvite && !form.password.trim()) {
      toast.error("Password is required when Send Invite is off");
      return;
    }

    if (!form.dateOfBirth) {
      toast.error("Date of birth is required");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createAdminUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneCountry: form.phoneCountry.trim(),
        phoneNumber: form.phoneNumber.trim(),
        dateOfBirth: form.dateOfBirth,
        nationality: form.nationality.trim(),
        password: form.password.trim() || undefined,
        isActive: form.isActive,
        isVerified: form.isVerified,
        profileStatus: form.profileStatus,
        sendInvite: form.sendInvite,
      });

      if (response.inviteEmailSent) {
        toast.success("User created and invite sent");
      } else {
        toast.success("User created");
      }

      router.push("/rentals/users");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <Link href="/rentals/users" style={styles.topLink}>
        ← Back to Users
      </Link>

      <div style={styles.header}>
        <h1 style={styles.title}>Add User</h1>
        <p style={styles.subtitle}>Create a user from admin dashboard</p>
      </div>

      <form style={styles.card} onSubmit={onSubmit}>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              style={styles.input}
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              style={styles.input}
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              style={styles.input}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="phoneCountry">Phone Country</label>
            <input
              id="phoneCountry"
              style={styles.input}
              value={form.phoneCountry}
              onChange={(e) => updateField("phoneCountry", e.target.value)}
              placeholder="+234"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              style={styles.input}
              value={form.phoneNumber}
              onChange={(e) => updateField("phoneNumber", e.target.value)}
              placeholder="8012345678"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              style={styles.input}
              value={form.dateOfBirth}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="nationality">Nationality</label>
            <input
              id="nationality"
              style={styles.input}
              value={form.nationality}
              onChange={(e) => updateField("nationality", e.target.value)}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="profileStatus">Profile Status</label>
            <select
              id="profileStatus"
              style={styles.select}
              value={form.profileStatus}
              onChange={(e) => updateField("profileStatus", e.target.value as UserProfileStatus)}
            >
              <option value="INCOMPLETE">INCOMPLETE</option>
              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Password (Optional)</label>
            <input
              id="password"
              type="password"
              style={styles.input}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Leave blank to auto-generate"
            />
          </div>
        </div>

        <div style={styles.checks}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.sendInvite}
              onChange={(e) => updateField("sendInvite", e.target.checked)}
            />
            <span>Send Invite Email</span>
          </label>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
            />
            <span>Active Account</span>
          </label>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={form.isVerified}
              onChange={(e) => updateField("isVerified", e.target.checked)}
            />
            <span>Verified User</span>
          </label>
        </div>

        <p style={styles.helper}>
          If <b>Send Invite Email</b> is disabled, you must enter a password.
        </p>

        <div style={styles.actions}>
          <Link href="/rentals/users" style={styles.btnSecondary}>Cancel</Link>

          <button type="submit" style={styles.btnPrimary} disabled={submitting}>
            {submitting ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
