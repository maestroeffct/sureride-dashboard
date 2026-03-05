"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import ProviderStatusBadge from "@/src/components/rentals/providers/ProviderStatusBadge";
import ProviderActionsBar from "@/src/components/rentals/providers/ProviderActionsBar";
import {
  approveProviderDocument,
  listProviderDocuments,
  listProviders,
  rejectProviderDocument,
  type ProviderDocumentApi,
  type ProviderDocumentStatus,
  type ProviderSummaryApi,
} from "@/src/lib/providersApi";
import { bookingsTableTheme } from "@/src/components/rentals/table/sharedTableStyles";

const TABS = [
  "Overview",
  "Cars",
  "Documents",
  "Bookings",
  "Financials",
  "Activity Logs",
] as const;

export default function ProviderDetailPage() {
  const params = useParams();
  const rawProviderId = params.providerId;
  const providerId = Array.isArray(rawProviderId)
    ? rawProviderId[0]
    : rawProviderId ?? "";

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderSummaryApi | null>(null);

  const [documents, setDocuments] = useState<ProviderDocumentApi[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [docBusyId, setDocBusyId] = useState<string | null>(null);

  const loadProvider = async () => {
    try {
      setLoading(true);
      const response = await listProviders({ page: 1, limit: 100 });
      const found = response.items.find((item) => item.id === providerId) ?? null;
      setProvider(found);

      if (!found) {
        toast.error(
          "Provider not found in current list. Add provider detail endpoint in backend.",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch provider";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!providerId) return;

    try {
      setDocumentsLoading(true);
      const docs = await listProviderDocuments(providerId);
      setDocuments(docs);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch provider documents";
      toast.error(message);
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    void loadProvider();
  }, [providerId]);

  useEffect(() => {
    if (activeTab === "Documents") {
      void loadDocuments();
    }
  }, [activeTab, providerId]);

  const statusPillStyle = (status: ProviderDocumentStatus): React.CSSProperties => {
    if (status === "APPROVED") {
      return {
        ...styles.statusPill,
        background: "rgba(34,197,94,0.16)",
        color: "#86EFAC",
        border: "1px solid rgba(34,197,94,0.24)",
      };
    }

    if (status === "REJECTED") {
      return {
        ...styles.statusPill,
        background: "rgba(239,68,68,0.16)",
        color: "#FCA5A5",
        border: "1px solid rgba(239,68,68,0.24)",
      };
    }

    return {
      ...styles.statusPill,
      background: "rgba(250,204,21,0.16)",
      color: "#FDE68A",
      border: "1px solid rgba(250,204,21,0.24)",
    };
  };

  const handleApproveDoc = async (docId: string) => {
    try {
      setDocBusyId(docId);
      const response = await approveProviderDocument(docId);
      toast.success(response.message || "Document approved");
      await loadDocuments();
      await loadProvider();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Approve failed";
      toast.error(message);
    } finally {
      setDocBusyId(null);
    }
  };

  const handleRejectDoc = async (docId: string) => {
    const reason = window.prompt("Reason for rejection");
    if (!reason || !reason.trim()) return;

    try {
      setDocBusyId(docId);
      const response = await rejectProviderDocument(docId, reason.trim());
      toast.success(response.message || "Document rejected");
      await loadDocuments();
      await loadProvider();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reject failed";
      toast.error(message);
    } finally {
      setDocBusyId(null);
    }
  };

  const documentsSummary = useMemo(() => {
    const approved = documents.filter((doc) => doc.status === "APPROVED").length;
    const pending = documents.filter((doc) => doc.status === "PENDING").length;
    const rejected = documents.filter((doc) => doc.status === "REJECTED").length;

    return { approved, pending, rejected };
  }, [documents]);

  if (loading) {
    return <div>Loading provider...</div>;
  }

  if (!provider) {
    return (
      <div style={{ color: "var(--muted-foreground)" }}>Provider not found.</div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{provider.name}</h1>
          <ProviderStatusBadge status={provider.status} />
        </div>

        <ProviderActionsBar
          provider={{ id: provider.id, status: provider.status }}
          onMutated={loadProvider}
        />
      </div>

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

      <div style={styles.content}>
        {activeTab === "Overview" && (
          <div>
            <p>
              <strong>Email:</strong> {provider.email}
            </p>
            <p>
              <strong>Phone:</strong> {provider.phone || "-"}
            </p>
            <p>
              <strong>Contact:</strong> {provider.contactPerson || "-"}
            </p>
            <p>
              <strong>City/Address:</strong> {provider.city || "-"}
            </p>
            <p>
              <strong>Total Cars:</strong> {provider.totalCars}
            </p>
            <p>
              <strong>Active Cars:</strong> {provider.activeCars}
            </p>
            <p>
              <strong>Documents:</strong> {provider.documentsCount}
            </p>
            <p>
              <strong>Joined On:</strong>{" "}
              {new Date(provider.joinedOn).toLocaleDateString()}
            </p>
          </div>
        )}

        {activeTab === "Documents" && (
          <div style={styles.docsSection}>
            <div style={styles.docsSummaryRow}>
              <span style={styles.summaryItem}>
                Total: <strong>{documents.length}</strong>
              </span>
              <span style={styles.summaryItem}>
                Approved: <strong>{documentsSummary.approved}</strong>
              </span>
              <span style={styles.summaryItem}>
                Pending: <strong>{documentsSummary.pending}</strong>
              </span>
              <span style={styles.summaryItem}>
                Rejected: <strong>{documentsSummary.rejected}</strong>
              </span>
            </div>

            <div style={styles.tableCard}>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.theadRow}>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Submitted</th>
                      <th style={styles.th}>Note</th>
                      <th style={styles.th}>File</th>
                      <th style={styles.thRight}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documentsLoading ? (
                      <tr>
                        <td colSpan={6} style={styles.emptyCell}>
                          Loading documents...
                        </td>
                      </tr>
                    ) : documents.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={styles.emptyCell}>
                          No provider documents yet.
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={doc.id} style={styles.tr}>
                          <td style={styles.td}>{doc.type}</td>
                          <td style={styles.td}>
                            <span style={statusPillStyle(doc.status)}>
                              {doc.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td style={styles.td}>{doc.rejectionReason || "-"}</td>
                          <td style={styles.td}>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.fileLink}
                            >
                              Open <ExternalLink size={14} />
                            </a>
                          </td>
                          <td style={styles.tdRight}>
                            {doc.status === "PENDING" ? (
                              <div style={styles.docActions}>
                                <button
                                  style={styles.approveBtn}
                                  disabled={docBusyId === doc.id}
                                  onClick={() => handleApproveDoc(doc.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  style={styles.rejectBtn}
                                  disabled={docBusyId === doc.id}
                                  onClick={() => handleRejectDoc(doc.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={styles.mutedText}>No action</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab !== "Overview" && activeTab !== "Documents" && (
          <div style={{ color: "var(--muted-foreground)" }}>
            {activeTab} content coming next…
          </div>
        )}
      </div>
    </div>
  );
}

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
    borderBottom: "1px solid var(--input-border)",
  },
  tab: {
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    color: "var(--muted-foreground)",
    cursor: "pointer",
  },
  tabActive: {
    color: "var(--foreground)",
    borderBottom: "2px solid #2563EB",
  },
  content: {
    padding: 16,
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    borderRadius: 12,
  },
  docsSection: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  docsSummaryRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  summaryItem: {
    fontSize: 13,
    color: "var(--fg-80)",
  },
  tableCard: bookingsTableTheme.card,
  tableWrap: bookingsTableTheme.tableWrap,
  table: bookingsTableTheme.table,
  theadRow: bookingsTableTheme.theadRow,
  th: bookingsTableTheme.th,
  thRight: bookingsTableTheme.thRight,
  tr: bookingsTableTheme.tr,
  td: bookingsTableTheme.td,
  tdRight: bookingsTableTheme.tdRight,
  emptyCell: bookingsTableTheme.emptyCell,
  statusPill: bookingsTableTheme.statusPill,
  fileLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#60A5FA",
    textDecoration: "none",
  },
  docActions: {
    display: "inline-flex",
    gap: 8,
  },
  approveBtn: {
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  rejectBtn: {
    border: "1px solid rgba(239,68,68,0.4)",
    background: "rgba(239,68,68,0.16)",
    color: "#FCA5A5",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  mutedText: {
    color: "var(--fg-60)",
  },
};
