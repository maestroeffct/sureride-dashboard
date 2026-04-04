"use client";

import {
  Suspense,
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  changeProviderPassword,
  getProviderProfile,
  updateProviderProfile,
  type ProviderProfile,
} from "@/src/lib/providerApi";

type ProfileForm = {
  name: string;
  phone: string;
  contactPersonName: string;
  contactPersonRole: string;
  contactPersonPhone: string;
  businessAddress: string;
};

const emptyForm: ProfileForm = {
  name: "",
  phone: "",
  contactPersonName: "",
  contactPersonRole: "",
  contactPersonPhone: "",
  businessAddress: "",
};

function mapProfileToForm(profile: ProviderProfile): ProfileForm {
  return {
    name: profile.name || "",
    phone: profile.phone || "",
    contactPersonName: profile.contactPersonName || "",
    contactPersonRole: profile.contactPersonRole || "",
    contactPersonPhone: profile.contactPersonPhone || "",
    businessAddress: profile.businessAddress || "",
  };
}

function ProviderSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const forcePasswordChange = useMemo(
    () => searchParams.get("forcePasswordChange") === "1",
    [searchParams],
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getProviderProfile();
        setProfile(response);
        setForm(mapProfileToForm(response));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load provider profile",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const response = await updateProviderProfile(form);
      setProfile(response.provider);
      setForm(mapProfileToForm(response.provider));

      const rawSession = localStorage.getItem("sureride_provider_user");
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as Record<string, unknown>;
        localStorage.setItem(
          "sureride_provider_user",
          JSON.stringify({
            ...parsed,
            name: response.provider.name,
            email: response.provider.email,
          }),
        );
      }

      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Complete the password form");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSavingPassword(true);
      const response = await changeProviderPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(response.message);

      if (forcePasswordChange || profile?.mustChangePassword) {
        router.replace("/provider");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading provider settings...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Provider Portal</p>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>
            Update your business profile and keep provider login credentials current.
          </p>
        </div>
        {(forcePasswordChange || profile?.mustChangePassword) && (
          <div style={styles.alert}>
            Your account is using a temporary password. Change it before continuing.
          </div>
        )}
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Business Profile</h2>

          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Business Name</span>
              <input
                style={styles.input}
                value={form.name}
                onChange={(event) => handleProfileChange("name", event.target.value)}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Business Email</span>
              <input style={styles.inputReadOnly} value={profile?.email || ""} readOnly />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Phone</span>
              <input
                style={styles.input}
                value={form.phone}
                onChange={(event) => handleProfileChange("phone", event.target.value)}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Business Address</span>
              <input
                style={styles.input}
                value={form.businessAddress}
                onChange={(event) =>
                  handleProfileChange("businessAddress", event.target.value)
                }
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Contact Person</span>
              <input
                style={styles.input}
                value={form.contactPersonName}
                onChange={(event) =>
                  handleProfileChange("contactPersonName", event.target.value)
                }
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Contact Role</span>
              <input
                style={styles.input}
                value={form.contactPersonRole}
                onChange={(event) =>
                  handleProfileChange("contactPersonRole", event.target.value)
                }
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Contact Phone</span>
              <input
                style={styles.input}
                value={form.contactPersonPhone}
                onChange={(event) =>
                  handleProfileChange("contactPersonPhone", event.target.value)
                }
              />
            </label>
          </div>

          <button
            type="button"
            style={styles.primaryButton}
            disabled={savingProfile}
            onClick={handleSaveProfile}
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Security</h2>
          <p style={styles.sectionText}>
            Use this form to replace a temporary password or rotate your current one.
          </p>

          <label style={styles.field}>
            <span style={styles.label}>Current Password</span>
            <input
              style={styles.input}
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>New Password</span>
            <input
              style={styles.input}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Confirm New Password</span>
            <input
              style={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          <button
            type="button"
            style={styles.primaryButton}
            disabled={savingPassword}
            onClick={handleChangePassword}
          >
            {savingPassword ? "Updating..." : "Change Password"}
          </button>
        </section>
      </div>
    </div>
  );
}

export default function ProviderSettingsPage() {
  return (
    <Suspense fallback={<div style={styles.loading}>Loading provider settings...</div>}>
      <ProviderSettingsContent />
    </Suspense>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  loading: {
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    color: "#0f766e",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    margin: "6px 0 8px",
    fontSize: 30,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    maxWidth: 720,
  },
  alert: {
    maxWidth: 360,
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fef3c7",
    color: "#92400e",
    fontSize: 13,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
  },
  card: {
    background: "var(--card, #ffffff)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: 20,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },
  sectionText: {
    margin: 0,
    color: "#64748b",
    fontSize: 14,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    padding: "0 12px",
    fontSize: 14,
    background: "#ffffff",
  },
  inputReadOnly: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    padding: "0 12px",
    fontSize: 14,
    background: "#f8fafc",
    color: "#475569",
  },
  primaryButton: {
    alignSelf: "flex-start",
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "#0f766e",
    color: "#f8fafc",
    fontWeight: 700,
    cursor: "pointer",
  },
};
