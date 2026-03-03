"use client";

import { useMemo } from "react";
import styles from "./styles";
import { Check, X } from "lucide-react";

type RequestStatus = "Pending" | "Approved" | "Rejected";

type ModelRequestRow = {
  id: string;
  brand: string;
  model: string;
  category: string;
  yearRange: string;
  provider: string;
  status: RequestStatus;
};

export default function ModelRequestsPage() {
  const rows: ModelRequestRow[] = useMemo(
    () => [
      {
        id: "req-1",
        brand: "Toyota",
        model: "Avalon",
        category: "Sedan",
        yearRange: "2019 – 2025",
        provider: "Sixt Rentals",
        status: "Pending",
      },
      {
        id: "req-2",
        brand: "Mercedes",
        model: "GLC Coupe",
        category: "SUV",
        yearRange: "2020 – 2025",
        provider: "Elite Autos",
        status: "Pending",
      },
    ],
    []
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Model Requests</h1>
          <p style={styles.subtitle}>
            Provider-submitted vehicle model requests
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Model</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Year Range</th>
                <th style={styles.th}>Requested By</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>{r.brand}</td>
                  <td style={styles.td}>{r.model}</td>
                  <td style={styles.td}>{r.category}</td>
                  <td style={styles.td}>{r.yearRange}</td>
                  <td style={styles.td}>{r.provider}</td>
                  <td style={styles.td}>
                    <span
                      style={{ ...styles.statusPill, ...styles.statusPending }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={styles.tdRight}>
                    <div style={styles.actions}>
                      <button style={styles.iconBtn} title="Approve">
                        <Check size={16} />
                      </button>
                      <button style={styles.iconBtn} title="Reject">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
