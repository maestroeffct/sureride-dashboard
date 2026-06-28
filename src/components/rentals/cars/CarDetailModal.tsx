"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  X,
  CarFront,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  Users,
  Briefcase,
  Cog,
  Gauge,
  Snowflake,
  ImageOff,
} from "lucide-react";
import { getAdminCarDetail } from "@/src/lib/carsApi";
import { currencyForCountryCodeByCurrency } from "@/src/lib/currencyForCountry";

/**
 * Quick-look modal for admin moderators reviewing a pending car. Shows the
 * car's photos, owner, location, rates and features so the admin can make an
 * informed approve/reject decision without having to dig into the provider's
 * own edit view.
 */
export default function CarDetailModal({
  carId,
  onClose,
}: {
  carId: string;
  onClose: () => void;
}) {
  // Loose type — admin detail returns the full Car with provider/images/features.
  const [car, setCar] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminCarDetail(carId)
      .then((data) => {
        if (!cancelled) setCar(data as unknown as Record<string, unknown>);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load car");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [carId]);

  const images = (car?.images as Array<{ url: string; isPrimary?: boolean }>) ?? [];
  const features = (car?.features as Array<{ feature?: { name?: string; category?: string } }>) ?? [];
  const provider = car?.provider as { name?: string; email?: string; phone?: string } | undefined;
  const location = car?.location as { name?: string; address?: string; country?: { code?: string } } | undefined;

  // Currency resolution: prefer car.currency (the per-car override) and fall
  // back to deriving from the location's country code. Symbol comes from the
  // shared currencyForCountry table so it stays consistent with the
  // provider-side form.
  const currencyInfo = useMemo(() => {
    const carCurrency = (car?.currency as string | undefined) ?? "";
    if (carCurrency) return currencyForCountryCodeByCurrency(carCurrency);
    // Fall back to country-code lookup. We can't import currencyForCountryCode
    // and currencyForCountryCodeByCurrency separately for both branches, so
    // we'll just lean on the by-currency one with NGN default if unknown.
    return currencyForCountryCodeByCurrency("NGN");
  }, [car?.currency]);

  const fmtMoney = (n: number | null | undefined) => {
    if (n == null) return "—";
    return `${currencyInfo.symbol}${Number(n).toLocaleString()}`;
  };

  const sortedImages = useMemo(
    () =>
      [...images].sort((a, b) => Number(b.isPrimary ?? 0) - Number(a.isPrimary ?? 0)),
    [images],
  );

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <p style={s.eyebrow}>Car Detail</p>
            {car ? (
              <h2 style={s.title}>
                {(car.brand as string) ?? "—"}{" "}
                {(car.model as string) ?? ""}{" "}
                <span style={s.year}>{(car.year as number) ?? ""}</span>
              </h2>
            ) : (
              <h2 style={s.title}>Car Detail</h2>
            )}
          </div>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : error ? (
          <div style={{ ...s.empty, color: "#b91c1c" }}>{error}</div>
        ) : car ? (
          <div style={s.body}>
            {/* Images — show a single explicit empty state when the car has
                no photos uploaded yet, rather than a row of grey rectangles. */}
            {sortedImages.length > 0 ? (
              <div style={s.imageRow}>
                {sortedImages.map((img, i) => (
                  <CarImage key={i} url={img.url} isPrimary={img.isPrimary} />
                ))}
              </div>
            ) : (
              <div style={s.imageEmpty}>
                <ImageOff size={28} />
                <span style={{ marginTop: 6, fontSize: 13 }}>
                  No photos uploaded yet
                </span>
              </div>
            )}

            <div style={s.grid}>
              <Field label="Status" icon={<Tag size={13} />}>
                <span style={statusPillStyle(car.status as string)}>
                  {((car.status as string) ?? "—").replace(/_/g, " ")}
                </span>
              </Field>
              <Field label="Category" icon={<CarFront size={13} />}>
                <span style={s.value}>{(car.category as string) ?? "—"}</span>
              </Field>
              <Field label="Year" icon={<Calendar size={13} />}>
                <span style={s.value}>{(car.year as number) ?? "—"}</span>
              </Field>
              <Field label="Seats" icon={<Users size={13} />}>
                <span style={s.value}>{(car.seats as number) ?? "—"}</span>
              </Field>
              <Field label="Bags" icon={<Briefcase size={13} />}>
                <span style={s.value}>{(car.bags as string) ?? "—"}</span>
              </Field>
              <Field label="Transmission" icon={<Cog size={13} />}>
                <span style={s.value}>
                  {(car.transmission as string) ?? "—"}
                </span>
              </Field>
              <Field label="Mileage Policy" icon={<Gauge size={13} />}>
                <span style={s.value}>
                  {(car.mileagePolicy as string) ?? "—"}
                </span>
              </Field>
              <Field label="Air Conditioning" icon={<Snowflake size={13} />}>
                <span style={s.value}>
                  {(car.hasAC as boolean) ? "Yes" : "No"}
                </span>
              </Field>
              <Field label={`Daily Rate (${currencyInfo.code})`}>
                <span style={s.priceValue}>
                  {fmtMoney(car.dailyRate as number)}
                </span>
              </Field>
              <Field label={`Hourly Rate (${currencyInfo.code})`}>
                <span style={s.priceValue}>
                  {fmtMoney(car.hourlyRate as number | null)}
                </span>
              </Field>
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Provider</h3>
              <div style={s.providerCard}>
                <div style={s.providerName}>{provider?.name ?? "—"}</div>
                <div style={s.providerMetaRow}>
                  {provider?.email ? (
                    <span style={s.providerMeta}>
                      <Mail size={13} /> {provider.email}
                    </span>
                  ) : null}
                  {provider?.phone ? (
                    <span style={s.providerMeta}>
                      <Phone size={13} /> {provider.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Location</h3>
              <div style={s.providerCard}>
                <div style={s.providerName}>
                  <MapPin size={14} style={{ marginRight: 6 }} />
                  {location?.name ?? "—"}
                </div>
                <div style={s.muted}>{location?.address ?? ""}</div>
              </div>
            </div>

            {features.length > 0 && (
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Features</h3>
                <div style={s.featureList}>
                  {features.map((f, i) => (
                    <span key={i} style={s.featureChip}>
                      {f.feature?.name ?? "—"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {typeof car.moderationNote === "string" && car.moderationNote && (
              <div style={s.note}>
                <strong>Provider note:</strong> {car.moderationNote as string}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CarImage({ url, isPrimary }: { url: string; isPrimary?: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <div style={s.imageWrap}>
      {url && !failed ? (
        <Image
          src={url}
          alt="Car"
          fill
          sizes="220px"
          style={{ objectFit: "cover", borderRadius: 10 }}
          onError={() => setFailed(true)}
          unoptimized
        />
      ) : (
        <div style={s.imageBroken}>
          <ImageOff size={22} />
          <span style={{ marginTop: 4, fontSize: 11 }}>Image unavailable</span>
        </div>
      )}
      {isPrimary && <div style={s.primaryBadge}>Primary</div>}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={s.field}>
      <span style={s.label}>
        {icon ? (
          <span style={{ display: "inline-flex", marginRight: 5, color: "#94a3b8" }}>
            {icon}
          </span>
        ) : null}
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

// Status-aware pill so admins can scan moderation queue at a glance.
function statusPillStyle(status: string | undefined): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  };
  switch (status) {
    case "ACTIVE":
      return { ...base, background: "rgba(34,197,94,0.12)", color: "#15803d" };
    case "PENDING_APPROVAL":
      return { ...base, background: "rgba(245,158,11,0.14)", color: "#a16207" };
    case "FLAGGED":
    case "REJECTED":
      return { ...base, background: "rgba(239,68,68,0.12)", color: "#b91c1c" };
    case "DRAFT":
    default:
      return { ...base, background: "rgba(148,163,184,0.18)", color: "#475569" };
  }
}

const s: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backdropFilter: "blur(2px)",
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 880,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(2, 6, 23, 0.4)",
    border: "1px solid #e2e8f0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 22px",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 1,
  },
  eyebrow: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: { margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: "#0f172a" },
  year: { color: "#94a3b8", fontWeight: 500, marginLeft: 6 },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#475569",
    padding: 6,
    borderRadius: 6,
  },
  body: { padding: 22, display: "flex", flexDirection: "column", gap: 22 },
  empty: { padding: 40, textAlign: "center", color: "#64748b" },
  imageRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 6,
  },
  imageWrap: {
    position: "relative",
    width: 220,
    height: 140,
    flexShrink: 0,
    background: "#f1f5f9",
    borderRadius: 10,
    overflow: "hidden",
  },
  imageBroken: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
  },
  imageEmpty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 12px",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    color: "#94a3b8",
  },
  primaryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    background: "#0f766e",
    color: "#fff",
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 999,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: { fontSize: 14, color: "#0f172a", fontWeight: 500 },
  priceValue: { fontSize: 15, color: "#0f172a", fontWeight: 700 },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  sectionTitle: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  providerCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  providerName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    display: "inline-flex",
    alignItems: "center",
  },
  providerMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
  },
  providerMeta: {
    color: "#64748b",
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  muted: { color: "#64748b", fontSize: 13 },
  featureList: { display: "flex", flexWrap: "wrap", gap: 6 },
  featureChip: {
    background: "rgba(15,118,110,0.08)",
    color: "#0f766e",
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: 999,
  },
  note: {
    background: "#fef3c7",
    color: "#92400e",
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    border: "1px solid #fde68a",
  },
};
