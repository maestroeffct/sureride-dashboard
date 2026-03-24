"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarMenus } from "@/src/config/sidebar";
import { SidebarModule, SidebarItem } from "@/src/types/sidebar";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const basePath = (path?: string) => path?.split("?")[0] ?? "";

export default function Sidebar({
  module,
  collapsed = false,
}: {
  module: SidebarModule;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const menu = sidebarMenus[module];

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: collapsed ? 0 : 260,
        minWidth: collapsed ? 0 : 260,
        borderRight: collapsed ? "none" : "1px solid var(--sidebar-border)",
        opacity: collapsed ? 0 : 1,
      }}
      aria-hidden={collapsed}
    >
      <div
        style={{
          ...styles.scrollArea,
          pointerEvents: collapsed ? "none" : "auto",
        }}
      >
        {menu.map((item) =>
          item.kind === "section" ? (
            <div key={`section-${item.label}`} style={styles.sectionLabel}>
              {item.label}
            </div>
          ) : (
            <SidebarItemView
              key={item.label}
              item={item}
              pathname={pathname}
              module={module}
            />
          )
        )}
      </div>
    </aside>
  );
}

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
      item.children?.some((child) => {
        const childPath = basePath(child.path);
        return childPath ? pathname.startsWith(childPath) : false;
      }) ?? false,
    [item.children, pathname]
  );

  const storageKey = `sidebar:${module}:${item.label}`;

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return hasActiveChild;
    const stored = localStorage.getItem(storageKey);
    return stored ? stored === "open" : hasActiveChild;
  });

  useEffect(() => {
    if (hasActiveChild) {
      const id = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(id);
    }
  }, [hasActiveChild]);

  useEffect(() => {
    localStorage.setItem(storageKey, open ? "open" : "closed");
  }, [open, storageKey]);

  const isActive = Boolean(item.path) && pathname === basePath(item.path);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            ...styles.groupButton,
            background: open ? "var(--sidebar-group-open-bg)" : "transparent",
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
                const active = pathname === basePath(child.path);

                if (!child.path) {
                  return null;
                }

                return (
                  <motion.div
                    key={child.path}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.04,
                    }}
                  >
                    <Link
                      href={child.path}
                      style={{
                        ...styles.childItem,
                        background: active
                          ? "var(--sidebar-item-active-bg)"
                          : "transparent",
                        color: active
                          ? "var(--sidebar-item-active-fg)"
                          : "var(--sidebar-item-fg-muted)",
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

  if (!item.path) {
    return null;
  }

  return (
    <Link
      href={item.path}
      style={{
        ...styles.item,
        background: isActive ? "var(--sidebar-item-active-bg)" : "transparent",
        color: isActive
          ? "var(--sidebar-item-active-fg)"
          : "var(--sidebar-item-fg-muted)",
      }}
    >
      {Icon && <Icon size={18} />}
      <span>{item.label}</span>
    </Link>
  );
}

const styles: {
  sidebar: React.CSSProperties;
  scrollArea: React.CSSProperties;
  sectionLabel: React.CSSProperties;
  item: React.CSSProperties;
  groupButton: React.CSSProperties;
  childItem: React.CSSProperties;
} = {
  sidebar: {
    width: 260,
    height: "100%",
    minHeight: 0,
    background: "var(--sidebar-bg)",
    borderRight: "1px solid var(--sidebar-border)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "width 220ms ease, opacity 180ms ease, border-color 180ms ease",
  },

  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: "var(--sidebar-item-fg-muted)",
    opacity: 0.85,
    textTransform: "uppercase",
    padding: "14px 10px 6px",
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 14,
    textDecoration: "none",
    cursor: "pointer",
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
    fontSize: 14,
    color: "var(--sidebar-item-fg-muted)",
  },

  childItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px 8px 40px",
    borderRadius: 8,
    fontSize: 13,
    textDecoration: "none",
    cursor: "pointer",
  },
};
