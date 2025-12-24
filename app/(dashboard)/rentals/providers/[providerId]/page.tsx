"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import ProviderStatusBadge from "@/src/components/rentals/providers/ProviderStatusBadge";
import ProviderActionsBar from "@/src/components/rentals/providers/ProviderActionsBar";

const TABS = [
  "Overview",
  "Cars",
  "Documents",
  "Bookings",
  "Financials",
  "Activity Logs",
];

export default function ProviderDetailPage() {
  const params = useParams();
  const rawProviderId = params.providerId;
  const providerId = Array.isArray(rawProviderId)
    ? rawProviderId[0]
    : rawProviderId ?? "";

  const [activeTab, setActiveTab] = useState("Overview");

  // 🔌 Replace with API fetch
  const provider = {
    id: providerId,
    name: "Prime Rentals Ltd",
    status: "pending" as "pending" | "active" | "suspended",
    city: "Lagos",
    totalCars: 12,
    joinedOn: "2024-12-01",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{provider.name}</h1>
          <ProviderStatusBadge status={provider.status} />
        </div>

        <ProviderActionsBar provider={provider} />
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              ...styles.tab,
              ...(activeTab === t ? styles.tabActive : {}),
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={styles.content}>
        {activeTab === "Overview" && (
          <div>
            <p>
              <strong>City:</strong> {provider.city}
            </p>
            <p>
              <strong>Total Cars:</strong> {provider.totalCars}
            </p>
            <p>
              <strong>Joined On:</strong> {provider.joinedOn}
            </p>
          </div>
        )}

        {activeTab !== "Overview" && (
          <div style={{ color: "#9CA3AF" }}>
            {activeTab} content coming next…
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: { fontSize: 26, fontWeight: 700 },
  tabs: {
    display: "flex",
    gap: 8,
    borderBottom: "1px solid #1F2937",
  },
  tab: {
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
  },
  tabActive: {
    color: "#E5E7EB",
    borderBottom: "2px solid #2563EB",
  },
  content: {
    padding: 16,
    background: "#020617",
    border: "1px solid #1F2937",
    borderRadius: 12,
  },
};
