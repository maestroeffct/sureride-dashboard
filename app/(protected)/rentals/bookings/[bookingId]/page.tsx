"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  CreditCard,
  Key,
  MapPin,
  Phone,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import {
  getAdminBooking,
  cancelAdminBooking,
  type AdminBookingDetail,
} from "@/src/lib/adminBookingsApi";
import type { CSSProperties } from "react";

/* ─── Helpers ──────────────────────────────────────────────── */

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtMoney(v: number, currency = "NGN") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(v);
}

function durationDays(pickup: string, ret: string) {
  const diff = new Date(ret).getTime() - new Date(pickup).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
}

/* ─── Status configs ──────────────────────────────────────── */

type BookingStatus = AdminBookingDetail["status"];

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLE: Record<BookingStatus, CSSProperties> = {
  PENDING: {
    background: "rgba(250,204,21,0.14)",
    color: "#FDE68A",
    border: "1px solid rgba(250,204,21,0.2)",
  },
  CONFIRMED: {
    background: "rgba(59,130,246,0.16)",
    color: "#93C5FD",
    border: "1px solid rgba(59,130,246,0.22)",
  },
  COMPLETED: {
    background: "rgba(16,185,129,0.16)",
    color: "#6EE7B7",
    border: "1px solid rgba(16,185,129,0.22)",
  },
  CANCELLED: {
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
    border: "1px solid rgba(239,68,68,0.22)",
  },
};

const PAYMENT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SUCCEEDED: { label: "Paid", color: "#34D399" },
  UNPAID: { label: "Unpaid", color: "#FBBF24" },
  PROCESSING: { label: "Processing", color: "#60A5FA" },
  REQUIRES_ACTION: { label: "Action Required", color: "#F59E0B" },
  FAILED: { label: "Failed", color: "#EF4444" },
  CANCELED: { label: "Refunded", color: "#9CA3AF" },
};

/* ─── Sub-components ─────────────────────────────────────── */

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <span style={s.cardIcon}>{icon}</span>
        <span style={s.cardTitle}>{title}</span>
      </div>
      <div style={s.cardBody}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={s.field}>
      <span style={s.fieldLabel}>{label}</span>
      <span style={s.fieldValue}>{value ?? "—"}</span>
    </div>
  );
}

/* ─── Billing timeline ───────────────────────────────────── */

