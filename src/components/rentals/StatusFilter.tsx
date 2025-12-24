"use client";

import styles from "@/app/(dashboard)/rentals/bookings/styles";

export type BookingStatus =
  | "ALL"
  | "SCHEDULED"
  | "PENDING"
  | "ACCEPTED"
  | "PROCESSING"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED"
  | "PAYMENT_FAILED"
  | "REFUNDED";

const STATUSES: {
  key: BookingStatus;
  label: string;
  color: string;
  count: number;
}[] = [
  { key: "ALL", label: "All", color: "#CBD5E1", count: 32 },
  { key: "SCHEDULED", label: "Scheduled", color: "#60A5FA", count: 1 },
  { key: "PENDING", label: "Pending", color: "#86EFAC", count: 3 },
  { key: "ACCEPTED", label: "Accepted", color: "#34D399", count: 1 },
  { key: "PROCESSING", label: "Processing", color: "#FBBF24", count: 0 },
  { key: "ON_THE_WAY", label: "On The Way", color: "#FDBA74", count: 1 },
  { key: "DELIVERED", label: "Delivered", color: "#22C55E", count: 10 },
  { key: "CANCELLED", label: "Cancelled", color: "#F87171", count: 17 },
  {
    key: "PAYMENT_FAILED",
    label: "Payment Failed",
    color: "#FB7185",
    count: 0,
  },
  { key: "REFUNDED", label: "Refunded", color: "#A78BFA", count: 0 },
];

interface Props {
  active: BookingStatus;
  onChange: (status: BookingStatus) => void;
}

export default function StatusFilter({ active, onChange }: Props) {
  return (
    <aside style={styles.filterPanel}>
      {STATUSES.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          style={{
            ...styles.filterItem,
            ...(active === s.key ? styles.filterItemActive : {}),
          }}
        >
          <span
            style={{
              ...styles.statusDot,
              background: s.color,
            }}
          />
          <span style={styles.filterLabel}>{s.label}</span>

          <span
            style={{
              ...styles.filterCount,
              background: `${s.color}22`,
              color: s.color,
            }}
          >
            {s.count}
          </span>
        </button>
      ))}
    </aside>
  );
}
