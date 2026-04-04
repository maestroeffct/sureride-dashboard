"use client";

import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ExternalLink, MapPin, Wallet, FileText, CarFront } from "lucide-react";
import toast from "react-hot-toast";
import ProviderStatusBadge from "@/src/components/rentals/providers/ProviderStatusBadge";
import ProviderActionsBar from "@/src/components/rentals/providers/ProviderActionsBar";
import {
  approveProviderDocument,
  getProviderDetail,
  rejectProviderDocument,
  type ProviderDetailApi,
  type ProviderDocumentStatus,
} from "@/src/lib/providersApi";

const TABS = [
  "Overview",
  "Locations",
  "Fleet",
  "Documents",
  "Financials",
] as const;

export default function ProviderDetailPage() {
  const params = useParams();
  const rawProviderId = params.providerId;
  const providerId = Array.isArray(rawProviderId)
    ? rawProviderId[0]
    : rawProviderId ?? "";

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderDetailApi | null>(null);
  const [docBusyId, setDocBusyId] = useState<string | null>(null);

  const loadProvider = async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      const response = await getProviderDetail(providerId);
      setProvider(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch provider";
      toast.error(message);
      setProvider(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProvider();
  }, [providerId]);

  const documentsSummary = useMemo(() => {
    const documents = provider?.documents ?? [];
    const approved = documents.filter((doc) => doc.status === "APPROVED").length;
    const pending = documents.filter((doc) => doc.status === "PENDING").length;
    const rejected = documents.filter((doc) => doc.status === "REJECTED").length;

    return { approved, pending, rejected };
  }, [provider]);

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
      await loadProvider();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reject failed";
      toast.error(message);
    } finally {
      setDocBusyId(null);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading provider...</div>;
  }

  if (!provider) {
    return <div style={styles.empty}>Provider not found.</div>;
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroMain}>
          <p style={styles.eyebrow}>Provider Record</p>
          <div style={styles.heroTitleRow}>
            <h1 style={styles.title}>{provider.name}</h1>
            <ProviderStatusBadge
              status={
                provider.status === "PENDING_APPROVAL"
                  ? "pending"
                  : provider.status === "ACTIVE"
                    ? "active"
                    : provider.status === "SUSPENDED"
                      ? "suspended"
                      : "draft"
              }
            />
          </div>
          <p style={styles.subtitle}>
            Review the provider’s operating profile, documents, locations, fleet,
            and payout setup from one place.
          </p>

          <div style={styles.heroMeta}>
            <MetaPill label="Created By" value={provider.createdBy.replaceAll("_", " ")} />
            <MetaPill
              label="Joined"
              value={new Date(provider.createdAt).toLocaleDateString()}
            />
            <MetaPill
              label="Verification"
              value={provider.isVerified ? "Verified" : "Pending"}
            />
          </div>
        </div>

        <div style={styles.heroAside}>
          <ProviderActionsBar
            provider={{
              id: provider.id,
              status:
                provider.status === "PENDING_APPROVAL"
                  ? "pending"
                  : provider.status === "ACTIVE"
                    ? "active"
                    : provider.status === "SUSPENDED"
                      ? "suspended"
                      : "draft",
            }}
            onMutated={loadProvider}
          />
        </div>
      </section>

      <section style={styles.kpiGrid}>
        <KpiCard label="Total Cars" value={provider.stats.totalCars} icon={<CarFront size={16} />} />
        <KpiCard label="Active Cars" value={provider.stats.activeCars} icon={<CarFront size={16} />} />
        <KpiCard label="Locations" value={provider.stats.locationsCount} icon={<MapPin size={16} />} />
        <KpiCard label="Documents" value={provider.stats.documentsCount} icon={<FileText size={16} />} />
        <KpiCard
          label="Commission"
          value={
            provider.commissionRate !== null
              ? `${(provider.commissionRate * 100).toFixed(1)}%`
              : "Default"
          }
          icon={<Wallet size={16} />}
        />
      </section>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div style={styles.contentGrid}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Business Profile</h2>
            <div style={styles.infoGrid}>
              <InfoItem label="Business Email" value={provider.email} />
              <InfoItem label="Phone" value={provider.phone || "-"} />
              <InfoItem
                label="Contact Person"
                value={provider.contactPersonName || "-"}
              />
              <InfoItem
                label="Contact Role"
                value={provider.contactPersonRole || "-"}
              />
              <InfoItem
                label="Contact Phone"
                value={provider.contactPersonPhone || "-"}
              />
              <InfoItem
                label="Country"
                value={provider.country?.name || "-"}
              />
              <InfoItem
                label="Primary Address"
                value={provider.businessAddress || "-"}
              />
              <InfoItem
                label="Last Updated"
                value={new Date(provider.updatedAt).toLocaleString()}
              />
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Operational Snapshot</h2>
            <div style={styles.stack}>
              <SnapshotRow
                label="Pending Cars"
                value={String(provider.stats.pendingCars)}
              />
              <SnapshotRow
                label="Provider Locations"
                value={String(provider.locations.length)}
              />
              <SnapshotRow
                label="Uploaded Documents"
                value={String(provider.documents.length)}
              />
              <SnapshotRow
                label="Payout Account"
                value={provider.payoutAccount ? "Configured" : "Not configured"}
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === "Locations" && (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.cardTitle}>Provider Locations</h2>
            <span style={styles.sectionMeta}>
              {provider.locations.length} saved
            </span>
          </div>

          {provider.locations.length === 0 ? (
            <div style={styles.empty}>
              No location records yet. Admin onboarding details will now seed a
              primary provider location automatically.
            </div>
          ) : (
            <div style={styles.locationGrid}>
              {provider.locations.map((location) => (
                <article key={location.id} style={styles.locationCard}>
                  <div style={styles.locationHead}>
                    <strong style={styles.locationTitle}>{location.name}</strong>
                    <span style={styles.locationBadge}>
                      {location._count?.cars ?? 0} car
                      {(location._count?.cars ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p style={styles.locationAddress}>{location.address}</p>
                  <p style={styles.locationMeta}>
                    {location.country?.name || "No country"}
                    {typeof location.latitude === "number" &&
                    typeof location.longitude === "number"
                      ? ` • ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "Fleet" && (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.cardTitle}>Fleet</h2>
            <span style={styles.sectionMeta}>{provider.cars.length} cars</span>
          </div>

          {provider.cars.length === 0 ? (
            <div style={styles.empty}>No cars added by this provider yet.</div>
          ) : (
            <div style={styles.carGrid}>
              {provider.cars.map((car) => (
                <article key={car.id} style={styles.carCard}>
                  <div style={styles.carImageWrap}>
                    {car.images?.[0]?.url ? (
                      <img
                        src={car.images[0].url}
                        alt={`${car.brand} ${car.model}`}
                        style={styles.carImage}
                      />
                    ) : (
                      <div style={styles.carImageFallback}>No image</div>
                    )}
                  </div>
                  <div style={styles.carContent}>
                    <div style={styles.locationHead}>
                      <strong style={styles.locationTitle}>
                        {car.brand} {car.model}
                      </strong>
                      <span style={styles.locationBadge}>{car.status}</span>
                    </div>
                    <p style={styles.carMeta}>
                      {car.category} • {car.year} • NGN{" "}
                      {Number(car.dailyRate ?? 0).toLocaleString()}/day
                    </p>
                    <p style={styles.locationMeta}>
                      {car.location?.name || "No location"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "Documents" && (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.cardTitle}>Documents</h2>
            <div style={styles.docsSummaryRow}>
              <span style={styles.summaryItem}>
                Total <strong>{provider.documents.length}</strong>
              </span>
              <span style={styles.summaryItem}>
                Approved <strong>{documentsSummary.approved}</strong>
              </span>
              <span style={styles.summaryItem}>
                Pending <strong>{documentsSummary.pending}</strong>
              </span>
              <span style={styles.summaryItem}>
                Rejected <strong>{documentsSummary.rejected}</strong>
              </span>
            </div>
          </div>

          {provider.documents.length === 0 ? (
            <div style={styles.empty}>No provider documents uploaded yet.</div>
          ) : (
            <div style={styles.docsGrid}>
              {provider.documents.map((doc) => (
                <article key={doc.id} style={styles.docCard}>
                  <div style={styles.docHeader}>
                    <strong style={styles.locationTitle}>{doc.type}</strong>
                    <span style={statusPillStyle(doc.status)}>{doc.status}</span>
                  </div>
                  <p style={styles.docMeta}>
                    Submitted {new Date(doc.createdAt).toLocaleString()}
                  </p>
                  <p style={styles.docReason}>
                    {doc.rejectionReason || "No review note"}
                  </p>
                  <div style={styles.docActions}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.linkButton}
                    >
                      <ExternalLink size={14} />
                      Open File
                    </a>
                    <button
                      style={styles.approveButton}
                      disabled={docBusyId === doc.id || doc.status === "APPROVED"}
                      onClick={() => void handleApproveDoc(doc.id)}
                    >
                      {docBusyId === doc.id ? "Working..." : "Approve"}
                    </button>
                    <button
                      style={styles.rejectButton}
                      disabled={docBusyId === doc.id}
                      onClick={() => void handleRejectDoc(doc.id)}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "Financials" && (
        <div style={styles.contentGrid}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Provider Banking</h2>
            <div style={styles.infoGrid}>
              <InfoItem label="Bank Name" value={provider.bankName || "-"} />
              <InfoItem
                label="Account Name"
                value={provider.bankAccountName || "-"}
              />
              <InfoItem
                label="Account Number"
                value={provider.bankAccountNumber || "-"}
              />
              <InfoItem
                label="Commission Rate"
                value={
                  provider.commissionRate !== null
                    ? `${(provider.commissionRate * 100).toFixed(2)}%`
                    : "Global default"
                }
              />
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Payout Account</h2>
            {provider.payoutAccount ? (
              <div style={styles.infoGrid}>
                <InfoItem
                  label="Bank Name"
                  value={provider.payoutAccount.bankName}
                />
                <InfoItem
                  label="Account Name"
                  value={provider.payoutAccount.accountName}
                />
                <InfoItem
                  label="Account Number"
                  value={provider.payoutAccount.accountNumber}
                />
                <InfoItem
                  label="Currency"
                  value={provider.payoutAccount.currency}
                />
                <InfoItem
                  label="Verification"
                  value={provider.payoutAccount.isVerified ? "Verified" : "Pending"}
                />
              </div>
            ) : (
              <div style={styles.empty}>No payout account configured yet.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <article style={styles.kpiCard}>
      <div style={styles.kpiIcon}>{icon}</div>
      <span style={styles.kpiLabel}>{label}</span>
      <strong style={styles.kpiValue}>{value}</strong>
    </article>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span style={styles.metaPill}>
      <strong>{label}:</strong> {value}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.snapshotRow}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
    maxWidth: 1380,
  },
  loading: {
    padding: 24,
    color: "var(--muted-foreground)",
  },
  empty: {
    borderRadius: 16,
    border: "1px dashed var(--input-border)",
    background: "var(--surface-2)",
    padding: 22,
    textAlign: "center",
    color: "var(--muted-foreground)",
  },
  hero: {
    borderRadius: 28,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(14,116,144,0.28))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  heroMain: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
    flex: "1 1 620px",
  },
  heroAside: {
    display: "flex",
    justifyContent: "flex-end",
    flex: "0 0 auto",
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--fg-60)",
  },
  heroTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    maxWidth: 780,
    color: "var(--fg-75)",
    lineHeight: 1.6,
  },
  heroMeta: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  metaPill: {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(15,23,42,0.32)",
    padding: "8px 12px",
    fontSize: 12,
    color: "#e2e8f0",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  kpiCard: {
    borderRadius: 18,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "rgba(59,130,246,0.14)",
    color: "#93c5fd",
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  tab: {
    height: 40,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    fontWeight: 700,
    cursor: "pointer",
  },
  tabActive: {
    background: "var(--foreground)",
    color: "var(--background)",
    borderColor: "var(--foreground)",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 18,
  },
  card: {
    borderRadius: 18,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  infoItem: {
    borderRadius: 14,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "var(--muted-foreground)",
    fontWeight: 700,
  },
  infoValue: {
    fontSize: 15,
    color: "var(--foreground)",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  snapshotRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    paddingBottom: 10,
    borderBottom: "1px solid var(--input-border)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionMeta: {
    fontSize: 12,
    color: "var(--muted-foreground)",
    fontWeight: 700,
  },
  locationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 14,
  },
  locationCard: {
    borderRadius: 16,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  locationHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  locationTitle: {
    fontSize: 16,
    color: "var(--foreground)",
  },
  locationBadge: {
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: "5px 10px",
    fontSize: 11,
    color: "var(--muted-foreground)",
    fontWeight: 700,
  },
  locationAddress: {
    margin: 0,
    color: "var(--foreground)",
    lineHeight: 1.5,
  },
  locationMeta: {
    margin: 0,
    color: "var(--muted-foreground)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  carGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 14,
  },
  carCard: {
    borderRadius: 16,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  carImageWrap: {
    width: "100%",
    aspectRatio: "16 / 10",
    background: "rgba(148,163,184,0.08)",
    overflow: "hidden",
  },
  carImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  carImageFallback: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "var(--muted-foreground)",
    fontSize: 13,
  },
  carContent: {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  carMeta: {
    margin: 0,
    color: "var(--foreground)",
    fontSize: 13,
  },
  docsSummaryRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  summaryItem: {
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: "7px 12px",
    fontSize: 12,
    color: "var(--muted-foreground)",
  },
  docsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 14,
  },
  docCard: {
    borderRadius: 16,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  docHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
  },
  docMeta: {
    margin: 0,
    color: "var(--muted-foreground)",
    fontSize: 13,
  },
  docReason: {
    margin: 0,
    color: "var(--foreground)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  docActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  statusPill: {
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 700,
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 36,
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    padding: "0 12px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 13,
  },
  approveButton: {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(34,197,94,0.24)",
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  rejectButton: {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.24)",
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
