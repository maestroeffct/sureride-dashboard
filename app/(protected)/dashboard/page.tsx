"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  CarFront,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAdminOverview,
  type AdminOverviewActivityItem,
  type AdminOverviewResponse,
  type AdminOverviewTrendPoint,
} from "@/src/lib/adminDashboardApi";

const emptyOverview: AdminOverviewResponse = {
  stats: {
    totalUsers: 0,
    verifiedUsers: 0,
    activeUsers: 0,
    totalProviders: 0,
    activeProviders: 0,
    pendingProviders: 0,
    totalCars: 0,
    activeCars: 0,
    pendingCars: 0,
    flaggedCars: 0,
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingProviderRequests: 0,
    totalRevenue: 0,
    currentMonthRevenue: 0,
  },
  charts: {
    bookingsTrend: [],
    usersTrend: [],
    providersTrend: [],
    revenueTrend: [],
    bookingStatusBreakdown: [],
    fleetStatusBreakdown: [],
  },
  recent: {
    users: [],
    providers: [],
    cars: [],
    bookings: [],
    providerRequests: [],
  },
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<AdminOverviewResponse>(emptyOverview);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await getAdminOverview();
        setOverview(response);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load admin overview",
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
        label: "Platform Revenue",
        value: formatCurrency(overview.stats.totalRevenue),
        subtext: `${formatCurrency(overview.stats.currentMonthRevenue)} this month`,
        icon: <CircleDollarSign size={18} />,
        tone: "#0f766e",
      },
      {
        label: "Total Users",
        value: formatNumber(overview.stats.totalUsers),
        subtext: `${formatNumber(overview.stats.verifiedUsers)} verified accounts`,
        icon: <Users size={18} />,
        tone: "#2563eb",
      },
      {
        label: "Providers",
        value: formatNumber(overview.stats.totalProviders),
        subtext: `${formatNumber(overview.stats.pendingProviders)} awaiting action`,
        icon: <ShieldCheck size={18} />,
        tone: "#7c3aed",
      },
      {
        label: "Fleet Health",
        value: formatNumber(overview.stats.totalCars),
        subtext: `${formatNumber(overview.stats.flaggedCars)} flagged cars`,
        icon: <CarFront size={18} />,
        tone: "#ea580c",
      },
    ],
    [overview],
  );

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>Admin Overview</p>
          <h1 style={styles.heroTitle}>Operations, growth, and marketplace health</h1>
          <p style={styles.heroSubtitle}>
            This view now tracks the actual marketplace instead of static placeholders:
            revenue, onboarding pressure, booking movement, and fleet quality.
          </p>
        </div>

        <div style={styles.heroPills}>
          <span style={styles.heroPill}>
            <Clock3 size={14} />
            {loading ? "Refreshing..." : `${formatNumber(overview.stats.pendingProviderRequests)} pending provider requests`}
          </span>
          <span style={styles.heroPill}>
            <AlertTriangle size={14} />
            {loading ? "Checking..." : `${formatNumber(overview.stats.flaggedCars)} cars need review`}
          </span>
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
            data={overview.charts.revenueTrend}
            color="#14b8a6"
            valueFormatter={formatCurrencyCompact}
            loading={loading}
          />
        </div>

        <div style={styles.secondaryChartCard}>
          <SectionHeader
            title="Marketplace Growth"
            subtitle="Users, providers, and bookings created per month"
          />
          <MultiSeriesMiniChart
            series={[
              {
                label: "Users",
                color: "#2563eb",
                data: overview.charts.usersTrend,
              },
              {
                label: "Providers",
                color: "#7c3aed",
                data: overview.charts.providersTrend,
              },
              {
                label: "Bookings",
                color: "#ea580c",
                data: overview.charts.bookingsTrend,
              },
            ]}
            loading={loading}
          />
        </div>
      </section>

      <section style={styles.breakdownGrid}>
        <div style={styles.card}>
          <SectionHeader
            title="Booking Status Mix"
            subtitle="How current booking workload is distributed"
          />
          <HorizontalBreakdown
            items={overview.charts.bookingStatusBreakdown}
            loading={loading}
          />
        </div>

        <div style={styles.card}>
          <SectionHeader
            title="Fleet Status Mix"
            subtitle="Active inventory versus cars needing action"
          />
          <HorizontalBreakdown
            items={overview.charts.fleetStatusBreakdown}
            loading={loading}
          />
        </div>
      </section>

      <section style={styles.activityGrid}>
        <ActivityPanel
          title="Recent Providers"
          items={overview.recent.providers}
          loading={loading}
        />
        <ActivityPanel
          title="Recent Provider Requests"
          items={overview.recent.providerRequests}
          loading={loading}
        />
        <ActivityPanel
          title="Recent Cars"
          items={overview.recent.cars}
          loading={loading}
        />
        <ActivityPanel
          title="Recent Bookings"
          items={overview.recent.bookings}
          loading={loading}
          showValue
        />
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
  valueFormatter,
  loading,
}: {
  data: AdminOverviewTrendPoint[];
  color: string;
  valueFormatter: (value: number) => string;
  loading: boolean;
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

  const path = points.join(" ");
  const areaPath = `0,100 ${path} 100,100`;

  return (
    <div style={styles.lineChartWrap}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.chartSvg}>
        <defs>
          <linearGradient id="overviewAreaFill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPath} fill="url(#overviewAreaFill)" />
        <polyline
          points={path}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div style={styles.chartFooter}>
        {data.map((point) => (
          <div key={point.label} style={styles.chartFooterItem}>
            <span style={styles.chartFooterLabel}>{point.label}</span>
            <strong style={styles.chartFooterValue}>
              {valueFormatter(point.value)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiSeriesMiniChart({
  series,
  loading,
}: {
  series: Array<{
    label: string;
    color: string;
    data: AdminOverviewTrendPoint[];
  }>;
  loading: boolean;
}) {
  if (loading) {
    return <div style={styles.chartLoading}>Loading chart...</div>;
  }

  const max = Math.max(
    ...series.flatMap((item) => item.data.map((point) => point.value)),
    1,
  );
  const labels = series[0]?.data.map((item) => item.label) ?? [];

  return (
    <div style={styles.multiChartWrap}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.chartSvg}>
        {series.map((item) => {
          const points = item.data
            .map((point, index) => {
              const x = (index / Math.max(item.data.length - 1, 1)) * 100;
              const y = 100 - (point.value / max) * 100;
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polyline
              key={item.label}
              points={points}
              fill="none"
              stroke={item.color}
              strokeWidth="2.1"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div style={styles.legendRow}>
        {series.map((item) => (
          <span key={item.label} style={styles.legendItem}>
            <span
              style={{ ...styles.legendDot, background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div style={styles.labelRow}>
        {labels.map((label) => (
          <span key={label} style={styles.axisLabel}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HorizontalBreakdown({
  items,
  loading,
}: {
  items: AdminOverviewTrendPoint[];
  loading: boolean;
}) {
  if (loading) {
    return <div style={styles.chartLoading}>Loading breakdown...</div>;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={styles.breakdownList}>
      {items.map((item, index) => {
        const width = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.label} style={styles.breakdownItem}>
            <div style={styles.breakdownHeader}>
              <span style={styles.breakdownLabel}>{item.label}</span>
              <strong style={styles.breakdownValue}>{formatNumber(item.value)}</strong>
            </div>
            <div style={styles.breakdownTrack}>
              <div
                style={{
                  ...styles.breakdownBar,
                  width: `${width}%`,
                  background: breakdownColors[index % breakdownColors.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityPanel({
  title,
  items,
  loading,
  showValue = false,
}: {
  title: string;
  items: AdminOverviewActivityItem[];
  loading: boolean;
  showValue?: boolean;
}) {
  return (
    <section style={styles.card}>
      <SectionHeader title={title} subtitle="Latest changes across the platform" />

      {loading ? (
        <div style={styles.activityEmpty}>Loading activity...</div>
      ) : items.length === 0 ? (
        <div style={styles.activityEmpty}>No recent activity yet</div>
      ) : (
        <div style={styles.activityList}>
          {items.map((item) => (
            <article key={item.id} style={styles.activityItem}>
              <div style={styles.activityMeta}>
                <strong style={styles.activityTitle}>{item.title}</strong>
                <span style={styles.activitySubtitle}>{item.subtitle}</span>
              </div>
              <div style={styles.activityAside}>
                <span style={styles.activityStatus}>{item.status}</span>
                {showValue && typeof item.value === "number" ? (
                  <strong style={styles.activityValue}>
                    {formatCurrencyCompact(item.value)}
                  </strong>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
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
  if (value >= 1_000_000) {
    return `NGN ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `NGN ${(value / 1_000).toFixed(1)}k`;
  }

  return `NGN ${value.toFixed(0)}`;
}

const breakdownColors = ["#14b8a6", "#2563eb", "#f97316", "#7c3aed"];

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
    maxWidth: 1440,
  },
  hero: {
    borderRadius: 28,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(20,184,166,0.18), rgba(59,130,246,0.14))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  heroContent: {
    maxWidth: 760,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "var(--fg-60)",
  },
  heroTitle: {
    margin: "10px 0 12px",
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 800,
  },
  heroSubtitle: {
    margin: 0,
    color: "var(--fg-75)",
    lineHeight: 1.6,
    maxWidth: 680,
  },
  heroPills: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  heroPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(15,23,42,0.48)",
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: 700,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  kpiCard: {
    borderRadius: 20,
    border: "1px solid var(--input-border)",
    background: "linear-gradient(180deg, var(--surface-1), rgba(15,23,42,0.02))",
    padding: 20,
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  kpiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    lineHeight: 1.05,
    fontWeight: 800,
  },
  kpiSubtext: {
    fontSize: 13,
    color: "var(--fg-60)",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(340px, 0.8fr)",
    gap: 18,
  },
  primaryChartCard: {
    borderRadius: 20,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minHeight: 330,
  },
  secondaryChartCard: {
    borderRadius: 20,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minHeight: 330,
  },
  sectionHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 19,
    fontWeight: 800,
  },
  sectionSubtitle: {
    margin: 0,
    fontSize: 13,
    color: "var(--fg-60)",
    lineHeight: 1.5,
  },
  lineChartWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    flex: 1,
  },
  chartSvg: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    background:
      "linear-gradient(180deg, rgba(148,163,184,0.08), rgba(148,163,184,0.02))",
  },
  chartFooter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(82px, 1fr))",
    gap: 10,
  },
  chartFooterItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  chartFooterLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
  },
  chartFooterValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  multiChartWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    flex: 1,
  },
  legendRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "var(--fg-70)",
    fontWeight: 700,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
  },
  axisLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
  },
  breakdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  card: {
    borderRadius: 20,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  breakdownList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  breakdownItem: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  breakdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 13,
    color: "var(--fg-70)",
    fontWeight: 700,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 800,
  },
  breakdownTrack: {
    height: 10,
    borderRadius: 999,
    background: "rgba(148,163,184,0.14)",
    overflow: "hidden",
  },
  breakdownBar: {
    height: "100%",
    borderRadius: 999,
  },
  activityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  activityItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottom: "1px solid rgba(148,163,184,0.12)",
  },
  activityMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  activityTitle: {
    fontSize: 14,
  },
  activitySubtitle: {
    fontSize: 12,
    color: "var(--fg-60)",
  },
  activityAside: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  activityStatus: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--fg-60)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  activityValue: {
    fontSize: 12,
    fontWeight: 800,
  },
  activityEmpty: {
    color: "var(--fg-60)",
    fontSize: 13,
  },
  chartLoading: {
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    background: "rgba(148,163,184,0.06)",
    color: "var(--fg-60)",
    fontSize: 13,
  },
};
