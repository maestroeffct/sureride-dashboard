"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { ClipboardCheck, Search, X } from "lucide-react";
import {
  listProviderBookings,
  type ProviderBookingRow,
} from "@/src/lib/providerApi";
import {
  listHandovers,
  saveHandover,
  type HandoverRow,
  uploadProviderPhotos,
  type HandoverType,
} from "@/src/lib/providerOpsApi";

export default function ProviderRentsPage() {
  const [rows, setRows] = useState<ProviderBookingRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [handoverBooking, setHandoverBooking] = useState<ProviderBookingRow | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const response = await listProviderBookings({
            q: query.trim() || undefined,
            status: status || undefined,
            page: 1,
            limit: 100,
          });
          setRows(response.items);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to load provider rents");
        } finally {
          setLoading(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query, status]);

  const totalRevenue = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + (row.paymentStatus === "SUCCEEDED" ? row.totalPrice : 0),
        0,
      ),
    [rows],
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rent Monitoring</h1>
          <p style={styles.subtitle}>
            {rows.length.toLocaleString()} bookings • NGN {totalRevenue.toLocaleString()} settled
          </p>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} />
          <input
            style={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by booking, renter, or car"
          />
        </div>
        <select style={styles.select} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Booking</th>
              <th style={styles.th}>Renter</th>
              <th style={styles.th}>Car</th>
              <th style={styles.th}>Schedule</th>
              <th style={styles.th}>Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Handover</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={styles.empty}>Loading rents...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} style={styles.empty}>No bookings found.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{row.id.slice(0, 8)}</strong>
                      <span style={styles.muted}>{new Date(row.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{row.customerName}</strong>
                      <span style={styles.muted}>{row.customerEmail}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{row.carName}</strong>
                      <span style={styles.muted}>{row.carMeta}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>{new Date(row.pickupAt).toLocaleString()}</strong>
                      <span style={styles.muted}>Return {new Date(row.returnAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.twoLine}>
                      <strong>NGN {row.totalPrice.toLocaleString()}</strong>
                      <span style={styles.muted}>{row.paymentStatus}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={statusPill(row.status)}>{row.status}</span>
                  </td>
                  <td style={styles.td}>
                    {row.status === "CONFIRMED" || row.status === "COMPLETED" ? (
                      <button style={styles.handoverBtn} onClick={() => setHandoverBooking(row)}>
                        <ClipboardCheck size={13} /> Inspect
                      </button>
                    ) : (
                      <span style={styles.muted}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {handoverBooking && (
        <HandoverModal
          booking={handoverBooking}
          onClose={() => setHandoverBooking(null)}
        />
      )}
    </div>
  );
}

function HandoverModal({ booking, onClose }: { booking: ProviderBookingRow; onClose: () => void }) {
  const [existing, setExisting] = useState<HandoverRow[]>([]);
  const [tab, setTab] = useState<HandoverType>("PICKUP");
  const [loading, setLoading] = useState(true);

  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState(100);
  const [extNotes, setExtNotes] = useState("");
  const [intNotes, setIntNotes] = useState("");
  const [damage, setDamage] = useState(false);
  const [signed, setSigned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listHandovers(booking.id);
      setExisting(res.items);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load handovers");
    } finally {
      setLoading(false);
    }
  }, [booking.id]);

  useEffect(() => { void load(); }, [load]);

  // Preload the form from an existing handover of the current tab type
  useEffect(() => {
    const found = existing.find((h) => h.type === tab);
    if (found) {
      setOdometer(String(found.odometerKm));
      setFuel(found.fuelLevel);
      setExtNotes(found.exteriorNotes ?? "");
      setIntNotes(found.interiorNotes ?? "");
      setDamage(found.damagesFound);
      setSigned(found.signedByCustomer);
      setPhotos(found.photos ?? []);
    } else {
      setOdometer("");
      setFuel(100);
      setExtNotes("");
      setIntNotes("");
      setDamage(false);
      setSigned(false);
      setPhotos([]);
    }
  }, [tab, existing]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    if (photos.length + arr.length > 12) {
      toast.error("Max 12 photos per inspection");
      return;
    }
    try {
      setUploading(true);
      const uploaded = await uploadProviderPhotos(arr, "handovers");
      setPhotos((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) =>
    setPhotos((prev) => prev.filter((p) => p !== url));

  const submit = async () => {
    const km = Number(odometer);
    if (!km || km < 0) return toast.error("Odometer reading required");
    try {
      setBusy(true);
      await saveHandover(booking.id, {
        type: tab,
        odometerKm: km,
        fuelLevel: fuel,
        exteriorNotes: extNotes || undefined,
        interiorNotes: intNotes || undefined,
        damagesFound: damage,
        signedByCustomer: signed,
        photos,
      });
      toast.success(`${tab === "PICKUP" ? "Pickup" : "Return"} inspection saved`);
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={m.backdrop} onClick={() => !busy && onClose()}>
      <div style={m.card} onClick={(e) => e.stopPropagation()}>
        <div style={m.header}>
          <div>
            <strong>Vehicle Handover</strong>
            <div style={m.sub}>{booking.carName} · {booking.customerName}</div>
          </div>
          <button style={m.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={m.tabs}>
          {(["PICKUP", "RETURN"] as const).map((t) => {
            const done = existing.find((h) => h.type === t);
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ ...m.tab, ...(tab === t ? m.tabActive : {}) }}
              >
                {t === "PICKUP" ? "Pickup" : "Return"} {done ? "✓" : ""}
              </button>
            );
          })}
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>Loading…</div>
        ) : (
          <div style={m.body}>
            <div style={m.grid2}>
              <div>
                <label style={m.label}>Odometer (km)</label>
                <input style={m.input} type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} />
              </div>
              <div>
                <label style={m.label}>Fuel level ({fuel}%)</label>
                <input style={{ width: "100%" }} type="range" min={0} max={100} step={5} value={fuel} onChange={(e) => setFuel(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label style={m.label}>Exterior notes</label>
              <textarea style={{ ...m.input, height: 60 }} value={extNotes} onChange={(e) => setExtNotes(e.target.value)} placeholder="Dents, scratches, mirrors, wipers" />
            </div>
            <div>
              <label style={m.label}>Interior notes</label>
              <textarea style={{ ...m.input, height: 60 }} value={intNotes} onChange={(e) => setIntNotes(e.target.value)} placeholder="Seats, dashboard, radio, cleanliness" />
            </div>
            <div>
              <label style={m.label}>Photos ({photos.length}/12)</label>
              <div style={m.photoGrid}>
                {photos.map((url) => (
                  <div key={url} style={m.photoTile}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Handover" style={m.photoImg} />
                    <button
                      type="button"
                      style={m.photoRemove}
                      onClick={() => removePhoto(url)}
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {photos.length < 12 && (
                  <label style={m.photoAdd}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        handleUpload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: 11 }}>
                      {uploading ? "Uploading…" : "Add photo"}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <label style={m.checkRow}>
              <input type="checkbox" checked={damage} onChange={(e) => setDamage(e.target.checked)} />
              Damage found — I will file a claim
            </label>
            <label style={m.checkRow}>
              <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
              Customer confirmed this inspection
            </label>
          </div>
        )}
        <div style={m.footer}>
          <button style={m.secondary} onClick={onClose} disabled={busy}>Close</button>
          <button style={m.primary} onClick={submit} disabled={busy || loading}>
            {busy ? "Saving…" : existing.find((h) => h.type === tab) ? "Update inspection" : "Save inspection"}
          </button>
        </div>
      </div>
    </div>
  );
}

function statusPill(status: string): React.CSSProperties {
  if (status === "COMPLETED") return { ...styles.pill, background: "rgba(34,197,94,0.14)", color: "#86EFAC" };
  if (status === "CONFIRMED") return { ...styles.pill, background: "color-mix(in srgb, var(--brand-primary) 14%, transparent)", color: "var(--brand-primary)" };
  if (status === "CANCELLED") return { ...styles.pill, background: "rgba(239,68,68,0.14)", color: "#FCA5A5" };
  return { ...styles.pill, background: "rgba(250,204,21,0.14)", color: "#FDE68A" };
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1280 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: "6px 0 0", color: "var(--fg-60)", fontSize: 13 },
  filters: { display: "flex", gap: 12, flexWrap: "wrap" },
  searchBox: { flex: "1 1 320px", minWidth: 260, height: 46, borderRadius: 12, border: "1px solid var(--input-border)", background: "var(--surface-1)", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", color: "var(--fg-60)" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", color: "var(--foreground)", fontSize: 14 },
  select: { height: 46, minWidth: 220, borderRadius: 12, border: "1px solid var(--input-border)", background: "var(--surface-1)", color: "var(--foreground)", padding: "0 14px", fontSize: 14 },
  card: { borderRadius: 18, border: "1px solid var(--input-border)", background: "var(--surface-1)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "14px 16px", fontSize: 12, color: "var(--fg-60)", borderBottom: "1px solid var(--input-border)" },
  td: { padding: "16px", borderBottom: "1px solid var(--input-border)", verticalAlign: "top" },
  twoLine: { display: "flex", flexDirection: "column", gap: 6 },
  muted: { fontSize: 13, color: "var(--fg-60)" },
  pill: { display: "inline-flex", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  empty: { padding: 28, textAlign: "center", color: "var(--fg-60)" },
  handoverBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer" },
};

const m: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 560, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 20px", borderBottom: "1px solid var(--input-border)" },
  sub: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  tabs: { display: "flex", padding: "0 20px", gap: 4, borderBottom: "1px solid var(--input-border)" },
  tab: { padding: "10px 14px", background: "transparent", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--muted-foreground)" },
  tabActive: { color: "var(--brand-primary)", borderBottomColor: "var(--brand-primary)" },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical" as any },
  checkRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" },
  photoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8, marginTop: 6 },
  photoTile: { position: "relative", aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", border: "1px solid var(--input-border)" },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  photoRemove: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 999, border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" },
  photoAdd: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, aspectRatio: "1 / 1", borderRadius: 8, border: "1px dashed var(--input-border)", background: "var(--surface-2)", color: "var(--muted-foreground)", cursor: "pointer" },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
