"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Topbar from "@/src/components/dashboard/Topbar/Topbar";
import Sidebar from "@/src/components/dashboard/Sidebar/Sidebar";
import { RequireProvider } from "@/src/components/auth/RequireProvider";
import { LayoutUIProvider } from "@/src/providers/LayoutUIProvider";
import { useLayoutUI } from "@/src/hooks/useLayoutUI";
import {
  getProviderProfile,
  getProviderVerificationStatus,
  type ProviderProfile,
} from "@/src/lib/providerApi";

// A profile is "complete" when at minimum phone + contact name + address are set.
function isProfileComplete(p: ProviderProfile): boolean {
  return !!(p.phone?.trim() && p.contactPersonName?.trim() && p.businessAddress?.trim());
}

const COMPLETE_PROFILE_PATH = "/provider/complete-profile";
const VERIFICATION_PATH = "/provider/verification";
const OVERVIEW_PATH = "/provider";
const SETTINGS_PATH = "/provider/settings";

// Pages an unverified provider may still access. Everything else redirects
// to the Verification Center until the business is verified.
const UNVERIFIED_ALLOWED = new Set<string>([
  OVERVIEW_PATH,
  VERIFICATION_PATH,
  COMPLETE_PROFILE_PATH,
  SETTINGS_PATH,
]);

function isUnverifiedAllowed(pathname: string): boolean {
  if (UNVERIFIED_ALLOWED.has(pathname)) return true;
  // Sub-routes under settings/verification are also fine (e.g. nested edit pages).
  if (
    pathname.startsWith(`${VERIFICATION_PATH}/`) ||
    pathname.startsWith(`${SETTINGS_PATH}/`)
  ) {
    return true;
  }
  return false;
}

function ProviderShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, isMobile } = useLayoutUI();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState<
    "OWNER" | "FLEET_MANAGER" | "OPERATIONS" | "FINANCE" | "CUSTOMER_SERVICE"
  >("OWNER");
  const [canListCars, setCanListCars] = useState<boolean>(true);

  useEffect(() => {
    // Don't gate the complete-profile page itself
    if (pathname === COMPLETE_PROFILE_PATH) {
      setChecked(true);
      return;
    }

    Promise.all([
      getProviderProfile(),
      getProviderVerificationStatus().catch(() => null),
    ])
      .then(([profile, verification]) => {
        if (profile.session?.role) {
          setRole(profile.session.role as typeof role);
        }
        if (!isProfileComplete(profile)) {
          router.replace(COMPLETE_PROFILE_PATH);
          return;
        }

        // Verification gate — block every operational page until verified.
        const verified = verification?.canListCars ?? false;
        setCanListCars(verified);
        if (!verified && !isUnverifiedAllowed(pathname)) {
          router.replace(VERIFICATION_PATH);
          return;
        }

        setChecked(true);
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
        <Sidebar
          module="providerRentals"
          collapsed={sidebarCollapsed}
          role={role}
          verified={canListCars}
        />
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
