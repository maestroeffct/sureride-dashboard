"use client";

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CarFront, CircleDollarSign, MapPin, ShieldCheck, TimerReset } from "lucide-react";
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
  cancelledRentals: 0,
  revenueThisMonth: 0,
  charts: {
    revenueTrend: [],
    bookingsTrend: [],
    bookingStatusBreakdown: [],
    fleetStatusBreakdown: [],
  },
  recent: {
    bookings: [],
  },
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

  const statCards = useMemo(
    () => [
      {
        label: "Revenue This Month",
        value: formatCurrency(stats.revenueThisMonth),
        subtext: `${formatNumber(stats.completedRentals)} completed rentals`,
        icon: <CircleDollarSign size={18} />,
        tone: "#0f766e",
      },
      {
        label: "Fleet Live",
        value: formatNumber(stats.totalCars),
        subtext: `${formatNumber(stats.activeCars)} approved cars`,
        icon: <CarFront size={18} />,
        tone: "#2563eb",
      },
      {
        label: "Bookings In Motion",
        value: formatNumber(stats.activeRentals),
        subtext: `${formatNumber(stats.upcomingRentals)} upcoming pickups`,
        icon: <TimerReset size={18} />,
        tone: "#ea580c",
      },
      {
        label: "Locations",
        value: formatNumber(profile?._count?.locations ?? 0),
        subtext: `${formatNumber(stats.pendingCars)} cars pending approval`,
        icon: <MapPin size={18} />,
        tone: "#7c3aed",
      },
    ],
    [profile?._count?.locations, stats],
  );

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>Provider Console</p>
          <h1 style={styles.heroTitle}>{profile?.name || "Your Fleet"}</h1>
          <p style={styles.heroSubtitle}>
            Stay on top of bookings, earnings, fleet health, and moderation without
            hunting through the sidebar.
          </p>

          <div style={styles.heroMetaRow}>
            <span style={styles.heroMetaPill}>
              <ShieldCheck size={14} />
              {profile?.isVerified ? "Verified provider" : "Verification pending"}
            </span>
            <span style={styles.heroMetaPill}>
              <MapPin size={14} />
              {profile?.businessAddress || "Business address not set"}
            </span>
          </div>
        </div>

        <div style={styles.heroActions}>
          <Link href="/provider/cars/new" style={styles.primaryButton}>
            Add Car
          </Link>
          <Link href="/provider/locations" style={styles.secondaryButton}>
            Manage Locations
          </Link>
          <Link href="/provider/rents" style={styles.secondaryButton}>
            View Rents
          </Link>
        </div>
      </section>

      <section style={styles.statsGrid}>
        {statCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={loading ? "..." : card.value}
            subtext={loading ? "Loading..." : card.subtext}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </section>

      <section style={styles.chartGrid}>
        <div style={styles.primaryChartCard}>
          <SectionHeader
            title="Revenue Trend"
            subtitle="Paid booking revenue over the last 6 months"
          />
          <LineChart
            data={stats.charts.revenueTrend}
            color="#14b8a6"
            loading={loading}
            valueFormatter={formatCurrencyCompact}
          />
        </div>

        <div style={styles.secondaryChartCard}>
          <SectionHeader
            title="Bookings Trend"
            subtitle="How many bookings your fleet received each month"
          />
          <LineChart
            data={stats.charts.bookingsTrend}
            color="#2563eb"
            loading={loading}
            valueFormatter={formatNumber}
          />
        </div>
      </section>

      <section style={styles.bottomGrid}>
        <div style={styles.card}>
          <SectionHeader
            title="Booking Status Mix"
            subtitle="Current workload spread across your rent lifecycle"
          />
          <HorizontalBreakdown
            items={stats.charts.bookingStatusBreakdown}
            loading={loading}
          />
        </div>

        <div style={styles.card}>
          <SectionHeader
            title="Fleet Status Mix"
            subtitle="What is live versus what still needs action"
          />
          <HorizontalBreakdown
            items={stats.charts.fleetStatusBreakdown}
            loading={loading}
          />
        </div>

        <div style={styles.card}>
          <SectionHeader
            title="Account Snapshot"
            subtitle="Operational details that affect bookings and payouts"
          />
          <div style={styles.list}>
            <InfoRow label="Business Email" value={profile?.email || "-"} />
            <InfoRow label="Phone" value={profile?.phone || "-"} />
            <InfoRow label="Contact Person" value={profile?.contactPersonName || "-"} />
            <InfoRow label="Status" value={profile?.status || "-"} />
            <InfoRow
              label="Business Hours"
              value={formatBusinessHours(profile)}
            />
            <InfoRow
              label="Payout Account"
              value={profile?.payoutAccount?.bankName || "Not configured"}
            />
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <SectionHeader
          title="Recent Bookings"
          subtitle="Latest renter activity hitting your fleet"
        />
        <ActivityPanel items={stats.recent.bookings} loading={loading} />
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  icon,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article style={styles.kpiCard}>
      <div style={{ ...styles.kpiIconWrap, color: tone, background: `${tone}18` }}>
        {icon}
      </div>
      <div style={styles.kpiTextBlock}>
        <span style={styles.kpiLabel}>{label}</span>
        <strong style={styles.kpiValue}>{value}</strong>
        <span style={styles.kpiSubtext}>{subtext}</span>
      </div>
    </article>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={styles.sectionHeader}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.sectionSubtitle}>{subtitle}</p>
    </div>
  );
}

