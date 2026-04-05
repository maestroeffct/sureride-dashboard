"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarMenus } from "@/src/config/sidebar";
import { SidebarModule, SidebarItem } from "@/src/types/sidebar";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLayoutUI } from "@/src/hooks/useLayoutUI";

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
  const { isMobile, setSidebarCollapsed } = useLayoutUI();

  const sidebarStyle: React.CSSProperties = isMobile
    ? {
        ...styles.sidebar,
        position: "fixed",
        top: 72,
        left: 0,
        bottom: 0,
        width: 280,
        minWidth: 280,
        zIndex: 70,
        borderRight: "1px solid var(--sidebar-border)",
        boxShadow: collapsed ? "none" : "0 24px 60px rgba(0,0,0,0.28)",
        transform: collapsed ? "translateX(-100%)" : "translateX(0)",
        opacity: 1,
      }
    : {
        ...styles.sidebar,
        width: collapsed ? 0 : 260,
        minWidth: collapsed ? 0 : 260,
        borderRight: collapsed ? "none" : "1px solid var(--sidebar-border)",
        opacity: collapsed ? 0 : 1,
      };

  return (
    <>
      {isMobile && !collapsed ? (
        <button
          type="button"
          aria-label="Close navigation"
          style={styles.backdrop}
          onClick={() => setSidebarCollapsed(true)}
        />
      ) : null}

      <aside style={sidebarStyle} aria-hidden={collapsed}>
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
    </>
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
  const { isMobile, setSidebarCollapsed } = useLayoutUI();
  const Icon = item.icon;

  const hasActiveChild = useMemo(
    () =>
      item.children?.some((child) => {
        const childPath = basePath(child.path);
        return childPath ? pathname.startsWith(childPath) : false;
      }) ?? false,
    [item.children, pathname]
  );

  const [open, setOpen] = useState<boolean>(hasActiveChild);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredChildPath, setHoveredChildPath] = useState<string | null>(null);

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild]);

  const isActive = Boolean(item.path) && pathname === basePath(item.path);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...styles.groupButton,
            background:
              open || isHovered
                ? "var(--sidebar-group-open-bg)"
                : "transparent",
            color:
              open || hasActiveChild || isHovered
                ? "var(--sidebar-item-active-fg)"
                : "var(--sidebar-item-fg-muted)",
            transform:
              open || isHovered ? "translateX(2px)" : "translateX(0)",
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
                      onClick={() => {
                        if (isMobile) {
                          setSidebarCollapsed(true);
                        }
                      }}
                      style={{
                        ...styles.childItem,
                        background: active
                          ? "var(--sidebar-item-active-bg)"
                          : hoveredChildPath === child.path
                            ? "rgba(255,255,255,0.05)"
                          : "transparent",
                        color: active
                          ? "var(--sidebar-item-active-fg)"
                          : hoveredChildPath === child.path
                            ? "var(--sidebar-item-fg)"
                          : "var(--sidebar-item-fg-muted)",
                        transform:
                          active || hoveredChildPath === child.path
                            ? "translateX(2px)"
                            : "translateX(0)",
                      }}
                      onMouseEnter={() => setHoveredChildPath(child.path ?? null)}
                      onMouseLeave={() => setHoveredChildPath(null)}
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isMobile) {
          setSidebarCollapsed(true);
        }
      }}
      style={{
        ...styles.item,
        background: isActive
          ? "var(--sidebar-item-active-bg)"
          : isHovered
            ? "rgba(255,255,255,0.05)"
            : "transparent",
        color: isActive
          ? "var(--sidebar-item-active-fg)"
          : isHovered
            ? "var(--sidebar-item-fg)"
          : "var(--sidebar-item-fg-muted)",
        transform:
          isActive || isHovered ? "translateX(2px)" : "translateX(0)",
      }}
    >
      {Icon && <Icon size={18} />}
      <span>{item.label}</span>
    </Link>
  );
}

const styles: {
  sidebar: React.CSSProperties;
  backdrop: React.CSSProperties;
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
  backdrop: {
    position: "fixed",
    inset: "72px 0 0 0",
    background: "rgba(2, 6, 23, 0.42)",
    border: "none",
    padding: 0,
    margin: 0,
    zIndex: 60,
    cursor: "pointer",
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
    transition:
      "background-color 160ms ease, color 160ms ease, transform 160ms ease",
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
    transition:
      "background-color 160ms ease, color 160ms ease, transform 160ms ease",
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
    transition:
      "background-color 160ms ease, color 160ms ease, transform 160ms ease",
  },
};
