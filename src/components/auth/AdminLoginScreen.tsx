"use client";

import { Eye, EyeOff, Mail, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/src/lib/api";
import {
  fetchPublicPlatformConfig,
  type PublicPlatformConfig,
} from "@/src/lib/publicPlatformConfig";
import logoIcon from "@/src/assets/logo_icon.png";
import logoNameWhite from "@/src/assets/logo_name_white.png";
import { useIsMobile } from "@/src/hooks/useIsMobile";

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

const initialBrand = {
  companyName: "Sureride",
  brandColor: "#0f766e",
  backgroundImage: "/images/login-bg.jpg",
  logoUrl: "",
};

export default function AdminLoginScreen() {
  const router = useRouter();
  const isMobile = useIsMobile(960);
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

  const brand = useMemo(
    () => ({
      companyName:
        platformConfig?.businessSetup?.companyName?.trim() ||
        platformConfig?.themeSettings?.logoLightText?.trim() ||
        initialBrand.companyName,
      brandColor:
        platformConfig?.themeSettings?.brandColor?.trim() || initialBrand.brandColor,
      backgroundImage:
        platformConfig?.gallery?.items?.find(Boolean) || initialBrand.backgroundImage,
      logoUrl: platformConfig?.businessSetup?.logoUrl?.trim() || "",
    }),
    [platformConfig],
  );

  const allowPasswordLogin = platformConfig?.loginSetup?.allowPasswordLogin !== false;
  const allowMagicLink = platformConfig?.loginSetup?.allowMagicLink === true;
  const showRememberMe = platformConfig?.loginSetup?.showRememberMe !== false;
  const requiresMfa = platformConfig?.loginSetup?.requireMfaForAdmins === true;

  const primaryButtonStyle = useMemo(
    () => ({
      ...styles.primaryButton,
      background: brand.brandColor,
      opacity: loading || verifyingMagicLink ? 0.65 : 1,
    }),
    [brand.brandColor, loading, verifyingMagicLink],
  );

  const secondaryButtonStyle = useMemo(
    () => ({
      ...styles.secondaryButton,
      borderColor: brand.brandColor,
      color: brand.brandColor,
      opacity: magicLoading || verifyingMagicLink ? 0.65 : 1,
    }),
    [brand.brandColor, magicLoading, verifyingMagicLink],
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

  const headline = verifyingMagicLink
    ? "Verifying secure access"
    : requiresMfa
      ? "Admin sign-in with email confirmation"
      : "Operations control for the entire platform";

  const heroBody = verifyingMagicLink
    ? "Hold on while we validate the sign-in link."
    : "Manage providers, pricing, approvals, and business configuration from one console.";

  return (
    <div
      style={{
        ...styles.page,
        gridTemplateColumns: isMobile ? "1fr" : "1.08fr 0.92fr",
      }}
    >
      <section
        style={{
          ...styles.hero,
          minHeight: isMobile ? 360 : "100vh",
          backgroundImage: `linear-gradient(135deg, rgba(2,6,23,0.88), rgba(15,118,110,0.30)), url(${brand.backgroundImage})`,
        }}
      >
        <div
          style={{
            ...styles.heroInner,
            padding: isMobile ? "28px 20px 24px" : "42px 48px 56px",
          }}
        >
          <div style={styles.logoRow}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.companyName} style={styles.logoRemote} />
            ) : (
              <>
                <Image src={logoIcon} alt="Sureride icon" priority style={styles.logoIcon} />
                <Image src={logoNameWhite} alt="Sureride" priority style={styles.logoName} />
              </>
            )}
          </div>

          <span style={styles.badge}>Admin Console</span>
          <h1
            style={{
              ...styles.heroTitle,
              fontSize: isMobile ? 34 : 52,
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              ...styles.heroSubtitle,
              fontSize: isMobile ? 15 : 17,
            }}
          >
            {heroBody}
          </p>

          <div
            style={{
              ...styles.featureGrid,
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div style={styles.featureCard}>
              <ShieldCheck size={18} />
              <div>
                <strong style={styles.featureTitle}>Secure Access</strong>
                <p style={styles.featureText}>
                  Role-aware admin sign-in with optional MFA and magic links.
                </p>
              </div>
            </div>
            <div style={styles.featureCard}>
              <Sparkles size={18} />
              <div>
                <strong style={styles.featureTitle}>Live Control</strong>
                <p style={styles.featureText}>
                  Adjust business settings, provider workflows, and platform operations in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          ...styles.panel,
          minHeight: isMobile ? "auto" : "100vh",
          padding: isMobile ? 16 : 32,
        }}
      >
        <div
          style={{
            ...styles.card,
            padding: isMobile ? 24 : 34,
            borderRadius: isMobile ? 22 : 30,
          }}
        >
          <div style={styles.cardHeader}>
            <p style={styles.eyebrow}>Administrative Access</p>
            <h2 style={styles.cardTitle}>Sign in to {brand.companyName}</h2>
            <p style={styles.cardSubtitle}>
              {verifyingMagicLink
                ? "Verifying your secure sign-in link..."
                : requiresMfa
                  ? "Password login completes with an email confirmation step."
                  : "Use your admin credentials to continue."}
            </p>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>Admin Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={styles.input}
              disabled={loading || magicLoading || verifyingMagicLink}
            />
          </label>

          {allowPasswordLogin ? (
            <>
              <label style={styles.field}>
                <span style={styles.label}>Password</span>
                <div style={styles.passwordWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    style={{ ...styles.input, paddingRight: 44 }}
                    disabled={loading || verifyingMagicLink}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

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
                style={primaryButtonStyle}
              >
                {loading
                  ? "Signing in..."
                  : requiresMfa
                    ? "Continue Secure Sign-In"
                    : "Sign In"}
              </button>
            </>
          ) : (
            <div style={styles.notice}>
              Password login is disabled for admins. Use a magic link if it is enabled below.
            </div>
          )}

          {allowMagicLink ? (
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={magicLoading || verifyingMagicLink}
              style={secondaryButtonStyle}
            >
              <Mail size={16} />
              {magicLoading ? "Sending Link..." : "Email Me a Magic Link"}
            </button>
          ) : null}

          <button
            type="button"
            style={styles.textButton}
            onClick={() => {
              if (allowMagicLink) {
                void handleMagicLink();
                return;
              }
              toast.error("Password recovery is not configured for admins.");
            }}
          >
            {allowMagicLink
              ? "Need access? Send a sign-in link"
              : "Password recovery unavailable"}
          </button>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.08fr 0.92fr",
    background: "#03110f",
  },
  hero: {
    minHeight: "100vh",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "stretch",
  },
  heroInner: {
    width: "100%",
    padding: "42px 48px 56px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 24,
    color: "#f8fafc",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 46,
    height: 46,
    objectFit: "contain",
  },
  logoName: {
    width: 160,
    height: "auto",
  },
  logoRemote: {
    maxWidth: 220,
    maxHeight: 58,
    objectFit: "contain",
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
  heroTitle: {
    margin: 0,
    maxWidth: 560,
    fontSize: 52,
    lineHeight: 1.02,
    fontWeight: 750,
  },
  heroSubtitle: {
    margin: "12px 0 0",
    maxWidth: 560,
    fontSize: 17,
    lineHeight: 1.65,
    color: "rgba(248,250,252,0.8)",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    alignItems: "end",
  },
  featureCard: {
    display: "flex",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
  },
  featureTitle: {
    display: "block",
    marginBottom: 4,
    fontSize: 14,
  },
  featureText: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(248,250,252,0.72)",
  },
  panel: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    background:
      "radial-gradient(circle at top, rgba(20,184,166,0.12), transparent 36%), #03110f",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    padding: 34,
    borderRadius: 30,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.82)",
    boxShadow: "0 28px 70px rgba(0,0,0,0.34)",
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(248,250,252,0.62)",
  },
  cardTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },
  cardSubtitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: "rgba(248,250,252,0.72)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "rgba(248,250,252,0.76)",
  },
  input: {
    width: "100%",
    height: 50,
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
    top: 11,
    width: 28,
    height: 28,
    border: "none",
    background: "transparent",
    color: "rgba(248,250,252,0.68)",
    cursor: "pointer",
  },
  rememberRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "rgba(248,250,252,0.76)",
    fontSize: 13,
  },
  primaryButton: {
    width: "100%",
    height: 50,
    border: "none",
    borderRadius: 14,
    color: "#03110f",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid",
    background: "transparent",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  notice: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(248,250,252,0.8)",
    padding: "14px 16px",
    fontSize: 13,
    lineHeight: 1.5,
  },
  textButton: {
    border: "none",
    background: "transparent",
    color: "rgba(248,250,252,0.72)",
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
    alignSelf: "center",
  },
};
