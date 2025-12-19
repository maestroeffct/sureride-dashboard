// src/components/dashboard/Sidebar/Sidebar.tsx
"use client";

import styles from "./styles";
import { adminMenu } from "@/src/config/adminMenu";
import SidebarSection from "./SidebarSection";

export default function Sidebar() {
  return (
    <aside style={styles.container}>
      {/* LOGO */}
      <div style={styles.logoRow}>
        <span style={styles.logoText}>SURERIDE</span>
      </div>

      {/* MENU */}
      <nav style={styles.menu}>
        {adminMenu.map((section) => (
          <SidebarSection key={section.label} section={section} />
        ))}
      </nav>

      {/* FOOTER */}
      <div style={styles.footer}>
        <button style={styles.logoutButton}>Logout</button>
      </div>
    </aside>
  );
}
