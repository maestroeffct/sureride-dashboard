"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import styles from "./styles";
import {
  Bell,
  BellOff,
  Settings,
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import logoIcon from "@/src/assets/logo_icon.png";
import logoNameWhite from "@/src/assets/logo_name_white.png";
import logoNameBlack from "@/src/assets/logog_name_black.png";
import { useTheme } from "@/src/hooks/useTheme";
import { useLayoutUI } from "@/src/hooks/useLayoutUI";
import { useNotifications } from "@/src/hooks/useNotifications";
import NotificationPanel from "./NotificationPanel";
import {
  isAlertsMuted,
  setAlertsMuted,
  getBrowserPermission,
  requestBrowserPermission,
  playNotificationDing,
  type BrowserPermissionState,
} from "@/src/lib/notificationAlerts";

type SessionUser = {
  name?: string;
  email: string;
  role?: string;
  isProvider: boolean;
};

function getSessionUser(isProviderRoute: boolean): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    if (isProviderRoute) {
      const raw = localStorage.getItem("sureride_provider_user");
      if (!raw) return null;
      const u = JSON.parse(raw) as { id: string; name: string; email: string; status: string };
      return { name: u.name, email: u.email, isProvider: true };
    } else {
      const raw = localStorage.getItem("sureride_admin_user");
      if (!raw) return null;
      const u = JSON.parse(raw) as { id: string; email: string; role: string };
      return { email: u.email, role: u.role, isProvider: false };
    }
  } catch {
    return null;
  }
}

