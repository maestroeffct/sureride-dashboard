"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./styles";
import {
  Search,
  Bell,
  MessageCircle,
  Settings,
  Sun,
  Moon,
  User,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Topbar() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [open, setOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "sureride_admin_token"
            )}`,
          },
        }
      );
    } catch (error) {
      console.warn("Logout API failed, proceeding with local logout");
    } finally {
      // Clear frontend auth state
      localStorage.removeItem("sureride_admin_token");
      localStorage.removeItem("sureride_admin_user");

      // If you ever add cookies later, this stays safe
      document.cookie =
        "sureride_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      toast.success("Logged out successfully");
      // Redirect
      window.location.href = "/login";
    }
  };

  return (
    <header style={styles.container}>
      {/* LEFT: SEARCH */}
      <div style={styles.left}>
        <div style={styles.searchPill}>
          <Search size={16} style={styles.searchIcon} />
          <input placeholder="Search something..." style={styles.searchInput} />
        </div>

        <button style={styles.searchButton}>Search</button>
      </div>

      {/* RIGHT */}
      <div style={styles.right}>
        {/* ICON GROUP 1 */}
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

        {/* ICON GROUP 2 (THEME) */}
        <div style={styles.iconGroup}>
          <button
            style={{
              ...styles.iconButton,
              ...(theme === "light" ? styles.iconActive : {}),
            }}
            onClick={() => setTheme("light")}
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
          >
            <Moon size={18} />
          </button>
        </div>

        {/* PROFILE */}
        <div style={styles.profileWrapper} ref={profileRef}>
          <button
            style={styles.profileButton}
            onClick={() => setOpen((v) => !v)}
          >
            <User size={18} />
          </button>

          {open && (
            <div style={styles.dropdown}>
              <button style={styles.dropdownItem}>My Profile</button>
              <button style={styles.dropdownItem}>Account Settings</button>

              <div style={styles.dropdownDivider} />

              <button
                style={{ ...styles.dropdownItem, color: "#EF4444" }}
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
