"use client";

import { useState } from "react";
import ProvidersTable from "@/src/components/rentals/providers/ProvidersTable";
import ProvidersFilters from "@/src/components/rentals/providers/ProvidersFilters";
import { RentalProvider } from "@/src/types/rentalProvider";

export default function RentalProvidersPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    city: "",
    rating: "",
  });

  // 🔌 Replace later with API call
  const providers: RentalProvider[] = [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Rental Providers</h1>

        <div style={{ display: "flex", gap: 12 }}>
          <button style={btnSecondary}>Export</button>
          <a href="/rentals/providers/new" style={btnPrimary}>
            + Add Provider
          </a>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <ProvidersFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* TABLE */}
      <ProvidersTable providers={providers} />
    </div>
  );
}

/* ---------------------------------- */
/* Styles */
/* ---------------------------------- */

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  background: "#2563EB",
  color: "#fff",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 500,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  background: "#020617",
  border: "1px solid #1F2937",
  color: "#E5E7EB",
  borderRadius: 8,
};