function BillingTimeline({ booking }: { booking: AdminBookingDetail }) {
  const steps: Array<{
    key: BookingStatus;
    label: string;
    sub: string;
    done: boolean;
  }> = [
    {
      key: "PENDING",
      label: "Booking Created",
      sub: fmt(booking.createdAt) + " " + fmtTime(booking.createdAt),
      done: true,
    },
    {
      key: "CONFIRMED",
      label: "Payment Confirmed",
      sub:
        booking.paidAt
          ? fmt(booking.paidAt) + " " + fmtTime(booking.paidAt)
          : "Awaiting payment",
      done: booking.paymentStatus === "SUCCEEDED",
    },
    {
      key: "CONFIRMED",
      label: "Pickup Date",
      sub: fmt(booking.pickupAt) + " " + fmtTime(booking.pickupAt),
      done: new Date() >= new Date(booking.pickupAt) && booking.status !== "CANCELLED",
    },
    {
      key: "COMPLETED",
      label: "Return / Completion",
      sub:
        booking.status === "COMPLETED"
          ? fmt(booking.returnAt) + " " + fmtTime(booking.returnAt)
          : booking.status === "CANCELLED"
          ? "Booking was cancelled"
          : "Expected " + fmt(booking.returnAt),
      done: booking.status === "COMPLETED",
    },
  ];

  return (
    <div style={s.timeline}>
      {steps.map((step, i) => (
        <div key={i} style={s.timelineRow}>
          <div style={s.timelineLeft}>
            <div
              style={{
                ...s.timelineDot,
                background: step.done ? "#34D399" : "var(--glass-08)",
                borderColor: step.done ? "#34D399" : "var(--glass-14)",
              }}
            >
              {step.done ? (
                <CheckCircle size={12} color="#fff" />
              ) : (
                <Clock size={12} color="var(--fg-60)" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  ...s.timelineLine,
                  background: step.done ? "#34D399" : "var(--glass-08)",
                }}
              />
            )}
          </div>
          <div style={s.timelineContent}>
            <span style={{ ...s.timelineLabel, color: step.done ? "var(--foreground)" : "var(--fg-60)" }}>
              {step.label}
            </span>
            <span style={s.timelineSub}>{step.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    getAdminBooking(bookingId)
      .then(setBooking)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleCancel = async () => {
    if (!booking) return;
    if (!window.confirm(`Cancel booking ${booking.id.slice(0, 8).toUpperCase()}? This cannot be undone.`))
      return;
    setCancelling(true);
    try {
      await cancelAdminBooking(booking.id);
      setBooking((b) => b ? { ...b, status: "CANCELLED" } : b);
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <span style={{ color: "var(--fg-65)", fontSize: 14 }}>Loading booking…</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={s.page}>
        <div style={s.loadingWrap}>
          <span style={{ color: "var(--fg-65)", fontSize: 14 }}>Booking not found.</span>
        </div>
      </div>
    );
  }

  const shortId = booking.id.slice(0, 8).toUpperCase();
  const days = durationDays(booking.pickupAt, booking.returnAt);
  const customerName =
    [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(" ") ||
    booking.user?.email ||
    "Unknown";
  const carName = booking.car ? `${booking.car.brand} ${booking.car.model}` : "—";
  const paymentInfo = PAYMENT_STATUS_LABEL[booking.paymentStatus] ?? {
    label: booking.paymentStatus,
    color: "var(--fg-65)",
  };
  const canCancel = booking.status !== "CANCELLED" && booking.status !== "COMPLETED";

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.headerRow}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => router.back()}>
            <ArrowLeft size={16} />
            <span>Back to Bookings</span>
          </button>
          <div style={s.titleRow}>
            <h1 style={s.pageTitle}>Booking #{shortId}</h1>
            <span
              style={{
                ...s.statusPill,
                ...STATUS_STYLE[booking.status],
              }}
            >
              {STATUS_LABEL[booking.status]}
            </span>
          </div>
          <p style={s.pageSub}>
            Created {fmt(booking.createdAt)} · {days} day{days !== 1 ? "s" : ""} · {carName}
          </p>
        </div>

        <div style={s.headerActions}>
          {canCancel && (
            <button
              style={s.cancelBtn}
              onClick={handleCancel}
              disabled={cancelling}
            >
              <XCircle size={16} />
              <span>{cancelling ? "Cancelling…" : "Cancel Booking"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Collection Code banner */}
      {booking.collectionCode && (
        <div style={s.collectionBanner}>
          <Key size={18} color="#34D399" />
          <div>
            <div style={s.collectionLabel}>Collection Code</div>
            <div style={s.collectionCode}>{booking.collectionCode}</div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={s.grid}>
        {/* LEFT COLUMN */}
        <div style={s.col}>
          {/* Booking Dates */}
          <SectionCard title="Rental Period" icon={<Calendar size={16} />}>
            <div style={s.datesRow}>
              <div style={s.dateBox}>
                <span style={s.dateBoxLabel}>Pickup</span>
                <span style={s.dateBoxDate}>{fmt(booking.pickupAt)}</span>
                <span style={s.dateBoxTime}>{fmtTime(booking.pickupAt)}</span>
              </div>
              <div style={s.dateSep}>
                <div style={s.dateSepLine} />
                <span style={s.dateSepDays}>{days}d</span>
                <div style={s.dateSepLine} />
              </div>
              <div style={s.dateBox}>
                <span style={s.dateBoxLabel}>Return</span>
                <span style={s.dateBoxDate}>{fmt(booking.returnAt)}</span>
                <span style={s.dateBoxTime}>{fmtTime(booking.returnAt)}</span>
              </div>
            </div>
          </SectionCard>

          {/* Car */}
          <SectionCard title="Vehicle" icon={<Car size={16} />}>
            {booking.car?.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={booking.car.images[0].url} alt={carName} style={s.carImg} />
            )}
            <Field label="Vehicle" value={carName} />
            <Field label="Category" value={booking.car?.category ?? "—"} />
            <Field label="Transmission" value={booking.car?.transmission ?? "—"} />
            <Field label="Pricing Unit" value={booking.pricingUnit} />
          </SectionCard>

          {/* Location */}
          <SectionCard title="Pickup Location" icon={<MapPin size={16} />}>
            <Field label="Name" value={booking.car?.location?.name ?? "—"} />
            <Field label="Address" value={booking.car?.location?.address ?? "—"} />
          </SectionCard>

          {/* Billing timeline */}
          <SectionCard title="Booking Timeline" icon={<Clock size={16} />}>
            <BillingTimeline booking={booking} />
          </SectionCard>
        </div>

        {/* RIGHT COLUMN */}
        <div style={s.col}>
          {/* Customer */}
          <SectionCard title="Customer" icon={<User size={16} />}>
            <Field label="Name" value={customerName} />
            <Field label="Email" value={booking.user?.email ?? "—"} />
            <Field
              label="Phone"
              value={
                booking.user?.phoneNumber
                  ? `${booking.user.phoneCountry ?? ""} ${booking.user.phoneNumber}`.trim()
                  : "—"
              }
            />
            <Field label="Profile Status" value={booking.user?.profileStatus ?? "—"} />
            {booking.user?.id && (
              <button
                style={s.viewUserBtn}
                onClick={() => router.push(`/rentals/users/${booking.user!.id}`)}
              >
                <User size={14} />
                View Customer Profile
              </button>
            )}
          </SectionCard>

          {/* Provider */}
          <SectionCard title="Rental Provider" icon={<Shield size={16} />}>
            <Field label="Provider" value={booking.car?.provider?.name ?? "—"} />
            <Field label="Email" value={booking.car?.provider?.email ?? "—"} />
            <Field
              label="Phone"
              value={booking.car?.provider?.phone ?? "—"}
            />
            {booking.car?.provider?.id && (
              <button
                style={s.viewUserBtn}
                onClick={() => router.push(`/rentals/providers/${booking.car!.provider!.id}`)}
              >
                <Shield size={14} />
                View Provider
              </button>
            )}
          </SectionCard>

          {/* Payment */}
          <SectionCard title="Payment Record" icon={<CreditCard size={16} />}>
            <div style={s.amountRow}>
              <span style={s.amountLabel}>Total Charged</span>
              <span style={s.amountValue}>{fmtMoney(booking.totalPrice, booking.currency)}</span>
            </div>
            <div style={s.divider} />
            <Field label="Base Price" value={fmtMoney(booking.basePrice, booking.currency)} />
            <Field label="Insurance Fee" value={fmtMoney(booking.insuranceFee, booking.currency)} />
            {booking.insurance && <Field label="Insurance Plan" value={booking.insurance.name} />}
            <div style={s.divider} />
            <Field
              label="Payment Status"
              value={
                <span style={{ color: paymentInfo.color, fontWeight: 700 }}>
                  {paymentInfo.label}
                </span>
              }
            />
            <Field label="Payment Method" value={booking.paymentMethod ?? "—"} />
            <Field label="Gateway" value={booking.paymentGatewayKey ?? "—"} />
            <Field label="Reference" value={booking.paymentReference ?? "—"} />
            {booking.paidAt && (
              <Field label="Paid At" value={`${fmt(booking.paidAt)} ${fmtTime(booking.paidAt)}`} />
            )}
            {booking.paymentError && (
              <Field
                label="Payment Error"
                value={<span style={{ color: "#EF4444" }}>{booking.paymentError}</span>}
              />
            )}
          </SectionCard>

          {/* Contact quick actions */}
          {booking.user?.phoneNumber && (
            <SectionCard title="Quick Actions" icon={<Phone size={16} />}>
              <a
                href={`tel:${booking.user.phoneCountry ?? ""}${booking.user.phoneNumber}`}
                style={s.quickActionBtn}
              >
                <Phone size={14} />
                Call Customer
              </a>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */

const s: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 60,
  },
  spinner: {
    width: 24,
    height: 24,
    border: "3px solid var(--glass-10)",
    borderTopColor: "#3AEDE1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  /* header */
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginTop: 24,
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "none",
    color: "var(--fg-65)",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  pageSub: {
    margin: 0,
    fontSize: 13,
    color: "var(--fg-65)",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },
  cancelBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.1)",
    color: "#FCA5A5",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },

  /* collection code */
  collectionBanner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 20px",
    borderRadius: 14,
    background: "rgba(52,211,153,0.08)",
    border: "1px solid rgba(52,211,153,0.22)",
    marginBottom: 20,
  },
  collectionLabel: {
    fontSize: 12,
    color: "var(--fg-65)",
    fontWeight: 500,
  },
  collectionCode: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 4,
    color: "#34D399",
    fontVariantNumeric: "tabular-nums",
  },

  /* grid */
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
    alignItems: "start",
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  /* section card */
  card: {
    borderRadius: 16,
    background: "var(--glass-04)",
    border: "1px solid var(--glass-08)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 20px",
    borderBottom: "1px solid var(--glass-08)",
  },
  cardIcon: {
    color: "var(--fg-65)",
    display: "flex",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--foreground)",
    letterSpacing: 0.2,
  },
  cardBody: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  /* field */
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: "var(--fg-60)",
    fontWeight: 500,
    flexShrink: 0,
  },
  fieldValue: {
    fontSize: 13,
    color: "var(--foreground)",
    fontWeight: 600,
    textAlign: "right",
    wordBreak: "break-all",
  },
  divider: {
    height: 1,
    background: "var(--glass-08)",
  },

  /* dates */
  datesRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dateBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "12px 8px",
    borderRadius: 10,
    background: "var(--glass-06)",
    border: "1px solid var(--glass-10)",
  },
  dateBoxLabel: {
    fontSize: 11,
    color: "var(--fg-55)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateBoxDate: {
    fontSize: 14,
    fontWeight: 800,
    color: "var(--foreground)",
  },
  dateBoxTime: {
    fontSize: 12,
    color: "var(--fg-65)",
  },
  dateSep: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  dateSepLine: {
    width: 18,
    height: 1,
    background: "var(--glass-14)",
  },
  dateSepDays: {
    fontSize: 12,
    fontWeight: 700,
    color: "#3AEDE1",
    background: "rgba(58,237,225,0.1)",
    border: "1px solid rgba(58,237,225,0.2)",
    borderRadius: 6,
    padding: "2px 6px",
  },

  /* car image */
  carImg: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 10,
    marginBottom: 4,
  },

  /* amount */
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: "var(--fg-65)",
  },
  amountValue: {
    fontSize: 22,
    fontWeight: 800,
    color: "var(--foreground)",
    fontVariantNumeric: "tabular-nums",
  },

  /* timeline */
  timeline: {
    display: "flex",
    flexDirection: "column",
  },
  timelineRow: {
    display: "flex",
    gap: 14,
  },
  timelineLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 24,
    flexShrink: 0,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1,
  },
  timelineContent: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingBottom: 20,
    paddingTop: 2,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
  timelineSub: {
    fontSize: 12,
    color: "var(--fg-55)",
  },

  /* quick action */
  viewUserBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    height: 36,
    padding: "0 14px",
    borderRadius: 8,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--fg-80)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  quickActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
};
