"use client";

import React from "react";
import { Check } from "lucide-react";
import { StepKey } from "@/src/types/rentalProvider";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "business", label: "Business Info" },
  { key: "contact", label: "Contact" },
  { key: "location", label: "Location" },
  { key: "documents", label: "Documents" },
  { key: "financials", label: "Financials" },
  { key: "review", label: "Review" },
];

export default function ProviderStepper({
  active,
  completed,
  onSelect,
}: {
  active: StepKey;
  completed: Record<StepKey, boolean>;
  expanded?: boolean;
  onHoverChange?: (v: boolean) => void;
  onSelect: (s: StepKey) => void;
}) {
  return (
    <div style={s.wrapper}>
      {STEPS.map((step, idx) => {
        const isActive = active === step.key;
        const isDone = completed[step.key];
        const isLast = idx === STEPS.length - 1;
        const prevDone = idx === 0 || completed[STEPS[idx - 1].key];

        return (
          <React.Fragment key={step.key}>
            <button style={s.step} onClick={() => onSelect(step.key)}>
              <div
                style={{
                  ...s.circle,
                  background: isDone
                    ? "var(--brand-secondary)"
                    : isActive
                      ? "var(--brand-primary)"
                      : "transparent",
                  borderColor: isDone
                    ? "var(--brand-secondary)"
                    : isActive
                      ? "var(--brand-primary)"
                      : "var(--input-border)",
                  color: isDone || isActive ? "#fff" : "var(--muted-foreground)",
                }}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : <span style={s.num}>{idx + 1}</span>}
              </div>
              <span
                style={{
                  ...s.label,
                  color: isActive
                    ? "var(--brand-primary)"
                    : isDone
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  fontWeight: isActive ? 650 : 400,
                }}
              >
                {step.label}
              </span>
            </button>

            {!isLast && (
              <div
                style={{
                  ...s.connector,
                  background: isDone ? "var(--brand-primary)" : "var(--input-border)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    padding: "18px 24px",
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 14,
    overflowX: "auto",
  },

  step: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 10px",
    flexShrink: 0,
    borderRadius: 8,
  },

  circle: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.2s, border-color 0.2s",
  },

  num: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
  },

  label: {
    fontSize: 13,
    whiteSpace: "nowrap",
    transition: "color 0.2s",
  },

  connector: {
    flex: 1,
    height: 2,
    minWidth: 20,
    borderRadius: 1,
    transition: "background 0.3s",
  },
};
