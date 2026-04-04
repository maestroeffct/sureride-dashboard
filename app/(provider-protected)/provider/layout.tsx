"use client";

import type { CSSProperties } from "react";
import Topbar from "@/src/components/dashboard/Topbar/Topbar";
import Sidebar from "@/src/components/dashboard/Sidebar/Sidebar";
import { RequireProvider } from "@/src/components/auth/RequireProvider";
import { LayoutUIProvider } from "@/src/providers/LayoutUIProvider";
import { useLayoutUI } from "@/src/hooks/useLayoutUI";

function ProviderShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, isMobile } = useLayoutUI();

  return (
    <div style={styles.wrapper}>
      <Topbar />
      <div style={styles.body}>
        <Sidebar module="providerRentals" collapsed={sidebarCollapsed} />
        <main
          style={{
            ...styles.main,
            padding: isMobile ? 16 : 24,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireProvider>
      <LayoutUIProvider>
        <ProviderShell>{children}</ProviderShell>
      </LayoutUIProvider>
    </RequireProvider>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    height: "100vh",
    background: "var(--background)",
    color: "var(--foreground)",
    display: "flex",
    flexDirection: "column",
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: "flex",
  },
  main: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: 24,
  },
};
