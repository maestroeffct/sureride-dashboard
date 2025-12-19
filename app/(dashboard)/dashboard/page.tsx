import StatCard from "@/src/components/dashboard/StatCard/StatCard";
import styles from "./styles";

export default function DashboardPage() {
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Here is today’s report and performance</p>
      </div>

      {/* STATS */}
      <div style={styles.statsGrid}>
        <StatCard title="Total Users" value="12,600" change="+2%" />
        <StatCard title="Active Rentals" value="1186" change="+15%" />
        <StatCard title="Ongoing Rides" value="22" change="+2%" />
        <StatCard title="Satisfaction Rate" value="89.9%" change="+5%" />
      </div>

      {/* CHARTS */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>📊 Performance Chart</div>
        <div style={styles.chartCard}>🟣 Attendance Chart</div>
      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>
        <h3>Recent Users</h3>
        <div style={styles.tableRow}>
          <span>#ZY9653</span>
          <span>Arlene McCoy</span>
          <span>Active</span>
        </div>
        <div style={styles.tableRow}>
          <span>#ZY9652</span>
          <span>Darlene Robertson</span>
          <span>Active</span>
        </div>
      </div>
    </div>
  );
}