function LineChart({
  data,
  color,
  loading,
  valueFormatter,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
  loading: boolean;
  valueFormatter: (value: number) => string;
}) {
  if (loading) {
    return <div style={styles.chartLoading}>Loading chart...</div>;
  }

  if (!data.length) {
    return <div style={styles.chartLoading}>No data yet</div>;
  }

  const max = Math.max(...data.map((point) => point.value), 1);
  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - (point.value / max) * 100;
    return `${x},${y}`;
  });

  const areaPath = `0,100 ${points.join(" ")} 100,100`;

  return (
    <div style={styles.lineChartWrap}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.chartSvg}>
        <defs>
          <linearGradient id="providerAreaFill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`M ${areaPath}`} fill="url(#providerAreaFill)" stroke="none" />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(" ")}
        />
      </svg>

      <div style={styles.chartLegendRow}>
        {data.map((point) => (
          <div key={`${point.label}-${point.value}`} style={styles.chartLegendItem}>
            <span style={styles.chartLegendLabel}>{point.label}</span>
            <strong style={styles.chartLegendValue}>
              {valueFormatter(point.value)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBreakdown({
  items,
  loading,
}: {
  items: Array<{ label: string; value: number }>;
  loading: boolean;
}) {
  if (loading) {
    return <div style={styles.chartLoading}>Loading breakdown...</div>;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (!items.length || total === 0) {
    return <div style={styles.chartLoading}>No activity yet</div>;
  }

  return (
    <div style={styles.breakdownList}>
      {items.map((item, index) => {
        const width = `${Math.max((item.value / total) * 100, 6)}%`;
        const color = BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];

        return (
          <div key={item.label} style={styles.breakdownRow}>
            <div style={styles.breakdownHeader}>
              <span style={styles.breakdownLabel}>{item.label}</span>
              <strong style={styles.breakdownValue}>{formatNumber(item.value)}</strong>
            </div>
            <div style={styles.breakdownTrack}>
              <div style={{ ...styles.breakdownBar, width, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityPanel({
  items,
  loading,
}: {
  items: ProviderDashboardStats["recent"]["bookings"];
  loading: boolean;
}) {
  if (loading) {
    return <div style={styles.chartLoading}>Loading recent activity...</div>;
  }

  if (!items.length) {
    return <div style={styles.chartLoading}>No bookings yet</div>;
  }

  return (
    <div style={styles.activityList}>
      {items.map((item) => (
        <div key={item.id} style={styles.activityRow}>
          <div style={styles.activityTextBlock}>
            <strong style={styles.activityTitle}>{item.title}</strong>
            <span style={styles.activitySubtitle}>{item.subtitle}</span>
          </div>
          <div style={styles.activityMeta}>
            <span style={styles.statusChip}>{item.status}</span>
            <strong style={styles.activityValue}>
              {formatCurrency(item.value ?? 0)}
            </strong>
          </div>
        </div>
      ))}
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatBusinessHours(profile: ProviderProfile | null) {
  if (!profile?.businessOpeningTime || !profile?.businessClosingTime) {
    return "Not configured";
  }

  const days =
    profile.businessOperatingDays && profile.businessOperatingDays.length > 0
      ? profile.businessOperatingDays.join(", ")
      : "Every day";

  return `${profile.businessOpeningTime} - ${profile.businessClosingTime} • ${days}`;
}

const BREAKDOWN_COLORS = ["#2563eb", "#14b8a6", "#ea580c", "#7c3aed"];

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
    maxWidth: 1360,
  },
  hero: {
    borderRadius: 28,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.22) 45%, rgba(13,148,136,0.2))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  heroContent: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 760,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--fg-60)",
  },
  heroTitle: {
    margin: 0,
    fontSize: 34,
    fontWeight: 700,
  },
  heroSubtitle: {
    margin: 0,
    color: "var(--fg-75)",
    lineHeight: 1.6,
  },
  heroMetaRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 4,
  },
  heroMetaPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    color: "var(--foreground)",
    fontSize: 13,
    fontWeight: 600,
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  kpiCard: {
    borderRadius: 20,
    padding: 20,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  kpiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  kpiTextBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  kpiLabel: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  kpiSubtext: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
    gap: 18,
  },
  primaryChartCard: {
    borderRadius: 24,
    padding: 22,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0,
  },
  secondaryChartCard: {
    borderRadius: 24,
    padding: 22,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  sectionHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  sectionSubtitle: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 14,
    lineHeight: 1.5,
  },
  chartLoading: {
    minHeight: 180,
    display: "grid",
    placeItems: "center",
    color: "var(--fg-60)",
    fontSize: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.02)",
  },
  lineChartWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  chartSvg: {
    width: "100%",
    height: 240,
    borderRadius: 18,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
  },
  chartLegendRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
    gap: 10,
  },
  chartLegendItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
  },
  chartLegendLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
  },
  chartLegendValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  breakdownList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  breakdownRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  breakdownHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: "var(--fg-75)",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 700,
  },
  breakdownTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  breakdownBar: {
    height: "100%",
    borderRadius: 999,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 12,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexWrap: "wrap",
  },
  infoLabel: {
    color: "var(--fg-60)",
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 600,
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  activityRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)",
    flexWrap: "wrap",
  },
  activityTextBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  activitySubtitle: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
  activityMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  statusChip: {
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(37,99,235,0.14)",
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  activityValue: {
    fontSize: 14,
    fontWeight: 700,
  },
};
