"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type LayoutUIContextValue = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

const SIDEBAR_STORAGE_KEY = "sureride_sidebar_collapsed";
const LayoutUIContext = createContext<LayoutUIContextValue | null>(null);

function resolveInitialSidebarState() {
  if (typeof window === "undefined") {
    return false;
  }

  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return stored === "1";
}

export function LayoutUIProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    resolveInitialSidebarState
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      sidebarCollapsed ? "1" : "0"
    );
  }, [sidebarCollapsed]);

  return (
    <LayoutUIContext.Provider
      value={{ sidebarCollapsed, setSidebarCollapsed, toggleSidebar }}
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
