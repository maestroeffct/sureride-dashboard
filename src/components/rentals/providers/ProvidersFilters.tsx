import { Search } from "lucide-react";

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
    <div style={styles.row}>
      <div style={styles.searchBox}>
        <input
          placeholder="Search providers..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.searchIconWrap}>
          <Search size={18} />
        </div>
      </div>

      <select
        value={filters.status}
        onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
        style={styles.select}
      >
        <option value="">Status</option>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>

      <input
        value={filters.city}
        onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
        placeholder="City"
        style={styles.selectLikeInput}
      />

      <select
        value={filters.rating}
        onChange={(e) => onFiltersChange({ ...filters, rating: e.target.value })}
        style={styles.select}
      >
        <option value="">Rating</option>
        <option value="5">5</option>
        <option value="4">4+</option>
        <option value="3">3+</option>
        <option value="2">2+</option>
        <option value="1">1+</option>
      </select>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  searchBox: {
    height: 48,
    width: 440,
    maxWidth: "100%",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "var(--foreground)",
    padding: "0 14px",
    fontSize: 14,
  },
  searchIconWrap: {
    width: 52,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderLeft: "1px solid var(--glass-10)",
    color: "var(--fg-80)",
  },
  select: {
    height: 44,
    minWidth: 140,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },
  selectLikeInput: {
    height: 44,
    minWidth: 140,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  },
};
