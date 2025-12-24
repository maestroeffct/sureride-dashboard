"use client";

import { useMemo, useState } from "react";
import styles from "@/app/(dashboard)/rentals/bookings/styles"; // 👈 SAME STYLES FILE
import { Calendar, Search, Eye, MoreHorizontal } from "lucide-react";
import type {
  ProviderRequestRow,
  ProviderRequestStatus,
} from "@/src/types/rentalProvider";

export default function ProviderRequestsPage() {
  const [query, setQuery] = useState("");

  const rows: ProviderRequestRow[] = useMemo(
    () => [
      {
        id: "PR-10001",
        businessName: "Sixt Rentals",
        businessType: "Company",
        contactName: "John Doe",
        contactEmail: "john@sixt.com",
        contactPhone: "+234 901 234 5678",
        city: "Lagos",
        state: "Ikeja",
        country: "Nigeria",
        createdAt: "2025-12-22T09:20:00Z",
        status: "Pending",
      },
    ],
    []
  );

  const filtered = rows.filter((r) =>
    `${r.businessName} ${r.contactEmail}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function getProviderStatusStyle(status: ProviderRequestStatus) {
    const base = styles.statusPill;

    const map: Record<ProviderRequestStatus, React.CSSProperties> = {
      Pending: styles.statusPending,
      Approved: styles.statusCompleted,
      Rejected: styles.statusCancelled,
    };

    return { ...base, ...map[status] };
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <div style={styles.pageTitleRow}>
            <Calendar size={18} style={styles.pageTitleIcon} />
            <h1 style={styles.pageTitle}>Provider Requests</h1>
            <span style={styles.countBadge}>{filtered.length}</span>
          </div>
          <p style={styles.pageSubtitle}>
            Incoming rental provider applications
          </p>
        </div>
      </div>

      {/* CARD */}
      <div style={styles.card}>
        {/* SEARCH */}
        <div style={styles.searchRow}>
          <div style={styles.searchBox}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search provider requests..."
              style={styles.searchInput}
            />
            <div style={styles.searchIconWrap}>
              <Search size={18} />
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* TABLE */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>SL</th>
                <th style={styles.th}>Business</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r, idx) => {
                const created = new Date(r.createdAt);

                return (
                  <tr key={r.id} style={styles.tr}>
                    <td style={styles.td}>{idx + 1}</td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>{r.businessName}</span>
                        <span style={styles.secondaryText}>
                          {r.businessType}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>{r.contactName}</span>
                        <span style={styles.secondaryText}>
                          {r.contactEmail}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>
                          {r.city}, {r.state}
                        </span>
                        <span style={styles.secondaryText}>{r.country}</span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.twoLine}>
                        <span style={styles.primaryText}>
                          {created.toLocaleDateString()}
                        </span>
                        <span style={styles.secondaryText}>
                          {created.toLocaleTimeString()}
                        </span>
                      </div>
                    </td>

                    <td style={styles.td}>
                      <span style={getProviderStatusStyle(r.status)}>
                        {r.status}
                      </span>
                    </td>

                    <td style={styles.tdRight}>
                      <div style={styles.actionsRow}>
                        <button style={styles.iconAction} title="View">
                          <Eye size={18} />
                        </button>
                        <button style={styles.iconAction} title="More">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    No provider requests found.
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
