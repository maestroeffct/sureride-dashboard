"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

export type ReasonModalConfig = {
  title: string;
  description: string;
  placeholder: string;
  required: boolean;
  confirmLabel?: string;
  confirmDanger?: boolean;
  defaultValue?: string;
};

type Props = ReasonModalConfig & {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export default function ReasonModal({
  title,
  description,
  placeholder,
  required,
  confirmLabel = "Confirm",
  confirmDanger = false,
  defaultValue = "",
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const canConfirm = !required || value.trim().length >= 2;

  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>{title}</h2>
          <button style={s.closeBtn} onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <p style={s.description}>{description}</p>

        <textarea
          ref={textareaRef}
          style={s.textarea}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
        />

        {required && value.trim().length > 0 && value.trim().length < 2 && (
          <p style={s.hint}>Please enter at least 2 characters.</p>
        )}

        <div style={s.actions}>
          <button style={s.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            style={{
              ...s.confirmBtn,
              ...(confirmDanger ? s.confirmDanger : s.confirmPrimary),
              opacity: canConfirm ? 1 : 0.45,
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
            onClick={() => canConfirm && onConfirm(value.trim())}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  modal: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 16,
    padding: "28px 28px 24px",
    width: 460,
    maxWidth: "calc(100vw - 40px)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
    marginTop: 1,
  },
  description: {
    margin: 0,
    fontSize: 13,
    color: "var(--muted-foreground)",
    lineHeight: 1.55,
  },
  textarea: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--input-fg)",
    fontSize: 14,
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.55,
    boxSizing: "border-box",
  },
  hint: {
    margin: 0,
    fontSize: 12,
    color: "#f87171",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid var(--input-border)",
    color: "var(--muted-foreground)",
    padding: "9px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },
  confirmBtn: {
    padding: "9px 20px",
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 700,
  },
  confirmPrimary: {
    background: "var(--brand-primary)",
    color: "#fff",
  },
  confirmDanger: {
    background: "rgba(239,68,68,0.9)",
    color: "#fff",
  },
};
