import type { CSSProperties } from "react";
import { RequireAdmin } from "@/src/components/auth/RequireAdmin";
import Topbar from "@/src/components/dashboard/Topbar/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <div style={styles.wrapper}>
        <div style={styles.main}>
          <Topbar />
          <div style={styles.content}>{children}</div>
        </div>
      </div>
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
    overflow: "hidden",
  },
};
