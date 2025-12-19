import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Dashboard - SureRide",
  description: "SureRide admin dashboard",
};

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.app}>
          <aside style={styles.sidebar}>
            <div style={styles.brand}>SureRide</div>
            <nav style={styles.nav}>
              <Link href="/dashboard" style={styles.navLink}>
                Overview
              </Link>
              <Link href="/dashboard/trips" style={styles.navLink}>
                Trips
              </Link>
              <Link href="/dashboard/drivers" style={styles.navLink}>
                Drivers
              </Link>
              <Link href="/dashboard/customers" style={styles.navLink}>
                Customers
              </Link>
              <Link href="/dashboard/settings" style={styles.navLink}>
                Settings
              </Link>
            </nav>
          </aside>

          <div style={styles.container}>
            <header style={styles.header}>
              <div style={styles.headerTitle}>Dashboard</div>
              <div style={styles.headerActions}>
                <button style={styles.button}>New Trip</button>
                <button style={styles.button}>Sign out</button>
              </div>
            </header>

            <main style={styles.main}>{children}</main>

            <footer style={styles.footer}>
              © {new Date().getFullYear()} SureRide — All rights reserved
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    background: "#f6f7fb",
    color: "#111827",
  },
  app: {
    display: "flex",
    minHeight: "100vh",
  },
  sidebar: {
    width: 240,
    background: "#0f172a",
    color: "#fff",
    padding: "24px 16px",
    boxSizing: "border-box",
  },
  brand: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  navLink: {
    color: "rgba(255,255,255,0.9)",
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 6,
    fontSize: 14,
  },
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  header: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderBottom: "1px solid rgba(15,23,42,0.06)",
    background: "#fff",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  headerActions: {
    display: "flex",
    gap: 10,
  },
  button: {
    background: "#111827",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  main: {
    flex: 1,
    padding: 24,
  },
  footer: {
    padding: 16,
    textAlign: "center",
    fontSize: 13,
    color: "#6b7280",
    borderTop: "1px solid rgba(15,23,42,0.04)",
    background: "#fff",
  },
};
