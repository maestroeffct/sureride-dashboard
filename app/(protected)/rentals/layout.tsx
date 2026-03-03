import type { CSSProperties } from "react";
import Sidebar from "@/src/components/dashboard/Sidebar/Sidebar";

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
    height: "100%",
    minHeight: 0,
  },
  main: {
    flex: 1,
    minHeight: 0,
    padding: 24,
    overflowY: "auto",
  },
};
