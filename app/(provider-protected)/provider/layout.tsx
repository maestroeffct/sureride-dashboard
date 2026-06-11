"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Topbar from "@/src/components/dashboard/Topbar/Topbar";
import Sidebar from "@/src/components/dashboard/Sidebar/Sidebar";
import { RequireProvider } from "@/src/components/auth/RequireProvider";
import { LayoutUIProvider } from "@/src/providers/LayoutUIProvider";
import { useLayoutUI } from "@/src/hooks/useLayoutUI";
import { getProviderProfile, type ProviderProfile } from "@/src/lib/providerApi";

// A profile is "complete" when at minimum phone + contact name + address are set.
function isProfileComplete(p: ProviderProfile): boolean {
  return !!(p.phone?.trim() && p.contactPersonName?.trim() && p.businessAddress?.trim());
}

const COMPLETE_PROFILE_PATH = "/provider/complete-profile";

function ProviderShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, isMobile } = useLayoutUI();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't gate the complete-profile page itself
    if (pathname === COMPLETE_PROFILE_PATH) {
      setChecked(true);
      return;
    }

    getProviderProfile()
      .then((profile) => {
        if (!isProfileComplete(profile)) {
          router.replace(COMPLETE_PROFILE_PATH);
        } else {
          setChecked(true);
        }
      })
      .catch(() => {
        // If the API fails, allow access (don't hard-block on network errors)
        setChecked(true);
      });
  }, [pathname, router]);

  // Complete-profile page is full-screen — no chrome
  if (pathname === COMPLETE_PROFILE_PATH) {
    return <>{children}</>;
  }

  // Show a spinner while the profile gate check is in flight
  if (!checked) {
    return (
      <div style={styles.gateLoader}>
        <div style={styles.gateSpinner} />
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <Topbar />
      <div style={styles.body}>
        <Sidebar module="providerRentals" collapsed={sidebarCollapsed} />
        <main style={{ ...styles.main, padding: isMobile ? 16 : 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
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
  gateLoader: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--background)",
  },
  gateSpinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid var(--input-border)",
    borderTopColor: "var(--brand-primary)",
    animation: "spin 0.8s linear infinite",
  },
};
