import type { CSSProperties } from "react";
import Sidebar from "@/src/components/dashboard/Sidebar/Sidebar";
import Topbar from "@/src/components/dashboard/Topbar/Topbar";

export default function RentalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={styles.wrapper}>
      <Sidebar module="rentals" />
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "flex",
    height: "100vh",
  },
  main: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
  },
};
