"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Ban,
  Camera,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import {
  deleteProviderCarImage,
  getProviderCar,
  setProviderCarBanner,
  updateProviderCar,
  uploadProviderCarImages,
  type ProviderCarDetail,
} from "@/src/lib/providerApi";

export default function ProviderCarDetailPage() {
  const { carId } = useParams<{ carId: string }>();
  const router = useRouter();
  const [car, setCar] = useState<ProviderCarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!carId) return;
    try {
      setLoading(true);
      const c = await getProviderCar(carId);
      setCar(c);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load vehicle");
    } finally {
      setLoading(false);
    }
  }, [carId]);

  useEffect(() => { void load(); }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !carId) return;
    try {
      setUploading(true);
      await uploadProviderCarImages(carId, Array.from(files));
      toast.success(`Uploaded ${files.length} photo(s)`);
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    if (!carId) return;
    if (!confirm("Remove this photo?")) return;
    try {
      await deleteProviderCarImage(carId, imageId);
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const setBanner = async (imageId: string) => {
    if (!carId) return;
    try {
      await setProviderCarBanner(carId, imageId);
      toast.success("Banner updated");
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const toggleActive = async () => {
    if (!car || !carId) return;
    const nextIsActive = !car.isActive;
    if (!confirm(nextIsActive ? "Reactivate this vehicle?" : "Deactivate — customers won't see this car until you reactivate.")) return;
    try {
      await updateProviderCar(carId, { isActive: nextIsActive } as any);
      toast.success(nextIsActive ? "Vehicle reactivated" : "Vehicle deactivated");
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  if (loading) return <div style={s.empty}>Loading vehicle…</div>;
  if (!car) return <div style={s.empty}>Vehicle not found.</div>;

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => router.push("/provider/cars")}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={s.title}>{car.licensePlate || "No plate"}</h1>
            <p style={s.sub}>{car.brand} {car.model} {car.color ? `• ${car.color}` : ""}</p>
          </div>
        </div>
        <div style={s.actions}>
          <Link href={`/provider/cars/${car.id}/edit`} style={s.iconBtn} title="Edit"><Pencil size={16} /></Link>
          <button style={s.iconBtn} onClick={toggleActive} title={car.isActive ? "Deactivate" : "Activate"}>
            <Ban size={16} color={car.isActive ? "#ef4444" : "var(--muted-foreground)"} />
          </button>
          <Link href={`/provider/cars/${car.id}/edit`} style={{ ...s.iconBtn, borderColor: "rgba(239,68,68,0.35)", color: "#fca5a5" }} title="Delete via edit page">
            <Trash2 size={16} />
          </Link>
        </div>
      </header>

      <section style={s.card}>
        <h2 style={s.h2}><Camera size={16} /> Vehicle Photos ({car.images.length})</h2>
        {car.images.length === 0 ? (
          <div style={s.emptyPhoto}>No photos yet. Upload at least one — customers won't book a car without photos.</div>
        ) : (
          <>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "0 0 10px" }}>
            Click any photo to make it the banner customers see in search results.
          </p>
          <div style={s.photoGrid}>
            {car.images.map((img, i) => (
              <div
                key={img.id}
                style={{
                  ...s.photo,
                  ...(img.isPrimary ? { outline: "3px solid var(--brand-primary)", outlineOffset: 2 } : {}),
                  cursor: img.isPrimary ? "default" : "pointer",
                }}
                onClick={() => !img.isPrimary && void setBanner(img.id)}
                title={img.isPrimary ? "This is the banner" : "Click to make this the banner"}
              >
                <Image src={img.url} alt={`Photo ${i + 1}`} fill sizes="(max-width: 900px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                {img.isPrimary ? (
                  <span style={s.banner}>★ Banner</span>
                ) : (
                  <span style={s.bannerHover}>Set as banner</span>
                )}
                <button
                  style={s.photoRemove}
                  onClick={(e) => { e.stopPropagation(); void removeImage(img.id); }}
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          </>
        )}
        <div style={s.uploadRow}>
          <label style={s.uploadBtn}>
            <Upload size={15} /> {uploading ? "Uploading…" : "Add More"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: "none" }}
              onChange={(e) => upload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>
        <p style={s.hint}>JPG, PNG, WebP • Max 5MB per photo • Multiple selection supported</p>
      </section>

      <section style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.h2}>Ownership</h2>
          <Link href={`/provider/cars/${car.id}/edit`} style={s.editSmall}>Edit</Link>
        </div>
        <div style={s.detailGrid}>
          <Detail label="Owner"><span style={s.pill}>Own fleet</span></Detail>
          <Detail label="Assigned">—</Detail>
          <Detail label="Commission">—</Detail>
        </div>
      </section>

      <section style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.h2}>Vehicle Details</h2>
          <Link href={`/provider/cars/${car.id}/edit`} style={s.editSmall}>Edit</Link>
        </div>
        <div style={s.detailGrid}>
          <Detail label="Make">{car.brand}</Detail>
          <Detail label="Model">{car.model}</Detail>
          <Detail label="Year">{car.year ?? "—"}</Detail>
          <Detail label="Color" cap>{car.color ?? "—"}</Detail>
          <Detail label="Category">{car.category}</Detail>
          <Detail label="Seats">{car.seats ?? "—"}</Detail>
          <Detail label="Transmission">{car.transmission}</Detail>
          <Detail label="Bags">{car.bags ?? "—"}</Detail>
          <Detail label="A/C">{car.hasAC ? "Yes" : "No"}</Detail>
          <Detail label="Registration">{car.licensePlate ?? "—"}</Detail>
          <Detail label="VIN" mono>{car.vin ?? "—"}</Detail>
          <Detail label="Mileage policy">{car.mileagePolicy}</Detail>
        </div>
      </section>

      <section style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.h2}>Pricing</h2>
          <Link href={`/provider/cars/${car.id}/edit`} style={s.editSmall}>Edit</Link>
        </div>
        <div style={s.detailGrid}>
          <Detail label="Daily rate">{car.currency ?? "NGN"} {car.dailyRate.toLocaleString()}</Detail>
          <Detail label="Hourly rate">{car.hourlyRate != null ? `${car.currency ?? "NGN"} ${car.hourlyRate.toLocaleString()}` : "—"}</Detail>
          <Detail label="Currency">{car.currency ?? "NGN"}</Detail>
        </div>
      </section>

      <section style={s.card}>
        <div style={s.cardHead}>
          <h2 style={s.h2}>Location</h2>
        </div>
        <div style={s.detailGrid}>
          <Detail label="Pickup location">{car.location?.name ?? "—"}</Detail>
          <Detail label="Address">{car.location?.address ?? "—"}</Detail>
          {car.location?.country && <Detail label="Country">{car.location.country.name}</Detail>}
        </div>
      </section>

      {car.moderationNote && (
        <section style={{ ...s.card, borderColor: "rgba(250,204,21,0.35)" }}>
          <h2 style={s.h2}>Admin Note</h2>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: "8px 0 0", color: "var(--foreground)" }}>{car.moderationNote}</p>
        </section>
      )}
    </div>
  );
}

