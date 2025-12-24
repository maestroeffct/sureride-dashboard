"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarMenus } from "@/src/config/sidebar";
import { SidebarModule, SidebarItem } from "@/src/types/sidebar";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */

export default function Sidebar({ module }: { module: SidebarModule }) {
  const pathname = usePathname();
  const menu = sidebarMenus[module];

  return (
    <aside style={styles.sidebar}>
      {menu.map((item) => (
        <SidebarItemView
          key={item.label}
          item={item}
          pathname={pathname}
          module={module}
        />
      ))}
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar Item */
/* ------------------------------------------------------------------ */

function SidebarItemView({
  item,
  pathname,
  module,
}: {
  item: SidebarItem;
  pathname: string;
  module: SidebarModule;
}) {
  const Icon = item.icon;

  const hasActiveChild = useMemo(
    () =>
      item.children?.some((child) => pathname.startsWith(child.path ?? "")) ??
      false,
    [item.children, pathname]
  );

  const storageKey = `sidebar:${module}:${item.label}`;

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return hasActiveChild;
    const stored = localStorage.getItem(storageKey);
    return stored ? stored === "open" : hasActiveChild;
  });

  // keep in sync with route
  useEffect(() => {
    if (hasActiveChild) {
      // Defer the state update to avoid synchronous setState inside the effect
      const id = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(id);
    }
  }, [hasActiveChild]);

  // persist open state
  useEffect(() => {
    localStorage.setItem(storageKey, open ? "open" : "closed");
  }, [open, storageKey]);

  const isActive = item.path && pathname === item.path;

  /* ---------------- GROUP (DROPDOWN) ---------------- */

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            ...styles.groupButton,
            background: open ? "#0F172A" : "transparent",
          }}
        >
          {Icon && <Icon size={18} />}
          <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>

          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <ChevronDown size={16} />
          </motion.span>
        </button>

        {/* Animated dropdown */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              {item.children.map((child, index) => {
                const ChildIcon = child.icon;
                const active = pathname === child.path;

                return (
                  <motion.div
                    key={child.path}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.04, // 👈 subtle stagger
                    }}
                  >
                    <Link
                      href={child.path!}
                      style={{
                        ...styles.childItem,
                        background: active ? "#1E293B" : "transparent",
                        color: active ? "#E5E7EB" : "#9CA3AF",
                      }}
                    >
                      {ChildIcon && <ChildIcon size={16} />}
                      <span>{child.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ---------------- SINGLE ITEM ---------------- */

  return (
    <Link
      href={item.path!}
      style={{
        ...styles.item,
        background: isActive ? "#1E293B" : "transparent",
        color: isActive ? "#E5E7EB" : "#9CA3AF",
      }}
    >
      {Icon && <Icon size={18} />}
      <span>{item.label}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Styles */
/* ------------------------------------------------------------------ */

const styles: {
  sidebar: React.CSSProperties;
  item: React.CSSProperties;
  groupButton: React.CSSProperties;
  childItem: React.CSSProperties;
} = {
  sidebar: {
    width: 260,
    padding: 16,
    background: "#020617",
    borderRight: "1px solid #1F2937",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 14,
    transition: "background 0.2s ease, transform 0.15s ease",
  },

  groupButton: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    width: "100%",
    color: "#9CA3AF",
    fontSize: 14,
    transition: "background 0.2s ease",
  },

  childItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px 8px 40px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 13,
    transition: "background 0.2s ease, transform 0.15s ease",
  },
};
