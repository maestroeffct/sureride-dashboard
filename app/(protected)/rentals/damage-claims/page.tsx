"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertOctagon, CheckCircle2, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiRequest } from "@/src/lib/api";

type DamageClaimStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CANCELLED";

type Claim = {
  id: string;
  bookingId: string;
  description: string;
  estimatedCost: number;
  currency: string;
  photos: string[];
  status: DamageClaimStatus;
  resolutionNote: string | null;
  createdAt: string;
  fine: { id: string; amount: number; status: string } | null;
  booking: {
    id: string;
    pickupAt: string;
    returnAt: string;
    user: { firstName: string; lastName: string; email: string } | null;
    car: { brand: string; model: string; licensePlate: string | null };
  };
  provider: { id: string; name: string; email: string | null };
};

const STATUS_FILTERS: { value: DamageClaimStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminDamageClaimsPage() {
  const [rows, setRows] = useState<Claim[]>([]);
  const [status, setStatus] = useState<DamageClaimStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/admin/damage-claims${status ? `?status=${status}` : ""}`;
      const res = await apiRequest<{ items: Claim[] }>(url);
      setRows(res.items);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    const note = window.prompt(
      `${decision === "APPROVED" ? "Approve" : "Reject"} damage claim.\nResolution note (optional):`,
      "",
    );
    if (note === null) return;
    setDeciding(id);
    try {
      await apiRequest(`/admin/damage-claims/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision, resolutionNote: note || undefined }),
      });
      toast.success(`Claim ${decision.toLowerCase()}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setDeciding(null);
    }
  };

  const totals = useMemo(() => {
    const open = rows.filter((r) => r.status === "OPEN" || r.status === "UNDER_REVIEW").length;
    const approvedValue = rows
      .filter((r) => r.status === "APPROVED" || r.status === "PAID")
      .reduce((s, r) => s + r.estimatedCost, 0);
    return { open, approvedValue };
  }, [rows]);

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}>
            <AlertOctagon size={20} color="var(--brand-primary)" /> Damage Claims
          </h1>
          <p style={s.sub}>
            Review damage claims providers file after a rental. Approve to authorise a fine
            against the customer, or reject if evidence is insufficient.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={s.stat}>
            <span style={s.statLabel}>Open</span>
            <strong>{totals.open}</strong>
          </div>
          <div style={s.stat}>
            <span style={s.statLabel}>Approved value</span>
            <strong>
              ₦{totals.approvedValue.toLocaleString()}
            </strong>
          </div>
        </div>
      </header>

      <div style={s.filters}>
        <select
          style={s.select}
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value || "all"} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={s.empty}>No claims match this filter.</div>
      ) : (
        <div style={s.list}>
          {rows.map((r) => (
            <article key={r.id} style={s.card}>
              <div style={s.cardTop}>
                <div>
                  <strong>
                    {r.booking.car.brand} {r.booking.car.model}
                    {r.booking.car.licensePlate ? ` · ${r.booking.car.licensePlate}` : ""}
                  </strong>
                  <div style={s.meta}>
                    Filed by <strong>{r.provider.name}</strong>{" "}
                    {r.booking.user
                      ? `· against ${r.booking.user.firstName} ${r.booking.user.lastName} (${r.booking.user.email})`
                      : ""}
                    {` · returned ${new Date(r.booking.returnAt).toLocaleDateString()}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: 18 }}>
                    {r.currency} {r.estimatedCost.toLocaleString()}
                  </strong>
                  <div style={statusStyle(r.status)}>{r.status.replace(/_/g, " ")}</div>
                </div>
              </div>

              <p style={s.desc}>{r.description}</p>

              {r.photos.length > 0 ? (
                <div style={s.thumbRow}>
                  {r.photos.map((url) => (
                    <button
                      key={url}
                      type="button"
                      style={s.thumbBtn}
                      onClick={() => setLightbox(url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Damage" style={s.thumbImg} />
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ ...s.meta, fontStyle: "italic" }}>
                  No photos attached — decide with caution.
                </div>
              )}

              {r.resolutionNote && (
                <div style={s.res}>Resolution: {r.resolutionNote}</div>
              )}
              {r.fine && (
                <div style={{ ...s.res, color: "#fde68a" }}>
                  Fine issued: {r.fine.amount.toLocaleString()} · {r.fine.status}
                </div>
              )}

              {(r.status === "OPEN" || r.status === "UNDER_REVIEW") && (
                <div style={s.actions}>
                  <button
                    style={s.approveBtn}
                    disabled={deciding === r.id}
                    onClick={() => decide(r.id, "APPROVED")}
                  >
                    <CheckCircle2 size={14} />
                    {deciding === r.id ? "…" : "Approve"}
                  </button>
                  <button
                    style={s.rejectBtn}
                    disabled={deciding === r.id}
                    onClick={() => decide(r.id, "REJECTED")}
                  >
                    <XCircle size={14} />
                    {deciding === r.id ? "…" : "Reject"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {lightbox && (
        <div style={s.lightbox} onClick={() => setLightbox(null)}>
          <button style={s.lightboxClose} onClick={() => setLightbox(null)}>
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Full-size" style={s.lightboxImg} />
        </div>
      )}
    </div>
  );
}

function statusStyle(st: DamageClaimStatus): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    marginTop: 4,
  };
  const map: Record<DamageClaimStatus, [string, string]> = {
    OPEN: ["rgba(250,204,21,0.14)", "#fde68a"],
    UNDER_REVIEW: ["rgba(59,130,246,0.14)", "#93c5fd"],
    APPROVED: ["rgba(34,197,94,0.14)", "#86efac"],
    PAID: ["rgba(34,197,94,0.18)", "#86efac"],
    REJECTED: ["rgba(239,68,68,0.14)", "#fca5a5"],
    CANCELLED: ["rgba(148,163,184,0.18)", "#cbd5e1"],
  };
  const [bg, color] = map[st];
  return { ...base, background: bg, color };
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1200 },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 750,
    display: "inline-flex",
    gap: 10,
    alignItems: "center",
  },
  sub: {
    margin: "4px 0 0",
    color: "var(--muted-foreground)",
    fontSize: 13,
    maxWidth: 780,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    minWidth: 120,
  },
  statLabel: {
    fontSize: 11,
    color: "var(--muted-foreground)",
    fontWeight: 600,
  },
  filters: { display: "flex", gap: 10 },
  select: {
    height: 42,
    minWidth: 180,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    fontSize: 13,
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "var(--muted-foreground)",
    border: "1px dashed var(--input-border)",
    borderRadius: 12,
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  desc: {
    margin: 0,
    padding: 10,
    background: "var(--surface-2)",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.5,
  },
  res: { fontSize: 12, color: "var(--muted-foreground)" },
  thumbRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  thumbBtn: {
    width: 96,
    height: 96,
    padding: 0,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--input-border)",
    background: "transparent",
    cursor: "zoom-in",
  },
  thumbImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  actions: { display: "flex", gap: 8 },
  approveBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.1)",
    color: "#86efac",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  rejectBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.1)",
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  lightbox: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.9)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "zoom-out",
  },
  lightboxClose: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "none",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  lightboxImg: {
    maxWidth: "94vw",
    maxHeight: "92vh",
    objectFit: "contain" as const,
  },
};
