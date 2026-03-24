import type { CSSProperties } from "react";

type FeaturePlaceholderPageProps = {
  section: string;
  title: string;
  description: string;
};

export default function FeaturePlaceholderPage({
  section,
  title,
  description,
}: FeaturePlaceholderPageProps) {
  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <span style={styles.sectionBadge}>{section}</span>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{description}</p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Module Scaffold Ready</h3>
        <p style={styles.cardText}>
          This page is connected in navigation and ready for backend integration,
          table/form wiring, and role-based actions.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  headerRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionBadge: {
    width: "fit-content",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--muted-foreground)",
    border: "1px solid var(--input-border)",
    borderRadius: 999,
    padding: "6px 10px",
    background: "var(--surface-2)",
  },
  title: {
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 700,
  },
  subtitle: {
    color: "var(--muted-foreground)",
    maxWidth: 700,
  },
  card: {
    borderRadius: 14,
    border: "1px solid var(--input-border)",
    background: "linear-gradient(180deg, var(--surface-2), var(--surface-2))",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  cardText: {
    color: "var(--muted-foreground)",
    lineHeight: 1.6,
  },
};
