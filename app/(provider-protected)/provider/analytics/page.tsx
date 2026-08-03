"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { BarChart3, TrendingUp } from "lucide-react";
import { getProviderAnalytics, type ProviderAnalytics } from "@/src/lib/providerOpsApi";

const RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<ProviderAnalytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setLoading(true); setData(await getProviderAnalytics(days)); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}><BarChart3 size={20} color="var(--brand-primary)" /> Analytics</h1>
          <p style={s.sub}>Fleet utilisation, revenue, cancellation rate, and top-performing cars.</p>
        </div>
        <select style={s.select} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </header>

      {loading || !data ? <div style={s.empty}>Loading…</div> : (
        <>
          <div style={s.kpiGrid}>
            <Kpi label="Utilisation" value={`${Math.round(data.utilisation * 100)}%`} sub={`Booked days ÷ (fleet × ${data.days} days)`} tone="var(--brand-primary)" />
            <Kpi label="Revenue" value={`₦${Math.round(data.revenue.total).toLocaleString()}`} sub={`${data.bookings.total} rentals`} tone="#22c55e" />
            <Kpi label="Cancellation rate" value={`${Math.round(data.bookings.cancellationRate * 100)}%`} sub={`${data.bookings.cancelled} of ${data.bookings.total} cancelled`} tone={data.bookings.cancellationRate > 0.15 ? "#ef4444" : "#f59e0b"} />
            <Kpi label="Rating" value={data.reviews.average.toFixed(1)} sub={`${data.reviews.count} review${data.reviews.count === 1 ? "" : "s"}`} tone="#fbbf24" />
          </div>

          <section style={s.card}>
            <h2 style={s.h2}><TrendingUp size={16} /> Top cars by rentals</h2>
            {data.topCars.length === 0 ? (
              <div style={s.empty}>No completed rentals in this window.</div>
            ) : (
              <div style={s.topList}>
                {data.topCars.map((r, i) => (
                  <div key={r.carId} style={s.topRow}>
                    <div style={s.rank}>#{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <strong>{r.car ? `${r.car.brand} ${r.car.model}` : "—"}</strong>
                      <div style={s.meta}>{r.car?.licensePlate ?? "no plate"}</div>
                    </div>
                    <div style={{ textAlign: "right" as any }}>
                      <strong>{r._count}</strong>
                      <div style={s.meta}>rentals</div>
                    </div>
                    <div style={{ textAlign: "right" as any, minWidth: 120 }}>
                      <strong>₦{Math.round(r._sum.totalPrice ?? 0).toLocaleString()}</strong>
                      <div style={s.meta}>revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={s.card}>
            <h2 style={s.h2}>Fleet snapshot</h2>
            <div style={s.miniGrid}>
              <Mini label="Total cars" value={data.fleet.total} />
              <Mini label="Completed" value={data.bookings.completed} />
              <Mini label="Cancelled" value={data.bookings.cancelled} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div style={s.kpi}>
      <span style={s.kpiLabel}>{label}</span>
      <strong style={{ ...s.kpiValue, color: tone }}>{value}</strong>
      <span style={s.kpiSub}>{sub}</span>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div style={s.mini}>
      <span style={s.miniLabel}>{label}</span>
      <strong style={s.miniValue}>{value}</strong>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1100 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  select: { height: 42, minWidth: 140, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 13 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 },
  kpi: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 4 },
  kpiLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)" },
  kpiValue: { fontSize: 26, fontWeight: 750 },
  kpiSub: { fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 },
  empty: { padding: 30, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 20 },
  h2: { margin: "0 0 14px", fontSize: 15, fontWeight: 700, display: "inline-flex", gap: 8, alignItems: "center" },
  topList: { display: "flex", flexDirection: "column", gap: 8 },
  topRow: { display: "flex", gap: 14, alignItems: "center", padding: 10, background: "var(--surface-2)", borderRadius: 8 },
  rank: { width: 32, height: 32, borderRadius: 8, background: "color-mix(in srgb, var(--brand-primary) 14%, transparent)", color: "var(--brand-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 },
  meta: { fontSize: 11, color: "var(--muted-foreground)" },
  miniGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 },
  mini: { padding: 14, background: "var(--surface-2)", borderRadius: 10 },
  miniLabel: { fontSize: 11, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.4 },
  miniValue: { display: "block", marginTop: 4, fontSize: 20, fontWeight: 700 },
};
