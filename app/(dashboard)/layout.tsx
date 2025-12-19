import type { CSSProperties } from "react";
import Sidebar from "@/src/components/dashboard/Sidebar/Sidebar";
import Topbar from "@/src/components/dashboard/Topbar/Topbar";
import { RequireAdmin } from "@/src/components/auth/RequireAdmin";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <div style={styles.wrapper}>
        <Sidebar />

        <div style={styles.main}>
          <Topbar />
          <div style={styles.content}>{children}</div>
        </div>
      </div>
    </RequireAdmin>
  );
}
const styles: {
  wrapper: CSSProperties;
  main: CSSProperties;
  content: CSSProperties;
} = {
  wrapper: {
    display: "flex",
    height: "100vh",
    background: "#0B0E14",
    color: "#E5E7EB",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
  },
};
