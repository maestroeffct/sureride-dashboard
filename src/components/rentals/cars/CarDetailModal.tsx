"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { getAdminCarDetail } from "@/src/lib/carsApi";

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

  const images = ((car?.images as Array<{ url: string; isPrimary?: boolean }>) ?? []);
  const features = (car?.features as Array<{ feature?: { name?: string; category?: string } }>) ?? [];
  const provider = car?.provider as { name?: string; email?: string; phone?: string } | undefined;
  const location = car?.location as { name?: string; address?: string; country?: { code?: string } } | undefined;

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>Car Detail</h2>
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
            {images.length > 0 && (
              <div style={s.imageRow}>
                {images.map((img, i) => (
                  <div key={i} style={s.imageWrap}>
                    <Image
                      src={img.url}
                      alt="Car"
                      fill
                      style={{ objectFit: "cover", borderRadius: 10 }}
                    />
                    {img.isPrimary && <div style={s.primaryBadge}>Primary</div>}
                  </div>
                ))}
              </div>
            )}

            <div style={s.grid}>
              <Field label="Brand & Model">
                <span>
                  {(car.brand as string) ?? "—"} {(car.model as string) ?? ""}
                </span>
              </Field>
              <Field label="Status">
                <span style={s.statusPill}>{(car.status as string) ?? "—"}</span>
              </Field>
              <Field label="Year">
                <span>{(car.year as number) ?? "—"}</span>
              </Field>
              <Field label="Category">
                <span>{(car.category as string) ?? "—"}</span>
              </Field>
              <Field label="Seats">
                <span>{(car.seats as number) ?? "—"}</span>
              </Field>
              <Field label="Bags">
                <span>{(car.bags as string) ?? "—"}</span>
              </Field>
              <Field label="Transmission">
                <span>{(car.transmission as string) ?? "—"}</span>
              </Field>
              <Field label="Mileage Policy">
                <span>{(car.mileagePolicy as string) ?? "—"}</span>
              </Field>
              <Field label="Air Conditioning">
                <span>{(car.hasAC as boolean) ? "Yes" : "No"}</span>
              </Field>
              <Field label="Daily Rate">
                <span>
                  {location?.country?.code ?? ""}{" "}
                  {Number(car.dailyRate ?? 0).toLocaleString()}
                </span>
              </Field>
              <Field label="Hourly Rate">
                <span>
                  {car.hourlyRate != null
                    ? `${location?.country?.code ?? ""} ${Number(car.hourlyRate).toLocaleString()}`
                    : "—"}
                </span>
              </Field>
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Provider</h3>
              <div style={s.providerRow}>
                <strong>{provider?.name ?? "—"}</strong>
                <span style={s.muted}>{provider?.email ?? ""}</span>
                <span style={s.muted}>{provider?.phone ?? ""}</span>
              </div>
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Location</h3>
              <div>
                <div>{location?.name ?? "—"}</div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.field}>
      <span style={s.label}>{label}</span>
      <div style={s.value}>{children}</div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 880,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(2, 6, 23, 0.35)",
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
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
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
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: { fontSize: 14, color: "#0f172a" },
  statusPill: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  sectionTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  providerRow: { display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
  muted: { color: "#64748b", fontSize: 13 },
  featureList: { display: "flex", flexWrap: "wrap", gap: 6 },
  featureChip: {
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
  },
  note: {
    background: "#fef3c7",
    color: "#92400e",
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
  },
};
