"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./styles";
import {
  Bell,
  MessageCircle,
  Settings,
  Sun,
  Moon,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import logoIcon from "@/src/assets/logo_icon.png";
import logoNameWhite from "@/src/assets/logo_name_white.png";
import logoNameBlack from "@/src/assets/logog_name_black.png";
import { useTheme } from "@/src/hooks/useTheme";
import { useLayoutUI } from "@/src/hooks/useLayoutUI";

export type DashboardModule =
  | "modules"
  | "rentals"
  | "rideshare"
  | "insurance"
  | "mechanic"
  | "autodeal"
  | "parts"
  | "diagnostics";

export default function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, toggleSidebar } = useLayoutUI();
  const [open, setOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const canToggleSidebar = pathname.startsWith("/rentals");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(
            "sureride_admin_token"
          )}`,
        },
      });
    } catch {
      console.warn("Logout API failed, proceeding with local logout");
    } finally {
      localStorage.removeItem("sureride_admin_token");
      localStorage.removeItem("sureride_admin_user");
      document.cookie =
        "sureride_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      toast.success("Logged out successfully");
      window.location.href = "/login";
    }
  };

  return (
    <header style={styles.container}>
      <div style={styles.left}>
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
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        )}

        <Image src={logoIcon} alt="Sureride icon" priority style={styles.brandIcon} />
        <Image
          src={theme === "dark" ? logoNameWhite : logoNameBlack}
          alt="Sureride"
          priority
          style={styles.brandName}
        />
      </div>

      <div style={styles.right}>
        <div style={styles.iconGroup}>
          <button style={styles.iconButton}>
            <Bell size={18} />
            <span style={styles.notificationDot} />
          </button>

          <button style={styles.iconButton}>
            <MessageCircle size={18} />
          </button>

          <button style={styles.iconButton}>
            <Settings size={18} />
          </button>
        </div>

        <div style={styles.iconGroup}>
          <button
            style={{
              ...styles.iconButton,
              ...(theme === "light" ? styles.iconActive : {}),
            }}
            onClick={() => setTheme("light")}
            aria-label="Switch to light mode"
          >
            <Sun size={18} />
          </button>

          <div style={styles.divider} />

          <button
            style={{
              ...styles.iconButton,
              ...(theme === "dark" ? styles.iconActive : {}),
            }}
            onClick={() => setTheme("dark")}
            aria-label="Switch to dark mode"
          >
            <Moon size={18} />
          </button>
        </div>

        <div style={styles.profileWrapper} ref={profileRef}>
          <button style={styles.profileButton} onClick={() => setOpen((v) => !v)}>
            <User size={18} />
          </button>

          {open && (
            <div style={styles.dropdown}>
              <button style={styles.dropdownItem}>My Profile</button>
              <button style={styles.dropdownItem}>Account Settings</button>

              <div style={styles.dropdownDivider} />

              <button
                style={{ ...styles.dropdownItem, color: "#ef4444" }}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
