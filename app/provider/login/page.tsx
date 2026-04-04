"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  type CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import { fetchPublicPlatformConfig } from "@/src/lib/publicPlatformConfig";
import {
  loginProvider,
  requestProviderPasswordReset,
  resetProviderPassword,
} from "@/src/lib/providerApi";
import { useIsMobile } from "@/src/hooks/useIsMobile";

const initialBrand = {
  companyName: "Sureride",
  brandColor: "#0f766e",
  backgroundImage: "/images/login-bg.jpg",
};

type AuthMode = "login" | "forgot" | "reset";

function getMode(value: string | null): AuthMode {
  if (value === "forgot" || value === "reset") {
    return value;
  }
  return "login";
}

function ProviderLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(960);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState(initialBrand);

  const mode = useMemo<AuthMode>(
    () => getMode(searchParams.get("mode")),
    [searchParams],
  );
  const resetToken = searchParams.get("token") ?? "";

  useEffect(() => {
    void fetchPublicPlatformConfig().then((config) => {
      setBrand({
        companyName: config?.businessSetup?.companyName?.trim() || "Sureride",
        brandColor: config?.themeSettings?.brandColor?.trim() || "#0f766e",
        backgroundImage:
          config?.gallery?.items?.find(Boolean) || "/images/login-bg.jpg",
      });
    });
  }, []);

  const setMode = (nextMode: AuthMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextMode === "login") {
      params.delete("mode");
      params.delete("token");
    } else {
      params.set("mode", nextMode);
      if (nextMode !== "reset") {
        params.delete("token");
      }
    }
    const query = params.toString();
    router.replace(query ? `/provider/login?${query}` : "/provider/login");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const response = await loginProvider(email, password);

      localStorage.setItem("sureride_provider_token", response.token);
      localStorage.setItem(
        "sureride_provider_user",
        JSON.stringify(response.provider),
      );
      document.cookie = `sureride_provider_token=${response.token}; path=/; samesite=lax`;

      toast.success("Provider login successful");
      router.push(
        response.mustChangePassword
          ? "/provider/settings?forcePasswordChange=1"
          : "/provider",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid provider credentials",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your provider email");
      return;
    }

    try {
      setLoading(true);
      const response = await requestProviderPasswordReset(email);
      toast.success(response.message);
      setMode("login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset link",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      toast.error("Reset link is missing or invalid");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Enter and confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await resetProviderPassword(resetToken, newPassword);
      toast.success(response.message);
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      );
    } finally {
      setLoading(false);
    }
  };

  const heroTitle =
    mode === "forgot"
      ? "Recover Provider Access"
      : mode === "reset"
        ? "Set a New Password"
        : `${brand.companyName} Fleet Console`;

  const heroSubtitle =
    mode === "forgot"
      ? "Request a reset link for your provider account."
      : mode === "reset"
        ? "Choose a new password for your provider portal."
        : "Sign in to manage your fleet, upload cars, and monitor live rentals.";

  return (
    <div
      style={{
        ...styles.page,
        gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
      }}
    >
      <div
        style={{
          ...styles.hero,
          minHeight: isMobile ? 300 : "100vh",
          padding: isMobile ? 24 : 56,
          backgroundImage: `linear-gradient(135deg, rgba(2,6,23,0.80), rgba(15,118,110,0.42)), url(${brand.backgroundImage})`,
        }}
      >
        <div style={styles.heroContent}>
          <span style={styles.badge}>Provider Portal</span>
          <h1
            style={{
              ...styles.title,
              fontSize: isMobile ? 34 : 46,
            }}
          >
            {heroTitle}
          </h1>
          <p
            style={{
              ...styles.subtitle,
              fontSize: isMobile ? 15 : 17,
            }}
          >
            {heroSubtitle}
          </p>
        </div>
      </div>

      <div
        style={{
          ...styles.panel,
          minHeight: isMobile ? "auto" : "100vh",
          padding: isMobile ? 16 : 32,
        }}
      >
        <div
          style={{
            ...styles.card,
            padding: isMobile ? 24 : 32,
          }}
        >
          <p style={styles.eyebrow}>Provider Access</p>
          <h2 style={styles.cardTitle}>
            {mode === "forgot"
              ? "Forgot Password"
              : mode === "reset"
                ? "Reset Password"
                : "Provider Login"}
          </h2>

          {(mode === "login" || mode === "forgot") && (
            <label style={styles.field}>
              <span style={styles.label}>Business Email</span>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          )}

          {mode === "login" && (
            <label style={styles.field}>
              <span style={styles.label}>Password</span>
              <div style={styles.passwordWrap}>
                <input
                  style={{ ...styles.input, paddingRight: 44 }}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  style={styles.eyeButton}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}

          {mode === "reset" && (
            <>
              <label style={styles.field}>
                <span style={styles.label}>New Password</span>
                <div style={styles.passwordWrap}>
                  <input
                    style={{ ...styles.input, paddingRight: 44 }}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    style={styles.eyeButton}
                    onClick={() => setShowNewPassword((value) => !value)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Confirm Password</span>
                <input
                  style={styles.input}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            </>
          )}

          <button
            type="button"
            style={{ ...styles.button, background: brand.brandColor }}
            onClick={
              mode === "forgot"
                ? handleForgotPassword
                : mode === "reset"
                  ? handleResetPassword
                  : handleLogin
            }
            disabled={loading}
          >
            {loading
              ? mode === "forgot"
                ? "Sending..."
                : mode === "reset"
                  ? "Resetting..."
                  : "Signing In..."
              : mode === "forgot"
                ? "Send Reset Link"
                : mode === "reset"
                  ? "Reset Password"
                  : "Sign In"}
          </button>

          <div style={styles.footerLinks}>
            {mode === "login" && (
              <button
                type="button"
                style={styles.linkButton}
                onClick={() => setMode("forgot")}
              >
                Forgot password?
              </button>
            )}

            {(mode === "forgot" || mode === "reset") && (
              <button
                type="button"
                style={styles.linkButton}
                onClick={() => setMode("login")}
              >
                Back to provider login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderLoginPage() {
  return (
    <Suspense fallback={<div style={styles.page} />}>
      <ProviderLoginContent />
    </Suspense>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    background: "#02120f",
  },
  hero: {
    minHeight: "100vh",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "flex-end",
    padding: "56px",
  },
  heroContent: {
    maxWidth: 520,
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  badge: {
    display: "inline-flex",
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: 46,
    lineHeight: 1.05,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.6,
    color: "rgba(248,250,252,0.8)",
  },
  panel: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    background:
      "radial-gradient(circle at top, rgba(20,184,166,0.18), transparent 38%), #02120f",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 32,
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.78)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.34)",
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(248,250,252,0.62)",
  },
  cardTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "rgba(248,250,252,0.72)",
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(2,6,23,0.78)",
    color: "#f8fafc",
    padding: "0 14px",
    outline: "none",
    fontSize: 14,
  },
  passwordWrap: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 28,
    height: 28,
    border: "none",
    background: "transparent",
    color: "rgba(248,250,252,0.68)",
    cursor: "pointer",
  },
  button: {
    width: "100%",
    height: 48,
    border: "none",
    borderRadius: 14,
    color: "#02120f",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
  footerLinks: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#5eead4",
    padding: 0,
    cursor: "pointer",
    fontSize: 13,
  },
};
