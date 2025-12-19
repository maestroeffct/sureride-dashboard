// src/components/dashboard/Sidebar/SidebarSection.tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import styles from "./styles";
import SidebarItem from "./SidebarItem";
import { AdminMenuSection } from "@/src/config/adminMenu";
import { SidebarIcon } from "./SidebarIcons";

export default function SidebarSection({
  section,
}: {
  section: AdminMenuSection;
}) {
  const pathname = usePathname();

  const isActiveSection = section.items.some((item) => pathname === item.path);

  const [open, setOpen] = useState(isActiveSection);

  return (
    <div style={styles.section}>
      <button
        style={{
          ...styles.sectionHeader,
          ...(isActiveSection ? styles.sectionHeaderActive : {}),
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div style={styles.sectionLeft}>
          <SidebarIcon name={section.icon} />
          <span>{section.label}</span>
        </div>

        <ChevronDown
          size={16}
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {open && (
        <div style={styles.sectionItems}>
          {section.items.map((item) => (
            <SidebarItem key={item.path} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
