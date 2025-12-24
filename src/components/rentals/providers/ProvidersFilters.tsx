interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filters: {
    status: string;
    city: string;
    rating: string;
  };
  onFiltersChange: (v: any) => void;
}

export default function ProvidersFilters({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <input
        placeholder="Search providers..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={input}
      />

      <select
        value={filters.status}
        onChange={(e) =>
          onFiltersChange({ ...filters, status: e.target.value })
        }
        style={select}
      >
        <option value="">Status</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="suspended">Suspended</option>
      </select>

      <select style={select}>
        <option>City</option>
      </select>

      <select style={select}>
        <option>Rating</option>
        <option>1–5</option>
      </select>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: "10px 14px",
  width: 260,
  background: "#020617",
  border: "1px solid #1F2937",
  borderRadius: 8,
  color: "#E5E7EB",
};

const select: React.CSSProperties = {
  padding: "10px 14px",
  background: "#020617",
  border: "1px solid #1F2937",
  borderRadius: 8,
  color: "#E5E7EB",
};
