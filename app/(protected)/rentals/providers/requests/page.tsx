"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  MoreHorizontal,
  Download,
  Filter,
  ChevronDown,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import type { ProviderRequestStatus } from "@/src/types/rentalProvider";
import {
  approveProvider,
  approveProviderRequest,
  listProviderRequests,
  listProviders,
  rejectProviderRequest,
  suspendProvider,
} from "@/src/lib/providersApi";
import styles from "./styles";

const TABS: ProviderRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

type UnifiedRequestRow = {
  id: string;
  source: "public" | "admin";
  businessName: string;
  businessType?: string;
  contactName?: string;
  contactEmail: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  country?: string;
  createdAt: string;
  status: ProviderRequestStatus;
};

export default function ProviderRequestsPage() {
  const [tab, setTab] = useState<ProviderRequestStatus>("PENDING");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<UnifiedRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);

      const [publicResponse, adminProvidersResponse] = await Promise.all([
        listProviderRequests({
          q: query.trim() || undefined,
          status: tab,
          page: 1,
          limit: 100,
        }),
        tab === "REJECTED"
          ? Promise.resolve(null)
          : listProviders({
              q: query.trim() || undefined,
              status: tab === "PENDING" ? "pending" : "active",
              page: 1,
              limit: 100,
            }),
      ]);

      const publicRows: UnifiedRequestRow[] = publicResponse.items.map((item) => ({
        id: item.id,
        source: "public",
        businessName: item.businessName,
        businessType: "Public signup",
        contactName: item.businessName,
        contactEmail: item.email,
        contactPhone: item.phone ?? "-",
        city: "-",
        state: "-",
        country: "-",
        createdAt: item.createdAt,
        status: item.status,
      }));

      const adminRows: UnifiedRequestRow[] = (adminProvidersResponse?.items || [])
        .filter((provider) => provider.createdBy === "SURERIDE_ADMIN")
        .map((provider) => ({
          id: provider.id,
          source: "admin",
          businessName: provider.name,
          businessType: "Admin onboarding",
          contactName: provider.contactPerson || provider.name,
          contactEmail: provider.email,
          contactPhone: provider.phone || "-",
          city: provider.city || "-",
          state: provider.state || "-",
          country: "-",
          createdAt: provider.joinedOn,
          status: tab,
        }));

      const merged = [...publicRows, ...adminRows].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setRows(merged);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch provider requests";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [query, tab]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadRequests();
    }, 250);

    return () => clearTimeout(timeout);
  }, [loadRequests]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const haystack = `${r.businessName} ${r.contactEmail}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      }),
    [query, rows],
  );

  const statusStyle = (status: ProviderRequestStatus) => ({
    ...styles.statusPill,
    ...(status === "PENDING"
      ? styles.statusPending
      : status === "APPROVED"
        ? styles.statusApproved
        : styles.statusRejected),
  });

  const handleApprove = async (row: UnifiedRequestRow) => {
    try {
      setProcessingId(`${row.source}-${row.id}`);

      const response =
        row.source === "public"
          ? await approveProviderRequest(row.id)
          : await approveProvider(row.id);

      toast.success(response.message || "Request approved");
      await loadRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Approve failed";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (row: UnifiedRequestRow) => {
    try {
      setProcessingId(`${row.source}-${row.id}`);

      const response =
        row.source === "public"
          ? await rejectProviderRequest(row.id, "Rejected from dashboard")
          : await suspendProvider(row.id, "Rejected during admin review");

      toast.success(response.message || "Request rejected");
      await loadRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reject failed";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

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
            {t.charAt(0) + t.slice(1).toLowerCase()} Requests
          </button>
        ))}
      </div>

      <div style={styles.card}>
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

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={{ ...styles.th, ...styles.tdDivider }}>SN</th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>Business Name</th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>Contact Info</th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>Location</th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>Date submitted</th>
                <th style={{ ...styles.th, ...styles.tdDivider }}>Status</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.empty}>
                    Loading requests...
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <Row key={`${r.source}-${r.id}`}>
                    <td style={{ ...styles.td, ...styles.tdDivider }}>{i + 1}</td>

                    <td style={{ ...styles.td, ...styles.tdDivider }}>
                      <div style={styles.twoLine}>
                        <span style={styles.primary}>{r.businessName}</span>
                        <span style={styles.secondary}>{r.businessType || "-"}</span>
                      </div>
                    </td>

                    <td style={{ ...styles.td, ...styles.tdDivider }}>
                      <div style={styles.twoLine}>
                        <span style={styles.primary}>{r.contactName || r.businessName}</span>
                        <span style={styles.secondary}>{r.contactEmail}</span>
                      </div>
                    </td>

                    <td style={{ ...styles.td, ...styles.tdDivider }}>
                      <div style={styles.twoLine}>
                        <span style={styles.primary}>{r.city || "-"}</span>
                        <span style={styles.secondary}>{r.state || "-"}</span>
                      </div>
                    </td>

                    <td style={{ ...styles.td, ...styles.tdDivider }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ ...styles.td, ...styles.tdDivider }}>
                      <span style={statusStyle(r.status)}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </span>
                    </td>

                    <td style={styles.tdRight}>
                      {tab === "PENDING" ? (
                        <div style={styles.actions}>
                          <button
                            style={styles.approveBtn}
                            disabled={processingId === `${r.source}-${r.id}`}
                            onClick={() => handleApprove(r)}
                          >
                            Approve
                          </button>
                          <button
                            style={styles.rejectBtn}
                            disabled={processingId === `${r.source}-${r.id}`}
                            onClick={() => handleReject(r)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div style={styles.actions}>
                          <button style={styles.iconBtn} title="View">
                            <Eye size={16} />
                          </button>
                          <button style={styles.iconBtn} title="More">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </Row>
                ))
              )}

              {!loading && filtered.length === 0 && (
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
