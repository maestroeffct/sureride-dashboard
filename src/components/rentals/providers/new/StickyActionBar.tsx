"use client";

import { ProviderDraftStatus } from "@/src/types/rentalProvider";

export default function StickyActionBar({
  status,
  canGoNext,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onCancel,
  onSaveDraft,
  onSubmit,
}: {
  status: ProviderDraftStatus;
  canGoNext: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  return (
    <div style={styles.bar}>
      <button style={styles.cancel} onClick={onCancel}>
        Cancel
      </button>

      <div style={{ display: "flex", gap: 10 }}>
        {!isFirst && (
          <button style={styles.secondary} onClick={onPrev}>
            Back
          </button>
        )}

        <button style={styles.secondary} onClick={onSaveDraft}>
          Save as Draft
        </button>

        {isLast ? (
          <button
            style={styles.primary}
            onClick={onSubmit}
            disabled={!canGoNext}
          >
            Submit for Approval
          </button>
        ) : (
          <button style={styles.primary} onClick={onNext} disabled={!canGoNext}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "14px 18px",
    background: "rgba(2, 6, 23, 0.9)",
    borderTop: "1px solid #1F2937",
    backdropFilter: "blur(10px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 50,
  },

  cancel: {
    background: "transparent",
    border: "1px solid #1F2937",
    color: "#E5E7EB",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },

  secondary: {
    background: "#020617",
    border: "1px solid #1F2937",
    color: "#E5E7EB",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },

  primary: {
    background: "#2563EB",
    border: "none",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },
};
