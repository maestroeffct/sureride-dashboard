import { RentalProvider } from "@/src/types/rentalProvider";

export default function ProvidersActions({
  provider,
}: {
  provider: RentalProvider;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <a href={`/dashboard/rentals/providers/${provider.id}`}>View</a>

      {provider.status === "pending" && <button>Approve</button>}

      {provider.status === "active" && (
        <button style={{ color: "#EF4444" }}>Suspend</button>
      )}
    </div>
  );
}
