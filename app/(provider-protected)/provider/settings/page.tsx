"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
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
  businessOpeningTime: string;
  businessClosingTime: string;
  businessOperatingDays: string[];
};

const BUSINESS_DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? 0 : 30;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return {
    value,
    label: formatTimeLabel(value),
  };
});

const emptyForm: ProfileForm = {
  name: "",
  phone: "",
  contactPersonName: "",
  contactPersonRole: "",
  contactPersonPhone: "",
  businessAddress: "",
  businessOpeningTime: "",
  businessClosingTime: "",
  businessOperatingDays: [],
};

function formatTimeLabel(value: string) {
  if (!value) {
    return "";
  }

  const [hoursText, minutesText] = value.split(":");
  const hours = Number.parseInt(hoursText ?? "", 10);
  const minutes = Number.parseInt(minutesText ?? "", 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const meridiem = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 || 12;

  return `${normalizedHour}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function mapProfileToForm(profile: ProviderProfile): ProfileForm {
  return {
    name: profile.name || "",
    phone: profile.phone || "",
    contactPersonName: profile.contactPersonName || "",
    contactPersonRole: profile.contactPersonRole || "",
    contactPersonPhone: profile.contactPersonPhone || "",
    businessAddress: profile.businessAddress || "",
    businessOpeningTime: profile.businessOpeningTime || "",
    businessClosingTime: profile.businessClosingTime || "",
    businessOperatingDays: profile.businessOperatingDays ?? [],
  };
}

function getBusinessHoursSummary(form: ProfileForm) {
  if (
    !form.businessOperatingDays.length ||
    !form.businessOpeningTime ||
    !form.businessClosingTime
  ) {
    return "Set active days and service hours";
  }

  return `${formatTimeLabel(form.businessOpeningTime)} to ${formatTimeLabel(
    form.businessClosingTime,
  )} on ${form.businessOperatingDays.length} selected day${
    form.businessOperatingDays.length === 1 ? "" : "s"
  }`;
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

  const toggleOperatingDay = (day: string) => {
    setForm((current) => ({
      ...current,
      businessOperatingDays: current.businessOperatingDays.includes(day)
        ? current.businessOperatingDays.filter((item) => item !== day)
        : [...current.businessOperatingDays, day],
    }));
  };

  const handleSaveProfile = async () => {
    if (
      form.businessOpeningTime &&
      form.businessClosingTime &&
      form.businessOpeningTime >= form.businessClosingTime
    ) {
      toast.error("Closing time must be later than opening time");
      return;
    }

    try {
      setSavingProfile(true);
      const response = await updateProviderProfile({
        ...form,
        businessOperatingDays: form.businessOperatingDays,
      });
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
      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Provider Portal</p>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>
            Keep your business identity, operating schedule, and account security
            aligned with how your fleet runs.
          </p>
        </div>

        <div style={styles.heroAside}>
          <div style={styles.heroStat}>
            <span style={styles.heroStatLabel}>Status</span>
            <strong style={styles.heroStatValue}>{profile?.status || "-"}</strong>
          </div>
          <div style={styles.heroStat}>
            <span style={styles.heroStatLabel}>Verification</span>
            <strong style={styles.heroStatValue}>
              {profile?.isVerified ? "Verified" : "Pending"}
            </strong>
          </div>
        </div>
      </div>

      {(forcePasswordChange || profile?.mustChangePassword) && (
        <div style={styles.alert}>
          Your account is using a temporary password. Change it before continuing.
        </div>
      )}

      <div style={styles.grid}>
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Business Profile</h2>
              <p style={styles.sectionText}>
                The details here are used across provider operations and internal
                account records.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Field label="Business Name">
              <input
                style={styles.input}
                value={form.name}
                onChange={(event) => handleProfileChange("name", event.target.value)}
              />
            </Field>

            <Field label="Business Email">
              <input style={styles.inputReadOnly} value={profile?.email || ""} readOnly />
            </Field>

            <Field label="Phone">
              <input
                style={styles.input}
                value={form.phone}
                onChange={(event) => handleProfileChange("phone", event.target.value)}
              />
            </Field>

            <Field label="Business Address">
              <input
                style={styles.input}
                value={form.businessAddress}
                onChange={(event) =>
                  handleProfileChange("businessAddress", event.target.value)
                }
              />
            </Field>

            <Field label="Contact Person">
              <input
                style={styles.input}
                value={form.contactPersonName}
                onChange={(event) =>
                  handleProfileChange("contactPersonName", event.target.value)
                }
              />
            </Field>

            <Field label="Contact Role">
              <input
                style={styles.input}
                value={form.contactPersonRole}
                onChange={(event) =>
                  handleProfileChange("contactPersonRole", event.target.value)
                }
              />
            </Field>

            <Field label="Contact Phone">
              <input
                style={styles.input}
                value={form.contactPersonPhone}
                onChange={(event) =>
                  handleProfileChange("contactPersonPhone", event.target.value)
                }
              />
            </Field>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Business Hours</h2>
              <p style={styles.sectionText}>
                Define when your rental desk is open so your team operates with a
                consistent schedule.
              </p>
            </div>
          </div>

          <div style={styles.hoursRow}>
            <Field label="Opening Time">
              <select
                style={styles.select}
                value={form.businessOpeningTime}
                onChange={(event) =>
                  handleProfileChange("businessOpeningTime", event.target.value)
                }
              >
                <option value="">Select opening time</option>
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Closing Time">
              <select
                style={styles.select}
                value={form.businessClosingTime}
                onChange={(event) =>
                  handleProfileChange("businessClosingTime", event.target.value)
                }
              >
                <option value="">Select closing time</option>
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={styles.dayGrid}>
            {BUSINESS_DAY_OPTIONS.map((day) => {
              const active = form.businessOperatingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  style={{
                    ...styles.dayChip,
                    ...(active ? styles.dayChipActive : {}),
                  }}
                  onClick={() => toggleOperatingDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div style={styles.hoursSummary}>
            <span style={styles.summaryPill}>
              {form.businessOperatingDays.length
                ? `${form.businessOperatingDays.length} day${
                    form.businessOperatingDays.length === 1 ? "" : "s"
                  } active`
                : "No active days selected"}
            </span>
            <span style={styles.summaryText}>{getBusinessHoursSummary(form)}</span>
          </div>
        </section>
      </div>

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Security</h2>
            <p style={styles.sectionText}>
              Replace a temporary password or rotate your current one at any time.
            </p>
          </div>
        </div>

        <div style={styles.securityGrid}>
          <Field label="Current Password">
            <input
              style={styles.input}
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>

          <Field label="New Password">
            <input
              style={styles.input}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>

          <Field label="Confirm New Password">
            <input
              style={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>
        </div>

        <div style={styles.actionsRow}>
          <button
            type="button"
            style={styles.primaryButton}
            disabled={savingProfile}
            onClick={handleSaveProfile}
          >
            {savingProfile ? "Saving..." : "Save Business Settings"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            disabled={savingPassword}
            onClick={handleChangePassword}
          >
            {savingPassword ? "Updating..." : "Change Password"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
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
    gap: 22,
    maxWidth: 1380,
  },
  loading: {
    padding: 24,
  },
  hero: {
    borderRadius: 28,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(13,148,136,0.22))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 18,
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--fg-60)",
  },
  title: {
    margin: "8px 0 10px",
    fontSize: 34,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    maxWidth: 720,
    color: "var(--fg-75)",
    lineHeight: 1.6,
  },
  heroAside: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  heroStat: {
    minWidth: 150,
    borderRadius: 16,
    padding: "14px 16px",
    background: "rgba(15,23,42,0.34)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  heroStatLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroStatValue: {
    fontSize: 18,
    color: "#fff",
  },
  alert: {
    maxWidth: 420,
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fef3c7",
    color: "#92400e",
    fontSize: 13,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 18,
  },
  card: {
    borderRadius: 18,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },
  sectionText: {
    margin: "6px 0 0",
    color: "var(--fg-60)",
    fontSize: 14,
    lineHeight: 1.5,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  securityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  hoursRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  dayGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-70)",
    letterSpacing: 0.2,
  },
  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    padding: "0 14px",
    fontSize: 14,
    background: "var(--surface-2)",
    color: "var(--foreground)",
    outline: "none",
  },
  select: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    padding: "0 14px",
    fontSize: 14,
    background: "var(--surface-2)",
    color: "var(--foreground)",
    outline: "none",
    appearance: "none",
  },
  inputReadOnly: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    padding: "0 14px",
    fontSize: 14,
    background: "rgba(148,163,184,0.08)",
    color: "var(--fg-70)",
    outline: "none",
  },
  dayChip: {
    height: 40,
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  dayChipActive: {
    background: "rgba(13,148,136,0.16)",
    borderColor: "rgba(13,148,136,0.36)",
    color: "#99f6e4",
  },
  hoursSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  summaryPill: {
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: "8px 12px",
    fontSize: 12,
    color: "var(--fg-70)",
    fontWeight: 700,
  },
  summaryText: {
    color: "var(--fg-60)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  actionsRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    fontWeight: 700,
    cursor: "pointer",
  },
};
