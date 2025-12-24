"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  MoreHorizontal,
  Download,
  Filter,
  ChevronDown,
  Search,
} from "lucide-react";
import type {
  ProviderRequestRow,
  ProviderRequestStatus,
} from "@/src/types/rentalProvider";
import styles from "./styles";

const TABS = ["Pending", "Rejected"] as const;

export default function ProviderRequestsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pending");
  const [query, setQuery] = useState("");

  const rows: ProviderRequestRow[] = useMemo(
    () => [
      {
        id: "PR-10001",
        businessName: "Sixt Rentals",
        businessType: "Company",
        contactName: "John Doe",
        contactEmail: "john@sixt.com",
        city: "Lagos",
        state: "Ikeja",
        country: "Nigeria",
        createdAt: "2025-12-22T09:20:00Z",
        status: "Pending",
      },
    ],
    []
  );

  const filtered = rows.filter(
    (r) =>
      r.status === tab &&
      `${r.businessName} ${r.contactEmail}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  const statusStyle = (status: ProviderRequestStatus) => ({
    ...styles.statusPill,
    ...(status === "Pending" ? styles.statusPending : styles.statusRejected),
  });
  const [exportOpen, setExportOpen] = useState(false);

  function Row({ children }: { children: React.ReactNode }) {
    const [hover, setHover] = useState(false);

    return (
      <tr
        style={{ ...styles.tr, ...(hover ? styles.trHover : {}) }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </tr>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Provider Requests</h1>
          <p style={styles.subtitle}>Incoming rental provider applications</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.exportWrap}>
            <button
              type="button"
              style={styles.exportButton}
              onClick={() => setExportOpen((v) => !v)}
            >
              <Download size={16} />
              <span>Export</span>
              <ChevronDown size={16} />
            </button>

            {exportOpen && (
              <div style={styles.exportDropdown}>
                <button
                  style={styles.exportItem}
                  onClick={() => setExportOpen(false)}
                >
                  Export CSV
                </button>
                <button
                  style={styles.exportItem}
                  onClick={() => setExportOpen(false)}
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>

          <button type="button" style={styles.filtersButton}>
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tab,
              ...(tab === t ? styles.tabActive : {}),
            }}
          >
            {t} Requests
          </button>
        ))}
      </div>

      {/* CARD */}
      <div style={styles.card}>
        {/* SEARCH */}
        <div style={styles.searchRow}>
          <div style={styles.searchBox}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Providers..."
              style={styles.searchInput}
            />
            <div style={styles.searchIconWrap}>
              <Search size={18} />
            </div>
          </div>
        </div>

        {/* TABLE */}
        {/* TABLE */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={{ ...styles.th, ...styles.tdDivider }}>SN</th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>
                  Business Name
                </th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>
                  Contact Info
                </th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>Location</th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>
                  Date submitted
                </th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r, i) => (
                <Row key={r.id}>
                  <td style={{ ...styles.td, ...styles.tdDivider }}>{i + 1}</td>

                  <td style={{ ...styles.td, ...styles.tdDivider }}>
                    <div style={styles.twoLine}>
                      <span style={styles.primary}>{r.businessName}</span>
                      <span style={styles.secondary}>{r.businessType}</span>
                    </div>
                  </td>

                  <td style={{ ...styles.td, ...styles.tdDivider }}>
                    <div style={styles.twoLine}>
                      <span style={styles.primary}>{r.contactName}</span>
                      <span style={styles.secondary}>{r.contactEmail}</span>
                    </div>
                  </td>

                  <td style={{ ...styles.td, ...styles.tdDivider }}>
                    <div style={styles.twoLine}>
                      <span style={styles.primary}>{r.city}</span>
                      <span style={styles.secondary}>{r.state}</span>
                    </div>
                  </td>

                  <td style={{ ...styles.td, ...styles.tdDivider }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>

                  <td style={{ ...styles.td, ...styles.tdDivider }}>
                    <span
                      style={{
                        ...styles.statusPill,
                        ...(r.status === "Pending"
                          ? styles.statusPending
                          : styles.statusRejected),
                      }}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td style={styles.tdRight}>
                    <div style={styles.actions}>
                      <button style={styles.iconBtn} title="View">
                        <Eye size={16} />
                      </button>
                      <button style={styles.iconBtn} title="More">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </Row>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    No {tab.toLowerCase()} provider requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