function Detail({ label, children, mono, cap }: { label: string; children: React.ReactNode; mono?: boolean; cap?: boolean }) {
  return (
    <div>
      <div style={s.detailLabel}>{label}</div>
      <div style={{ ...s.detailValue, ...(mono ? { fontFamily: "monospace" } : {}), ...(cap ? { textTransform: "capitalize" } : {}) }}>{children}</div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1200 },
  empty: { padding: 60, textAlign: "center", color: "var(--muted-foreground)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  headerLeft: { display: "flex", gap: 14, alignItems: "flex-start" },
  backBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--input-border)", color: "var(--foreground)", cursor: "pointer" },
  title: { margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -0.5 },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 14 },
  actions: { display: "flex", gap: 8 },
  iconBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 10, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", cursor: "pointer", textDecoration: "none" },

  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 22 },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  h2: { margin: 0, fontSize: 16, fontWeight: 700, display: "inline-flex", gap: 8, alignItems: "center" },
  editSmall: { padding: "6px 14px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 12, fontWeight: 600, textDecoration: "none" },

  photoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12, marginTop: 14 },
  photo: { position: "relative", aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", background: "var(--surface-2)", border: "1px solid var(--input-border)" },
  banner: { position: "absolute", top: 10, left: 10, padding: "4px 10px", borderRadius: 999, background: "var(--brand-primary)", color: "#022c22", fontSize: 11, fontWeight: 700, zIndex: 2 },
  bannerHover: { position: "absolute", bottom: 8, left: 8, padding: "4px 10px", borderRadius: 999, background: "rgba(2,6,23,0.65)", color: "#fff", fontSize: 10, fontWeight: 700, zIndex: 2, letterSpacing: 0.3 },
  photoRemove: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 6, background: "rgba(0,0,0,0.6)", border: "none", color: "#fca5a5", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", zIndex: 2 },
  emptyPhoto: { padding: 32, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 10 },
  uploadRow: { display: "flex", justifyContent: "center", marginTop: 16 },
  uploadBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  hint: { textAlign: "center", fontSize: 12, color: "var(--muted-foreground)", marginTop: 10 },

  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 },
  detailLabel: { fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 },
  detailValue: { fontSize: 14, color: "var(--foreground)", fontWeight: 500 },
  pill: { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--input-border)" },
};
