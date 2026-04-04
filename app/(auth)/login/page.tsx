"use client";

import { Eye, EyeOff, Mail } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/src/lib/api";
import {
  fetchPublicPlatformConfig,
  type PublicPlatformConfig,
} from "@/src/lib/publicPlatformConfig";
import logoIcon from "@/src/assets/logo_icon.png";
import logoNameWhite from "@/src/assets/logo_name_white.png";
import styles from "./styles";

type AdminLoginResponse = {
  token?: string;
  admin?: {
    id: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
  };
  requiresMfa?: boolean;
  message?: string;
};

function persistAdminSession(payload: {
  token: string;
  admin: {
    id: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
  };
  rememberMe: boolean;
}) {
  localStorage.setItem("sureride_admin_token", payload.token);
  localStorage.setItem("sureride_admin_user", JSON.stringify(payload.admin));

  document.cookie = payload.rememberMe
    ? `sureride_admin_token=${payload.token}; path=/; max-age=${60 * 60 * 24 * 30}; secure; samesite=lax`
    : `sureride_admin_token=${payload.token}; path=/; secure; samesite=lax`;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [verifyingMagicLink, setVerifyingMagicLink] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<PublicPlatformConfig | null>(
    null,
  );
  const handledMagicTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPlatformConfig = async () => {
      const config = await fetchPublicPlatformConfig();
      if (!mounted || !config) {
        return;
      }

      setPlatformConfig(config);
      setRememberMe(config.loginSetup?.showRememberMe !== false);
    };

    void loadPlatformConfig();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const token =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("magicToken");
    if (!token || handledMagicTokenRef.current === token) {
      return;
    }
    handledMagicTokenRef.current = token;

    let cancelled = false;

    const verifyMagicLink = async () => {
      try {
        setVerifyingMagicLink(true);
        const response = await apiRequest<AdminLoginResponse>(
          "/admin/auth/magic-link/verify",
          {
            method: "POST",
            body: JSON.stringify({ token }),
          },
        );

        if (cancelled || !response.token || !response.admin) {
          return;
        }

        persistAdminSession({
          token: response.token,
          admin: response.admin,
          rememberMe,
        });

        toast.success("Login successful");
        router.replace("/modules");
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "The sign-in link is invalid or expired",
          );
        }
      } finally {
        if (!cancelled) {
          setVerifyingMagicLink(false);
        }
      }
    };

    void verifyMagicLink();

    return () => {
      cancelled = true;
    };
  }, [rememberMe, router]);

  const brandColor = platformConfig?.themeSettings?.brandColor?.trim() || "#009688";
  const companyName =
    platformConfig?.businessSetup?.companyName?.trim() ||
    platformConfig?.themeSettings?.logoLightText?.trim() ||
    "Sureride";
  const backgroundImage =
    platformConfig?.gallery?.items?.find(Boolean) || "/images/login-bg.jpg";
  const logoUrl = platformConfig?.businessSetup?.logoUrl?.trim() || "";
  const allowPasswordLogin = platformConfig?.loginSetup?.allowPasswordLogin !== false;
  const allowMagicLink = platformConfig?.loginSetup?.allowMagicLink === true;
  const showRememberMe = platformConfig?.loginSetup?.showRememberMe !== false;
  const requiresMfa = platformConfig?.loginSetup?.requireMfaForAdmins === true;

  const submitButtonStyle = useMemo(
    () => ({
      ...styles.submitButton,
      background: brandColor,
      opacity: loading ? 0.6 : 1,
    }),
    [brandColor, loading],
  );

  const magicButtonStyle = useMemo(
    () => ({
      ...styles.magicLinkButton,
      borderColor: brandColor,
      color: brandColor,
      opacity: magicLoading ? 0.6 : 1,
    }),
    [brandColor, magicLoading],
  );

  const handleLogin = async () => {
    if (!allowPasswordLogin) {
      toast.error("Password login is disabled for admins");
      return;
    }

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest<AdminLoginResponse>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (response.requiresMfa) {
        toast.success(
          response.message || "Check your email to complete sign-in.",
        );
        return;
      }

      if (!response.token || !response.admin) {
        throw new Error("Login failed");
      }

      persistAdminSession({
        token: response.token,
        admin: response.admin,
        rememberMe,
      });

      toast.success("Login successful");
      router.push("/modules");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!allowMagicLink) {
      toast.error("Magic-link login is disabled");
      return;
    }

    if (!email) {
      toast.error("Enter your admin email first");
      return;
    }

    try {
      setMagicLoading(true);
      await apiRequest("/admin/auth/magic-link/request", {
        method: "POST",
        body: JSON.stringify({ email, rememberMe }),
      });
      toast.success("If the account exists, a sign-in link has been sent.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send sign-in link",
      );
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <div style={styles.screen}>
      {backgroundImage.startsWith("http://") || backgroundImage.startsWith("https://") ? (
        <img src={backgroundImage} alt="Background" style={styles.remoteBackgroundImage} />
      ) : (
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          priority
          style={styles.backgroundImage}
        />
      )}

      <div style={styles.overlay} />

      <div style={styles.logo}>
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} style={styles.logoRemoteImage} />
        ) : (
          <>
            <Image
              src={logoIcon}
              alt="Sureride icon"
              priority
              style={styles.logoMiniIcon}
            />
            <Image src={logoNameWhite} alt="Sureride" priority style={styles.logoName} />
          </>
        )}
      </div>

      <div style={styles.cardWrapper}>
        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} style={styles.brandRemoteImage} />
            ) : (
              <Image
                src={logoIcon}
                alt="Sureride logo icon"
                priority
                style={styles.brandIcon}
              />
            )}
          </div>

          <h2 style={styles.title}>{companyName.toUpperCase()}</h2>
          <p style={styles.subtitle}>
            {verifyingMagicLink
              ? "Verifying your secure sign-in link..."
              : requiresMfa
                ? "Password sign-in requires an email confirmation step."
                : "Sign in to manage rentals, providers, and operations."}
          </p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={styles.input}
              disabled={loading || magicLoading || verifyingMagicLink}
            />
          </div>

          {allowPasswordLogin ? (
            <>
              <div style={{ ...styles.inputGroup, position: "relative" }}>
                <label style={styles.label}>Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={styles.input}
                  disabled={loading || verifyingMagicLink}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={styles.eyeButton}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {showRememberMe ? (
                <label style={styles.rememberRow}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Remember me on this device
                </label>
              ) : null}

              <button
                onClick={handleLogin}
                disabled={loading || verifyingMagicLink}
                style={submitButtonStyle}
              >
                {loading ? "Signing in..." : requiresMfa ? "Continue Secure Sign-In" : "Sign In"}
              </button>
            </>
          ) : (
            <div style={styles.disabledNotice}>
              Password login is disabled for admins. Use a magic link if it is enabled below.
            </div>
          )}

          {allowMagicLink ? (
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={magicLoading || verifyingMagicLink}
              style={magicButtonStyle}
            >
              <Mail size={16} />
              {magicLoading ? "Sending Link..." : "Email Me a Magic Link"}
            </button>
          ) : null}

          <div style={styles.forgotWrapper}>
            <button
              type="button"
              style={styles.forgotButton}
              onClick={() => {
                if (allowMagicLink) {
                  void handleMagicLink();
                  return;
                }
                toast.error("Password recovery is not configured for admins.");
              }}
            >
              {allowMagicLink ? "Need access? Send a sign-in link" : "Password recovery unavailable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
