"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  Clock,
  Eye,
  Gauge,
  Plus,
  Search,
} from "lucide-react";
import KpiCard, { KpiGrid } from "@/src/components/admin/KpiCard";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";
import { listProviderCars } from "@/src/lib/providerApi";
import type { RentalCarRow } from "@/src/types/rentalCar";
import VerificationBanner from "@/src/components/provider/VerificationBanner";
import { useProviderVerification } from "@/src/hooks/useProviderVerification";

const STATUS_CHIPS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

export default function ProviderCarsPage() {
  const [cars, setCars] = useState<RentalCarRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const verification = useProviderVerification();

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const response = await listProviderCars({
            q: search.trim() || undefined,
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
    return () => window.clearTimeout(t);
  }, [search]);

  const visibleCars = useMemo(() => {
    return cars.filter((c) => {
      if (status === "available" && (c.currentlyRented || !c.isActive || c.backendStatus !== "APPROVED")) return false;
      if (status === "rented" && !c.currentlyRented) return false;
      if (status === "pending" && c.backendStatus !== "PENDING_APPROVAL") return false;
      if (status === "inactive" && c.isActive) return false;
      if (makeFilter && c.brand.toLowerCase() !== makeFilter.toLowerCase()) return false;
      if (yearFilter && String(c.year) !== yearFilter) return false;
      return true;
    });
  }, [cars, status, makeFilter, yearFilter]);

  const kpi = useMemo(() => {
    const total = cars.length;
    const rented = cars.filter((c) => c.currentlyRented).length;
    const available = cars.filter((c) => !c.currentlyRented && c.isActive && c.backendStatus === "APPROVED").length;
    const pending = cars.filter((c) => c.backendStatus === "PENDING_APPROVAL").length;
    return { total, available, rented, pending };
  }, [cars]);

  const makes = useMemo(() => Array.from(new Set(cars.map((c) => c.brand))).sort(), [cars]);
  const years = useMemo(() => Array.from(new Set(cars.map((c) => c.year).filter(Boolean) as number[])).sort((a, b) => b - a), [cars]);

  return (
    <div style={s.page}>
      <VerificationBanner capability="listing" variant="compact" />

      <div style={s.header}>
        <div>
          <h1 style={s.title}>Fleet Management</h1>
          <p style={s.subtitle}>Manage your vehicle fleet and track performance</p>
          <p style={s.metaText}>{cars.length.toLocaleString()} vehicles</p>
        </div>

        <div style={s.headerActions}>
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
      </div>

      <KpiGrid>
        <KpiCard label="Total Vehicles" value={kpi.total} subtext="Active fleet vehicles" icon={<CarFront size={18} />} tone="var(--brand-primary)" />
        <KpiCard label="Available" value={kpi.available} subtext="Ready for rental" icon={<CheckCircle2 size={18} />} tone="#22c55e" />
        <KpiCard label="Currently Rented" value={kpi.rented} subtext="Out on rental" icon={<Gauge size={18} />} tone="#f59e0b" />
        <KpiCard label="Pending Approval" value={kpi.pending} subtext="Awaiting admin review" icon={<Clock size={18} />} tone="#a78bfa" />
      </KpiGrid>

      <div style={chipsRow}>
        {STATUS_CHIPS.map((c) => {
          const active = status === c.value;
          return (
            <button
              key={c.value || "all"}
              type="button"
              onClick={() => setStatus(c.value)}
              style={{ ...chipBase, ...(active ? chipActive : {}) }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div style={s.filtersRow}>
        <div style={s.searchBox}>
          <Search size={18} color="var(--fg-60)" />
          <input
            style={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vehicles, brand, model, plate…"
          />
        </div>
        <select style={s.select} value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)}>
          <option value="">All makes</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={s.select} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={bookingsTableTheme.card}>
        <div style={bookingsTableTheme.tableWrap}>
          <table style={bookingsTableTheme.table}>
            <thead>
              <tr style={bookingsTableTheme.theadRow}>
                <th style={bookingsTableTheme.th}>Photo</th>
                <th style={bookingsTableTheme.th}>Registration</th>
                <th style={bookingsTableTheme.th}>Make/Model</th>
                <th style={bookingsTableTheme.th}>Year</th>
                <th style={bookingsTableTheme.th}>Color</th>
                <th style={bookingsTableTheme.th}>Owner</th>
                <th style={bookingsTableTheme.th}>Location</th>
                <th style={bookingsTableTheme.th}>Status</th>
                <th style={bookingsTableTheme.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={s.emptyCell}>Loading fleet…</td></tr>
              ) : visibleCars.length === 0 ? (
                <tr><td colSpan={9} style={s.emptyCell}>No vehicles match this view.</td></tr>
              ) : (
                visibleCars.map((car) => (
                  <tr key={car.id} style={bookingsTableTheme.tr}>
                    <td style={bookingsTableTheme.td}>
                      <div style={s.thumb}>
                        {car.imageUrl ? (
                          <Image src={car.imageUrl} alt={`${car.brand} ${car.model}`} fill sizes="72px" style={{ objectFit: "cover" }} />
                        ) : (
                          <span style={s.thumbEmpty}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={bookingsTableTheme.tdStrong}>{car.licensePlate || "—"}</td>
                    <td style={bookingsTableTheme.td}>
                      <div style={bookingsTableTheme.twoLine}>
                        <span style={bookingsTableTheme.primaryText}>{car.brand}</span>
                        <span style={bookingsTableTheme.secondaryText}>{car.model}</span>
                      </div>
                    </td>
                    <td style={bookingsTableTheme.td}>{car.year || "—"}</td>
                    <td style={{ ...bookingsTableTheme.td, textTransform: "capitalize" }}>{car.color || "—"}</td>
                    <td style={bookingsTableTheme.td}><span style={ownerPill}>Own fleet</span></td>
                    <td style={bookingsTableTheme.td}>{car.locationName || "Any"}</td>
                    <td style={bookingsTableTheme.td}>
                      <span style={availabilityPill(car)}>{availabilityLabel(car)}</span>
                    </td>
                    <td style={bookingsTableTheme.tdRight}>
                      <Link href={`/provider/cars/${car.id}`} style={{ ...bookingsTableTheme.iconBtn, textDecoration: "none" }} title="View details">
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
  const base: CSSProperties = { display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 };
  if (car.currentlyRented) return { ...base, background: "rgba(239,68,68,0.14)", color: "#fca5a5" };
  if (!car.isActive) return { ...base, background: "rgba(148,163,184,0.18)", color: "#cbd5e1" };
  if (car.backendStatus !== "APPROVED") return { ...base, background: "rgba(250,204,21,0.14)", color: "#fde68a" };
  return { ...base, background: "rgba(244,114,182,0.14)", color: "#f9a8d4" };
}

const chipBase: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid var(--glass-08)",
  background: "transparent",
  color: "var(--fg-75)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
const chipActive: CSSProperties = {
  background: "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
  color: "var(--brand-primary)",
  borderColor: "color-mix(in srgb, var(--brand-primary) 45%, transparent)",
};
const chipsRow: CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };

const ownerPill: CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  background: "var(--glass-06)",
  color: "var(--fg-85)",
  border: "1px solid var(--glass-10)",
};

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 20, maxWidth: 1400 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.4 },
  subtitle: { margin: "4px 0 0", color: "var(--fg-60)", fontSize: 13 },
  metaText: { margin: "6px 0 0", color: "var(--fg-60)", fontSize: 12 },
  headerActions: { display: "flex", gap: 10 },
  addBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: 12, background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, textDecoration: "none" },
  filtersRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  searchBox: { flex: "1 1 300px", minWidth: 260, height: 44, borderRadius: 12, border: "1px solid var(--glass-08)", background: "var(--glass-04)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--foreground)", fontSize: 14, height: "100%" },
  select: { height: 44, minWidth: 150, padding: "0 12px", borderRadius: 12, border: "1px solid var(--glass-08)", background: "var(--glass-04)", color: "var(--foreground)", fontSize: 13 },
  thumb: { position: "relative", width: 72, height: 52, borderRadius: 10, overflow: "hidden", background: "var(--glass-06)" },
  thumbEmpty: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-60)", fontSize: 20 },
  emptyCell: { padding: 40, textAlign: "center", color: "var(--fg-60)", fontSize: 13 },
};