function getInitials(user: SessionUser): string {
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

function formatRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    OPS: "Operations",
    SUPPORT: "Support",
  };
  return map[role] ?? role;
}

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getPageTitle(pathname: string): { section: string; title: string } {
  if (pathname === "/modules") return { section: "", title: "Modules" };

  if (pathname === "/rentals") return { section: "Rentals", title: "Overview" };
  if (pathname === "/rentals/bookings") return { section: "Rentals", title: "Bookings" };
  if (pathname === "/rentals/cars") return { section: "Rentals", title: "Fleet" };
  if (pathname === "/rentals/employees/roles") return { section: "Team", title: "Roles" };
  if (pathname.startsWith("/rentals/employees/")) return { section: "Team", title: "Employee" };
  if (pathname === "/rentals/employees") return { section: "Rentals", title: "Employees" };
  if (pathname === "/rentals/finance") return { section: "Rentals", title: "Finance" };
  if (pathname === "/rentals/payouts") return { section: "Rentals", title: "Payouts" };
  if (pathname === "/rentals/pricing-rules") return { section: "Rentals", title: "Pricing Rules" };
  if (pathname.startsWith("/rentals/providers/")) return { section: "Rentals", title: "Provider Detail" };
  if (pathname === "/rentals/providers") return { section: "Rentals", title: "Providers" };
  if (pathname === "/rentals/users") return { section: "Rentals", title: "Users" };
  if (pathname === "/rentals/configuration/model-requests") return { section: "Config", title: "Model Requests" };
  if (pathname.startsWith("/rentals/business/")) {
    const feature = pathname.split("/").pop() ?? "";
    return { section: "Business", title: formatSlug(feature) };
  }
  if (pathname.startsWith("/rentals/platform/")) {
    const feature = pathname.split("/").pop() ?? "";
    return { section: "Platform", title: formatSlug(feature) };
  }

  if (pathname === "/provider") return { section: "Provider", title: "Dashboard" };
  if (pathname === "/provider/cars/new") return { section: "Fleet", title: "Add Vehicle" };
  if (pathname.startsWith("/provider/cars/")) return { section: "Fleet", title: "Edit Vehicle" };
  if (pathname === "/provider/cars") return { section: "Provider", title: "My Fleet" };
  if (pathname === "/provider/earnings") return { section: "Provider", title: "Earnings" };
  if (pathname === "/provider/insurance") return { section: "Provider", title: "Insurance" };
  if (pathname === "/provider/locations") return { section: "Provider", title: "Locations" };
  if (pathname === "/provider/rents") return { section: "Provider", title: "Rentals" };
  if (pathname === "/provider/settings") return { section: "Provider", title: "Settings" };

  return { section: "", title: "" };
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, toggleSidebar, isMobile } = useLayoutUI();
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [muted, setMuted] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<BrowserPermissionState>("unsupported");

  useEffect(() => {
    setMuted(isAlertsMuted());
    setBrowserPerm(getBrowserPermission());
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setAlertsMuted(next);
    // Quick audible confirmation when un-muting — also "unlocks" the audio
    // context so subsequent chimes can play without further user gesture.
    if (!next) playNotificationDing();
  };

  const handleEnableBrowserNotifications = async () => {
    const result = await requestBrowserPermission();
    setBrowserPerm(result);
    if (result === "granted") {
      toast.success("Browser notifications enabled");
    } else if (result === "denied") {
      toast.error("Permission denied — enable it in your browser settings");
    }
  };
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const { notifications, readSet, unreadCount, loading, markRead, markAllRead } =
    useNotifications();

  const isProviderRoute = pathname.startsWith("/provider");
  const canToggleSidebar =
    pathname.startsWith("/rentals") || pathname.startsWith("/provider");

  const { section, title } = getPageTitle(pathname);

  useEffect(() => {
    setUser(getSessionUser(isProviderRoute));
  }, [isProviderRoute]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    const tokenKey = isProviderRoute ? "sureride_provider_token" : "sureride_admin_token";
    const userKey = isProviderRoute ? "sureride_provider_user" : "sureride_admin_user";
    const logoutPath = isProviderRoute ? "/provider/auth/logout" : "/admin/auth/logout";
    const redirectPath = isProviderRoute ? "/provider/login" : "/admin/login";

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${logoutPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(tokenKey)}`,
        },
      });
    } catch {
      console.warn("Logout API failed, proceeding with local logout");
    } finally {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      document.cookie = `${tokenKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      toast.success("Logged out successfully");
      window.location.href = redirectPath;
    }
  };

  const handleSettingsClick = () => {
    router.push(isProviderRoute ? "/provider/settings" : "/rentals/platform/third-party-configuration");
  };

  const initials = user ? getInitials(user) : "??";
  const displayName = user?.name ?? user?.email ?? "";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.role ? formatRoleLabel(user.role) : user?.isProvider ? "Provider" : "";

  return (
    <header
      style={{
        ...styles.container,
        padding: isMobile ? "0 12px" : "0 24px",
      }}
    >
      {/* Left — Logo */}
      <div style={{ ...styles.left, gap: isMobile ? 8 : 10 }}>
        {canToggleSidebar && (
          <button
            style={{
              ...styles.menuButton,
              ...(sidebarCollapsed ? styles.menuButtonActive : {}),
            }}
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
            title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}

        <Image src={logoIcon} alt="Sureride icon" priority style={styles.brandIcon} />
        {!isMobile && (
          <Image
            src={theme === "dark" ? logoNameWhite : logoNameBlack}
            alt="Sureride"
            priority
            style={styles.brandName}
          />
        )}
      </div>

      {/* Center — Page title */}
      {title && (
        <div style={styles.pageTitle}>
          {section && !isMobile && (
            <span style={styles.pageTitleSection}>{section} /</span>
          )}
          <span style={styles.pageTitleLabel}>{title}</span>
        </div>
      )}

      {/* Right — Actions */}
      <div style={styles.right}>
        {/* Notification bell */}
        <div style={styles.profileWrapper} ref={bellRef}>
          <div style={styles.iconGroup}>
            <button
              style={styles.iconButton}
              onClick={() => {
                setBellOpen((v) => !v);
                setOpen(false);
              }}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span style={styles.notificationDot} />}
            </button>
            {!isMobile && (
              <button
                style={styles.iconButton}
                onClick={handleSettingsClick}
                aria-label="Settings"
                title="Settings"
              >
                <Settings size={18} />
              </button>
            )}
          </div>

          {bellOpen && (
            <NotificationPanel
              notifications={notifications}
              readSet={readSet}
              unreadCount={unreadCount}
              loading={loading}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClose={() => setBellOpen(false)}
            />
          )}
        </div>

        {/* Theme toggle */}
        <div style={styles.iconGroup}>
          <button
            style={{
              ...styles.iconButton,
              ...(theme === "light" ? styles.iconActive : {}),
            }}
            onClick={() => setTheme("light")}
            aria-label="Light mode"
            title="Light mode"
          >
            <Sun size={17} />
          </button>
          <div style={styles.divider} />
          <button
            style={{
              ...styles.iconButton,
              ...(theme === "dark" ? styles.iconActive : {}),
            }}
            onClick={() => setTheme("dark")}
            aria-label="Dark mode"
            title="Dark mode"
          >
            <Moon size={17} />
          </button>
        </div>

        {/* Profile */}
        <div style={styles.profileWrapper} ref={profileRef}>
          <button style={styles.profileButton} onClick={() => setOpen((v) => !v)} aria-label="Account menu">
            <span style={styles.avatar}>{initials}</span>
            {!isMobile && (
              <>
                <span style={styles.profileName}>{user?.name ?? user?.email?.split("@")[0]}</span>
                <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
              </>
            )}
          </button>

          {open && (
            <div style={styles.dropdown}>
              {/* User info header */}
              <div style={styles.dropdownHeader}>
                <div style={styles.dropdownAvatar}>{initials}</div>
                <div style={styles.dropdownUserInfo}>
                  {displayName && (
                    <span style={styles.dropdownUserName}>{displayName}</span>
                  )}
                  <span style={styles.dropdownUserEmail}>{displayEmail}</span>
                  {displayRole && (
                    <span style={styles.dropdownRoleBadge}>{displayRole}</span>
                  )}
                </div>
              </div>

              <div style={styles.dropdownDivider} />

              <button
                style={styles.dropdownItem}
                onClick={() => {
                  setOpen(false);
                  router.push(
                    isProviderRoute
                      ? "/provider/settings"
                      : "/rentals/business/business-setup",
                  );
                }}
              >
                My Profile
              </button>
              <button
                style={styles.dropdownItem}
                onClick={() => {
                  setOpen(false);
                  handleSettingsClick();
                }}
              >
                Account Settings
              </button>

              <div style={styles.dropdownDivider} />

              {/* Notification alert controls */}
              <button
                style={styles.dropdownItem}
                onClick={handleToggleMute}
                title={muted ? "Unmute notifications" : "Mute notifications"}
              >
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span style={{ flex: 1, textAlign: "left" }}>
                  {muted ? "Unmute alerts" : "Mute alerts"}
                </span>
              </button>

              {browserPerm === "default" && (
                <button
                  style={styles.dropdownItem}
                  onClick={handleEnableBrowserNotifications}
                  title="Get OS-level notifications even when this tab is inactive"
                >
                  <Bell size={15} />
                  <span style={{ flex: 1, textAlign: "left" }}>
                    Enable browser notifications
                  </span>
                </button>
              )}

              {browserPerm === "denied" && (
                <div
                  style={{
                    ...styles.dropdownItem,
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                    cursor: "default",
                  }}
                >
                  <BellOff size={13} />
                  <span style={{ flex: 1, textAlign: "left" }}>
                    Browser notifications blocked
                  </span>
                </div>
              )}

              <div style={styles.dropdownDivider} />

              <button
                style={{ ...styles.dropdownItem, color: "#ef4444" }}
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
