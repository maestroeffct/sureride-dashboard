import type { CSSProperties } from "react";
import { RequireAdmin } from "@/src/components/auth/RequireAdmin";
import Topbar from "@/src/components/dashboard/Topbar/Topbar";
import { LayoutUIProvider } from "@/src/providers/LayoutUIProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <LayoutUIProvider>
        <div style={styles.wrapper}>
          <div style={styles.main}>
            <Topbar />
            <div style={styles.content}>{children}</div>
          </div>
        </div>
      </LayoutUIProvider>
    </RequireAdmin>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    height: "100vh",
    background: "var(--background)",
    color: "var(--foreground)",
    fontFamily: "var(--font-poppins), system-ui, sans-serif",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
};
