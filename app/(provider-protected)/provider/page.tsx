"use client";

import { type CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  getProviderDashboardStats,
  getProviderProfile,
  type ProviderDashboardStats,
  type ProviderProfile,
} from "@/src/lib/providerApi";

const emptyStats: ProviderDashboardStats = {
  totalCars: 0,
  activeCars: 0,
  pendingCars: 0,
  activeRentals: 0,
  upcomingRentals: 0,
  completedRentals: 0,
  revenueThisMonth: 0,
};

export default function ProviderOverviewPage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [stats, setStats] = useState<ProviderDashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [profileResponse, statsResponse] = await Promise.all([
          getProviderProfile(),
          getProviderDashboardStats(),
        ]);
        setProfile(profileResponse);
        setStats(statsResponse);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load provider dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Provider Console</p>
          <h1 style={styles.title}>{profile?.name || "Your Fleet"}</h1>
          <p style={styles.subtitle}>
            Track fleet status, moderation progress, and live rentals from one place.
          </p>
        </div>

        <div style={styles.heroActions}>
          <Link href="/provider/cars/new" style={styles.primaryButton}>
            Add Car
          </Link>
          <Link href="/provider/insurance" style={styles.secondaryButton}>
            Insurance
          </Link>
          <Link href="/provider/rents" style={styles.secondaryButton}>
            View Rents
          </Link>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <KpiCard label="Total Cars" value={stats.totalCars} loading={loading} />
        <KpiCard label="Active Cars" value={stats.activeCars} loading={loading} />
        <KpiCard label="Pending Approval" value={stats.pendingCars} loading={loading} />
        <KpiCard label="Active Rentals" value={stats.activeRentals} loading={loading} />
        <KpiCard label="Upcoming Rentals" value={stats.upcomingRentals} loading={loading} />
        <KpiCard
          label="Revenue This Month"
          value={`NGN ${stats.revenueThisMonth.toLocaleString()}`}
          loading={loading}
        />
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Account Snapshot</h2>
          <div style={styles.list}>
            <InfoRow label="Business Email" value={profile?.email || "-"} />
            <InfoRow label="Phone" value={profile?.phone || "-"} />
            <InfoRow
              label="Contact Person"
              value={profile?.contactPersonName || "-"}
            />
            <InfoRow
              label="Business Address"
              value={profile?.businessAddress || "-"}
            />
            <InfoRow label="Status" value={profile?.status || "-"} />
            <InfoRow
              label="Verification"
              value={profile?.isVerified ? "Verified" : "Pending"}
            />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Quick Actions</h2>
          <div style={styles.actionStack}>
            <Link href="/provider/cars" style={styles.actionLink}>
              Manage fleet inventory
            </Link>
            <Link href="/provider/locations" style={styles.actionLink}>
              Maintain pickup locations
            </Link>
            <Link href="/provider/cars/new" style={styles.actionLink}>
              Upload a new car listing
            </Link>
            <Link href="/provider/insurance" style={styles.actionLink}>
              Configure insurance packages
            </Link>
            <Link href="/provider/rents" style={styles.actionLink}>
              Monitor booking and rent activity
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div style={styles.kpiCard}>
      <span style={styles.kpiLabel}>{label}</span>
      <strong style={styles.kpiValue}>{loading ? "..." : value}</strong>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
    maxWidth: 1280,
  },
  hero: {
    borderRadius: 28,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(13,148,136,0.22))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--fg-60)",
  },
  title: {
    margin: "8px 0 10px",
    fontSize: 34,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    maxWidth: 680,
    color: "var(--fg-75)",
    lineHeight: 1.6,
  },
  heroActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: 12,
    background: "var(--brand-primary)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    textDecoration: "none",
    fontWeight: 700,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  kpiCard: {
    borderRadius: 18,
    padding: 20,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  kpiLabel: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(280px, 0.7fr)",
    gap: 18,
  },
  card: {
    borderRadius: 20,
    padding: 22,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingBottom: 12,
    borderBottom: "1px solid var(--input-border)",
  },
  infoLabel: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
  infoValue: {
    fontSize: 14,
    color: "var(--foreground)",
  },
  actionStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  actionLink: {
    borderRadius: 14,
    padding: "14px 16px",
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    textDecoration: "none",
    fontWeight: 600,
  },
};
