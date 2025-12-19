"use client";

import { useEffect, useState } from "react";
import { getAdminRole } from "@/src/utils/getAdminRole";
import SidebarItem from "./SidebarItem";
import styles from "./styles";
import { adminMenu } from "@/src/config/adminMenu";
import type { AdminRole } from "@/src/config/adminRoles";

export default function Sidebar() {
  const [role, setRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    const adminRole = getAdminRole();
    setRole(adminRole);
  }, []);

  // Optional: prevent flicker
  if (!role) {
    return (
      <aside style={styles.container}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>✕</div>
          <span style={styles.logoText}>SURERIDE</span>
        </div>
      </aside>
    );
  }

  return (
    <aside style={styles.container}>
      {/* LOGO */}
      <div style={styles.logoRow}>
        <div style={styles.logoIcon}>✕</div>
        <span style={styles.logoText}>SURERIDE</span>
      </div>

      {/* MENU */}
      <nav style={styles.menu}>
        {adminMenu.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(role)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} style={styles.section}>
              <p style={styles.sectionLabel}>{section.label}</p>

              {visibleItems.map((item) => (
                <SidebarItem key={item.path} item={item} />
              ))}
            </div>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div style={styles.footer}>
        <div style={styles.avatar} />
        <div>
          <p style={styles.userName}>Admin</p>
          <p style={styles.userRole}>{role.replace("_", " ")}</p>
        </div>
      </div>
    </aside>
  );
}
