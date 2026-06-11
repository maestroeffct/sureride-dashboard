"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import toast from "react-hot-toast";

type PageMeta = {
  title: string;
  description: string;
  keyword: string;
  ogImage: string;
};

type PageId = "home" | "booking" | "providers" | "login" | "about" | "contact";

const PAGES: Array<{ id: PageId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "booking", label: "Booking" },
  { id: "providers", label: "Providers" },
  { id: "login", label: "Login" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

const DEFAULT_META: PageMeta = { title: "", description: "", keyword: "", ogImage: "" };

const INITIAL_METAS: Record<PageId, PageMeta> = {
  home: { title: "SureRide – Reliable Car Rentals", description: "Book affordable, reliable car rentals across Nigeria. Fast booking, no hidden charges.", keyword: "car rental Nigeria", ogImage: "" },
  booking: { title: "Book a Car – SureRide", description: "Browse available vehicles and complete your booking in minutes.", keyword: "book car online", ogImage: "" },
  providers: { title: "Car Providers – SureRide", description: "Explore our verified fleet of car rental providers.", keyword: "verified car providers", ogImage: "" },
  login: { title: "Login – SureRide", description: "Sign in to your SureRide account.", keyword: "sureride login", ogImage: "" },
  about: { title: "About Us – SureRide", description: "Learn about SureRide's mission and team.", keyword: "about sureride", ogImage: "" },
  contact: { title: "Contact Us – SureRide", description: "Get in touch with the SureRide support team.", keyword: "sureride contact", ogImage: "" },
};

const MAX_DESC = 160;

const s: Record<string, CSSProperties> = {
  page: { maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 },
  header: { fontSize: 15, fontWeight: 700, color: "var(--foreground)", margin: 0 },
  headerDesc: { fontSize: 13, color: "var(--muted-foreground)", margin: "4px 0 0" },
  tabs: { display: "flex", gap: 4, borderBottom: "1px solid var(--input-border)", paddingBottom: 0 },
  tabBase: {
    padding: "8px 18px",
    border: "none",
    borderBottom: "2px solid transparent",
    background: "none",
    color: "var(--muted-foreground)",
    fontWeight: 400,
    fontSize: 13,
    cursor: "pointer",
    marginBottom: -1,
  },
  tabActive: {
    borderBottom: "2px solid var(--brand-primary)",
    color: "var(--brand-primary)",
    fontWeight: 700,
  },
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" },
  input: {
    height: 44,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-2))",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  } as CSSProperties,
  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-2))",
    color: "var(--foreground)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 80,
    fontFamily: "inherit",
  } as CSSProperties,
  counterBase: { fontSize: 11, color: "var(--muted-foreground)", textAlign: "right" },
  counterOver: { color: "rgba(239,68,68,0.9)" },
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

export default function PageMetaDataPage() {
  const [activeTab, setActiveTab] = useState<PageId>("home");
  const [metas, setMetas] = useState<Record<PageId, PageMeta>>(INITIAL_METAS);

  const meta = metas[activeTab] ?? DEFAULT_META;

  const update = (field: keyof PageMeta, value: string) => {
    setMetas((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [field]: value } }));
  };

  return (
    <div style={s.page}>
      <div>
        <p style={s.header}>Page Meta Data</p>
        <p style={s.headerDesc}>Configure SEO metadata for each public page.</p>
      </div>

      <div style={s.tabs}>
        {PAGES.map((p) => (
          <button key={p.id} style={{ ...s.tabBase, ...(activeTab === p.id ? s.tabActive : {}) }} onClick={() => setActiveTab(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.field}>
          <span style={s.label}>Page Title</span>
          <input style={s.input} value={meta.title} onChange={(e) => update("title", e.target.value)} />
        </div>

        <div style={s.field}>
          <span style={s.label}>Meta Description</span>
          <textarea
            style={s.textarea}
            value={meta.description}
            maxLength={MAX_DESC}
            onChange={(e) => update("description", e.target.value)}
          />
          <span style={{ ...s.counterBase, ...(meta.description.length >= MAX_DESC ? s.counterOver : {}) }}>
            {meta.description.length}/{MAX_DESC} characters
          </span>
        </div>

        <div style={s.field}>
          <span style={s.label}>Focus Keyword</span>
          <input style={s.input} value={meta.keyword} onChange={(e) => update("keyword", e.target.value)} />
        </div>

        <div style={s.field}>
          <span style={s.label}>OG Image URL</span>
          <input style={s.input} value={meta.ogImage} placeholder="https://..." onChange={(e) => update("ogImage", e.target.value)} />
        </div>

        <button style={s.saveBtn} onClick={() => toast.success(`Meta data for "${PAGES.find((p) => p.id === activeTab)?.label}" saved`)}>
          Save Meta
        </button>
      </div>
    </div>
  );
}
