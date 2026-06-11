"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";

type Section = {
  id: string;
  name: string;
  description: string;
  visible: boolean;
};

const INITIAL_SECTIONS: Section[] = [
  { id: "hero", name: "Hero Banner", description: "Main banner with CTA buttons and tagline.", visible: true },
  { id: "featured", name: "Featured Cars", description: "Showcase of popular or recommended vehicles.", visible: true },
  { id: "how_it_works", name: "How It Works", description: "Step-by-step guide explaining the booking flow.", visible: true },
  { id: "stats", name: "Stats Counter", description: "Animated counters showing platform milestones.", visible: false },
  { id: "testimonials", name: "Testimonials", description: "Customer reviews and star ratings.", visible: true },
  { id: "app_download", name: "App Download CTA", description: "Prompt to download the mobile app from stores.", visible: false },
  { id: "newsletter", name: "Newsletter Signup", description: "Email capture form for marketing newsletters.", visible: false },
  { id: "partners", name: "Partner Logos", description: "Logos of trusted partners and integrations.", visible: true },
];

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 },
  header: { fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: 0 },
  headerDesc: { fontSize: 13, color: "var(--muted-foreground)", margin: "4px 0 0" },
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 20px",
    borderBottom: "1px solid var(--input-border)",
  },
  rowLast: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 20px",
  },
  handle: {
    fontSize: 18,
    color: "var(--muted-foreground)",
    cursor: "grab",
    userSelect: "none",
    flexShrink: 0,
  } as CSSProperties,
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 },
  desc: { fontSize: 12, color: "var(--muted-foreground)", margin: "2px 0 0" },
  statusBase: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    flexShrink: 0,
  },
  statusVisible: { background: "rgba(34,197,94,0.12)", color: "#22c55e" },
  statusHidden: { background: "var(--glass-06)", color: "var(--muted-foreground)" },
  saveBtn: {
    background: "var(--brand-primary)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 22px",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    alignSelf: "flex-start",
  },
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: on ? "var(--brand-primary)" : "var(--glass-08)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

export default function LandingPageSettingsPage() {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);

  const toggleVisible = (id: string) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, visible: !sec.visible } : sec))
    );
  };

  return (
    <div style={s.page}>
      <div>
        <p style={s.header}>Landing Page Settings</p>
        <p style={s.headerDesc}>
          Control which sections appear on the landing page and their display order.
        </p>
      </div>

      <div style={s.card}>
        {sections.map((sec, idx) => {
          const isLast = idx === sections.length - 1;
          return (
            <div key={sec.id} style={isLast ? s.rowLast : s.row}>
              <span style={s.handle} title="Drag to reorder">⠿</span>
              <div style={s.info}>
                <p style={s.name}>{sec.name}</p>
                <p style={s.desc}>{sec.description}</p>
              </div>
              <span style={{ ...s.statusBase, ...(sec.visible ? s.statusVisible : s.statusHidden) }}>{sec.visible ? "Visible" : "Hidden"}</span>
              <Toggle on={sec.visible} onToggle={() => toggleVisible(sec.id)} />
            </div>
          );
        })}
      </div>

      <button style={s.saveBtn} onClick={() => toast.success("Section order and visibility saved")}>
        Save Section Order
      </button>
    </div>
  );
}
