import { ProviderStatus } from "@/src/types/rentalProvider";

export default function ProviderStatusBadge({
  status,
}: {
  status: ProviderStatus;
}) {
  const colors = {
    active: "#22C55E",
    pending: "#F59E0B",
    suspended: "#EF4444",
  };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        background: colors[status] + "22",
        color: colors[status],
      }}
    >
      {status}
    </span>
  );
}
