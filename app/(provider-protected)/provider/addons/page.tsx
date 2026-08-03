"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { Package, Plus, Trash2, X } from "lucide-react";
import {
  createAddon,
  deleteAddon,
  listAddons,
  updateAddon,
  type AddOnRow,
  type AddOnUnit,
} from "@/src/lib/providerOpsApi";

const UNITS: { value: AddOnUnit; label: string }[] = [
  { value: "PER_RENTAL", label: "Per rental" },
  { value: "PER_DAY", label: "Per day" },
  { value: "PER_HOUR", label: "Per hour" },
];

export default function AddonsPage() {
  const [rows, setRows] = useState<AddOnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<AddOnRow | "new" | null>(null);

  const load = useCallback(async () => {
    try { setLoading(true); setRows((await listAddons()).items); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const toggle = async (a: AddOnRow) => {
    try { await updateAddon(a.id, { isActive: !a.isActive }); void load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const remove = async (a: AddOnRow) => {
    if (!confirm(`Delete "${a.name}"?`)) return;
    try { await deleteAddon(a.id); toast.success("Deleted"); void load(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div style={s.page}>
      <header style={s.headerRow}>
        <div>
          <h1 style={s.title}><Package size={20} color="var(--brand-primary)" /> Add-ons</h1>
          <p style={s.sub}>Extras you offer at checkout: child seat, GPS, driver service, delivery, additional insurance. Toggle Active to make them selectable.</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setOpen("new")}><Plus size={15} /> Add extra</button>
      </header>

      {loading ? <div style={s.empty}>Loading…</div>
        : rows.length === 0 ? <div style={s.empty}>No add-ons yet. Create your first extra to offer at checkout.</div>
        : (
          <div style={s.grid}>
            {rows.map((r) => (
              <article key={r.id} style={{ ...s.card, opacity: r.isActive ? 1 : 0.55 }}>
                <div style={s.cardTop}>
                  <strong style={{ fontSize: 15 }}>{r.name}</strong>
                  <span style={{ ...s.badge, background: r.isActive ? "rgba(34,197,94,0.14)" : "rgba(148,163,184,0.14)", color: r.isActive ? "#86efac" : "#cbd5e1" }}>
                    {r.isActive ? "Active" : "Off"}
                  </span>
                </div>
                {r.description && <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>{r.description}</p>}
                <div style={s.price}>{r.currency} {r.pricePerUnit.toLocaleString()} <small>· {UNITS.find((u) => u.value === r.unit)?.label}</small></div>
                <div style={s.actions}>
                  <button style={s.linkBtn} onClick={() => void toggle(r)}>{r.isActive ? "Deactivate" : "Activate"}</button>
                  <button style={s.linkBtn} onClick={() => setOpen(r)}>Edit</button>
                  <button style={s.iconBtn} onClick={() => void remove(r)}><Trash2 size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        )}

      {open && <EditModal addon={open === "new" ? null : open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); void load(); }} />}
    </div>
  );
}

function EditModal({ addon, onClose, onDone }: { addon: AddOnRow | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(addon?.name ?? "");
  const [description, setDescription] = useState(addon?.description ?? "");
  const [price, setPrice] = useState(String(addon?.pricePerUnit ?? ""));
  const [unit, setUnit] = useState<AddOnUnit>(addon?.unit ?? "PER_RENTAL");
  const [isActive, setIsActive] = useState(addon?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) return toast.error("Name required");
    const p = Number(price);
    if (!p || p <= 0) return toast.error("Price must be > 0");
    try {
      setBusy(true);
      if (addon) await updateAddon(addon.id, { name: name.trim(), description: description || undefined, pricePerUnit: p, unit, isActive });
      else await createAddon({ name: name.trim(), description: description || undefined, pricePerUnit: p, unit, isActive });
      toast.success("Saved");
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div style={mo.backdrop} onClick={() => !busy && onClose()}>
      <div style={mo.card} onClick={(e) => e.stopPropagation()}>
        <div style={mo.header}><strong>{addon ? "Edit add-on" : "New add-on"}</strong><button style={mo.close} onClick={onClose}><X size={16} /></button></div>
        <div style={mo.body}>
          <label style={mo.label}>Name</label>
          <input style={mo.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Child seat" />
          <label style={mo.label}>Description</label>
          <input style={mo.input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="For children under 12kg" />
          <div style={mo.grid2}>
            <div><label style={mo.label}>Price (NGN)</label><input style={mo.input} type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div><label style={mo.label}>Unit</label><select style={mo.input} value={unit} onChange={(e) => setUnit(e.target.value as AddOnUnit)}>{UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active — customers can select at checkout
          </label>
        </div>
        <div style={mo.footer}>
          <button style={mo.secondary} onClick={onClose} disabled={busy}>Cancel</button>
          <button style={mo.primary} onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 1100 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: { padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700 },
  price: { fontSize: 20, fontWeight: 750, marginTop: 6 },
  actions: { display: "flex", gap: 10, alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--input-border)", marginTop: "auto" },
  linkBtn: { background: "transparent", border: "none", color: "var(--brand-primary)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0 },
  iconBtn: { background: "transparent", border: "none", cursor: "pointer", color: "#fca5a5", marginLeft: "auto" },
};

const mo: Record<string, CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(2,6,23,0.65)", zIndex: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 24px", overflowY: "auto" },
  card: { width: "100%", maxWidth: 500, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--input-border)" },
  close: { background: "transparent", border: "none", cursor: "pointer", color: "var(--muted-foreground)" },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted-foreground)", marginBottom: 5 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 14, outline: "none", fontFamily: "inherit" },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid var(--input-border)" },
  secondary: { padding: "10px 18px", borderRadius: 8, border: "1px solid var(--input-border)", background: "transparent", color: "var(--foreground)", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  primary: { padding: "10px 22px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 13, fontWeight: 700, cursor: "pointer" },
};
