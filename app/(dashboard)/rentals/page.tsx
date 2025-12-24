"use client";

import { styles } from "./styles";

export default function RentalsDashboardPage() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Car Rental Dashboard</h1>
      <p style={styles.subtitle}>Overview of rental performance and activity</p>

      {/* KPI CARDS */}
      <div style={styles.kpiGrid}>
        <KpiCard label="Total Cars" value="128" />
        <KpiCard label="Active Bookings" value="34" />
        <KpiCard label="Ongoing Rentals" value="21" />
        <KpiCard label="Revenue (This Month)" value="₦4.2M" />
      </div>

      {/* PLACEHOLDERS */}
      <div style={styles.section}>
        <h3>Recent Bookings</h3>
        <div style={styles.placeholder}>Bookings table goes here</div>
      </div>

      <div style={styles.section}>
        <h3>Issues & Alerts</h3>
        <div style={styles.placeholder}>Issues feed goes here</div>
      </div>
    </div>
  );
}

/* ---------------------------------- */

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.kpiCard}>
      <span style={styles.kpiLabel}>{label}</span>
      <strong style={styles.kpiValue}>{value}</strong>
    </div>
  );
}
