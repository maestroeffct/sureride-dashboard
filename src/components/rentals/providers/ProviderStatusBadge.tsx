import { ProviderStatus } from "@/src/types/rentalProvider";

export default function ProviderStatusBadge({
  status,
  isVerified,
}: {
  status: ProviderStatus;
  isVerified?: boolean;
}) {
  const colors = {
    draft: "#94A3B8",
    active: "#22C55E",
    pending: "#F59E0B",
    suspended: "#EF4444",
  };

  // A provider whose workflow says ACTIVE but who isn't yet fully verified
  // shouldn't be painted green — it's misleading to admins triaging payouts
  // and bookings. Show amber + an explicit "Incomplete" tag instead.
  const incomplete = status === "active" && isVerified === false;
  const color = incomplete ? colors.pending : colors[status];
  const label = incomplete ? "Active · Incomplete" : status;

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        background: color + "22",
        color,
        textTransform: incomplete ? "none" : "capitalize",
        whiteSpace: "nowrap",
      }}
      title={
        incomplete
          ? "Provider is marked Active but has unverified documents or bank details"
          : undefined
      }
    >
      {label}
    </span>
  );
}
