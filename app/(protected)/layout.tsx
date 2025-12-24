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
          <div style={styles.content}>
            {children} {/* modules render here */}
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    height: "100vh",
    background: "#0B0E14",
    color: "#E5E7EB",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  content: {
    flex: 1,
    // display: "flex", // 👈 IMPORTANT
    overflow: "hidden",
  },
};
