"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { Eye, Plus, Search } from "lucide-react";
import { listProviderCars } from "@/src/lib/providerApi";
import type { RentalCarRow } from "@/src/types/rentalCar";
import VerificationBanner from "@/src/components/provider/VerificationBanner";
import { useProviderVerification } from "@/src/hooks/useProviderVerification";

export default function ProviderCarsPage() {
  const [cars, setCars] = useState<RentalCarRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const verification = useProviderVerification();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const response = await listProviderCars({
            q: query.trim() || undefined,
            page: 1,
            limit: 200,
          });
          setCars(response.items);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to load fleet");
        } finally {
          setLoading(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const filtered = useMemo(() => {
    return cars.filter((c) => {
      if (statusFilter === "available" && (c.currentlyRented || !c.isActive || c.backendStatus !== "APPROVED")) return false;
      if (statusFilter === "rented" && !c.currentlyRented) return false;
      if (statusFilter === "pending" && c.backendStatus !== "PENDING_APPROVAL") return false;
      if (statusFilter === "inactive" && c.isActive) return false;
      if (makeFilter && c.brand.toLowerCase() !== makeFilter.toLowerCase()) return false;
      if (yearFilter && String(c.year) !== yearFilter) return false;
      return true;
    });
  }, [cars, statusFilter, makeFilter, yearFilter, ownershipFilter]);

  const kpis = useMemo(() => {
    const total = cars.length;
    const rented = cars.filter((c) => c.currentlyRented).length;
    const available = cars.filter((c) => !c.currentlyRented && c.isActive && c.backendStatus === "APPROVED").length;
    const utilisation = total > 0 ? Math.round((rented / total) * 100) : 0;
    return { total, available, rented, utilisation };
  }, [cars]);

  const makes = useMemo(() => Array.from(new Set(cars.map((c) => c.brand))).sort(), [cars]);
  const years = useMemo(() => Array.from(new Set(cars.map((c) => c.year).filter(Boolean) as number[])).sort((a, b) => b - a), [cars]);

  return (
    <div style={s.page}>
      <VerificationBanner capability="listing" variant="compact" />

      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}>Fleet Management</h1>
          <p style={s.sub}>Manage your vehicle fleet and track performance</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/provider/analytics" style={s.iconLink} title="Fleet analytics">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
          </Link>
          {verification.canListCars ? (
            <Link href="/provider/cars/new" style={s.addBtn}>
              <Plus size={16} /> Add Vehicle
            </Link>
          ) : (
            <Link href="/provider/verification" style={{ ...s.addBtn, background: "#ef4444" }} title="Verify business first">
              Verify to add cars
            </Link>
          )}
        </div>
      </header>

      <div style={s.kpiGrid}>
        <Kpi tone="neutral" label="Total Vehicles" value={kpis.total} sub="Active fleet vehicles" />
        <Kpi tone="success" label="Available" value={kpis.available} sub="Ready for rental" />
        <Kpi tone="warning" label="Currently Rented" value={kpis.rented} sub="Out on rental" />
        <Kpi tone="danger" label="Utilization Rate" value={`${kpis.utilisation}%`} sub="Fleet efficiency" />
      </div>

      <div style={s.filters}>
        <div style={s.searchBox}>
          <Search size={16} color="var(--muted-foreground)" />
          <input style={s.searchInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vehicles..." />
        </div>
        <select style={s.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Status</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="pending">Pending approval</option>
          <option value="inactive">Inactive</option>
        </select>
        <select style={s.select} value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)}>
          <option value="">Make</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={s.select} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">Year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select style={s.select} value={ownershipFilter} onChange={(e) => setOwnershipFilter(e.target.value)}>
          <option value="">Ownership</option>
          <option value="own">Own fleet</option>
        </select>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Photo</th>
              <th style={s.th}>Registration</th>
              <th style={s.th}>Make/Model</th>
              <th style={s.th}>Year</th>
              <th style={s.th}>Color</th>
              <th style={s.th}>Owner</th>
              <th style={s.th}>Location</th>
              <th style={s.th}>Status</th>
              <th style={{ ...s.th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={s.empty}>Loading fleet…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={s.empty}>No vehicles match this view.</td></tr>
            ) : (
              filtered.map((car) => (
                <tr key={car.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.thumb}>
                      {car.imageUrl ? (
                        <Image src={car.imageUrl} alt={`${car.brand} ${car.model}`} fill sizes="70px" style={{ objectFit: "cover" }} />
                      ) : (
                        <span style={s.thumbEmpty}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={s.td}><strong style={{ fontSize: 14 }}>{car.licensePlate || "—"}</strong></td>
                  <td style={s.td}>
                    <div>
                      <strong>{car.brand}</strong>
                      <div style={s.muted}>{car.model}</div>
                    </div>
                  </td>
                  <td style={s.td}>{car.year || "—"}</td>
                  <td style={{ ...s.td, textTransform: "capitalize" }}>{car.color || "—"}</td>
                  <td style={s.td}><span style={s.pillNeutral}>Own fleet</span></td>
                  <td style={s.td}>{car.locationName || "Any"}</td>
                  <td style={s.td}>
                    <span style={availabilityPill(car)}>{availabilityLabel(car)}</span>
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <Link href={`/provider/cars/${car.id}`} style={s.iconBtn} title="View details">
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ tone, label, value, sub }: {
  tone: "neutral" | "success" | "warning" | "danger";
  label: string;
  value: string | number;
  sub: string;
}) {
  const map: Record<typeof tone, { bg: string; num: string }> = {
    neutral: { bg: "var(--surface-2)", num: "var(--foreground)" },
    success: { bg: "color-mix(in srgb, #22c55e 8%, var(--surface-1))", num: "#22c55e" },
    warning: { bg: "color-mix(in srgb, #f59e0b 8%, var(--surface-1))", num: "#f59e0b" },
    danger: { bg: "color-mix(in srgb, #ef4444 8%, var(--surface-1))", num: "#ef4444" },
  } as any;
  const t = map[tone];
  return (
    <div style={{ ...s.kpi, background: t.bg }}>
      <span style={s.kpiLabel}>{label}</span>
      <strong style={{ ...s.kpiValue, color: t.num }}>{value}</strong>
      <span style={s.kpiSub}>{sub}</span>
    </div>
  );
}

function availabilityLabel(car: RentalCarRow): string {
  if (car.currentlyRented) return "Rented";
  if (!car.isActive) return "Inactive";
  if (car.backendStatus === "PENDING_APPROVAL") return "Pending";
  if (car.backendStatus === "REJECTED") return "Rejected";
  if (car.backendStatus === "FLAGGED") return "Flagged";
  if (car.backendStatus === "DRAFT") return "Draft";
  return "Available";
}
function availabilityPill(car: RentalCarRow): CSSProperties {
  const base: CSSProperties = { display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 };
  if (car.currentlyRented) return { ...base, background: "rgba(239,68,68,0.14)", color: "#fca5a5" };
  if (!car.isActive) return { ...base, background: "rgba(148,163,184,0.18)", color: "#cbd5e1" };
  if (car.backendStatus !== "APPROVED") return { ...base, background: "rgba(250,204,21,0.14)", color: "#fde68a" };
  return { ...base, background: "rgba(244,114,182,0.14)", color: "#f9a8d4" };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1400 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 26, fontWeight: 750, letterSpacing: -0.4 },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13 },
  iconLink: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", textDecoration: "none" },
  addBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 18px", borderRadius: 10, background: "var(--brand-primary)", color: "#022c22", fontSize: 14, fontWeight: 700, textDecoration: "none" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 },
  kpi: { padding: 22, borderRadius: 14, border: "1px solid var(--input-border)", display: "flex", flexDirection: "column", gap: 6 },
  kpiLabel: { fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500 },
  kpiValue: { fontSize: 40, fontWeight: 800, lineHeight: 1 },
  kpiSub: { fontSize: 12, color: "var(--muted-foreground)" },
  filters: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  searchBox: { flex: "1 1 260px", minWidth: 240, height: 42, borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--foreground)", fontSize: 14, height: "100%" },
  select: { height: 42, minWidth: 130, padding: "0 12px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", fontSize: 13 },
  tableWrap: { border: "1px solid var(--input-border)", borderRadius: 14, background: "var(--surface-1)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "14px 16px", fontSize: 12, color: "var(--muted-foreground)", fontWeight: 600, borderBottom: "1px solid var(--input-border)" },
  tr: { transition: "background 0.15s" },
  td: { padding: "14px 16px", borderBottom: "1px solid var(--input-border)", fontSize: 14, verticalAlign: "middle" },
  muted: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  thumb: { position: "relative", width: 72, height: 52, borderRadius: 8, overflow: "hidden", background: "var(--surface-2)" },
  thumbEmpty: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 20 },
  pillNeutral: { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--input-border)" },
  iconBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--surface-2)", color: "var(--foreground)", textDecoration: "none" },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 },
};
