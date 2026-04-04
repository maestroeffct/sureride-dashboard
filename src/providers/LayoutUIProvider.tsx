"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type LayoutUIContextValue = {
  sidebarCollapsed: boolean;
  isMobile: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

const SIDEBAR_STORAGE_KEY = "sureride_sidebar_collapsed";
const MOBILE_BREAKPOINT = 960;
const LayoutUIContext = createContext<LayoutUIContextValue | null>(null);

function resolveIsMobile() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function resolveInitialSidebarState() {
  if (typeof window === "undefined") {
    return false;
  }

  if (resolveIsMobile()) {
    return true;
  }

  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return stored === "1";
}

export function LayoutUIProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean>(resolveIsMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    resolveInitialSidebarState
  );
  const previousIsMobileRef = useRef(isMobile);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    const onResize = () => {
      const nextIsMobile = resolveIsMobile();
      setIsMobile(nextIsMobile);

      if (nextIsMobile && !previousIsMobileRef.current) {
        setSidebarCollapsed(true);
      }

      previousIsMobileRef.current = nextIsMobile;
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      sidebarCollapsed ? "1" : "0"
    );
  }, [sidebarCollapsed]);

  return (
    <LayoutUIContext.Provider
      value={{ sidebarCollapsed, isMobile, setSidebarCollapsed, toggleSidebar }}
    >
      {children}
    </LayoutUIContext.Provider>
  );
}

export function useLayoutUIContext() {
  const ctx = useContext(LayoutUIContext);
  if (!ctx) {
    throw new Error("useLayoutUIContext must be used inside LayoutUIProvider");
  }
  return ctx;
}
