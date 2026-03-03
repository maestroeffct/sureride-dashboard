"use client";

import { StepKey } from "@/src/types/rentalProvider";

const steps: { key: StepKey; label: string }[] = [
  { key: "business", label: "Business Info" },
  { key: "contact", label: "Contact Person" },
  { key: "location", label: "Location" },
  { key: "documents", label: "Documents" },
  { key: "financials", label: "Financials" },
  { key: "review", label: "Review & Submit" },
];

export default function ProviderStepper({
  active,
  completed,
  expanded,
  onHoverChange,
  onSelect,
}: {
  active: StepKey;
  completed: Record<StepKey, boolean>;
  expanded: boolean;
  onHoverChange: (v: boolean) => void;
  onSelect: (s: StepKey) => void;
}) {
  return (
    <div
      style={{
        ...styles.container,
        width: expanded ? 260 : 72,
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {steps.map((s, idx) => {
        const isActive = active === s.key;
        const isDone = completed[s.key];

        return (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            style={{
              ...styles.item,
              background: isActive ? "var(--surface-1)" : "transparent",
              borderColor: isActive ? "#1D4ED8" : "transparent",
            }}
          >
            <span
              style={{
                ...styles.circle,
                background: isDone
                  ? "#22C55E22"
                  : isActive
                  ? "#2563EB22"
                  : "var(--surface-2)",
                color: isDone ? "#22C55E" : isActive ? "#60A5FA" : "var(--muted-foreground)",
              }}
            >
              {isDone ? "✓" : idx + 1}
            </span>

            <span
              style={{
                ...styles.label,
                opacity: expanded ? 1 : 0,
                transform: expanded ? "translateX(0)" : "translateX(-6px)",
                pointerEvents: expanded ? "auto" : "none",
              }}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- */

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 10,
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    overflow: "hidden",
    transition: "width 0.25s ease",
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px",
    borderRadius: 12,
    border: "1px solid transparent",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    color: "var(--foreground)",
    transition: "background 0.2s ease, border 0.2s ease",
  },

  circle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    border: "1px solid var(--input-border)",
    flexShrink: 0,
  },

  label: {
    fontSize: 14,
    whiteSpace: "nowrap",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  },
};
