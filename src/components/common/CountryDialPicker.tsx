"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { getFlagEmoji } from "@/src/lib/flagEmoji";
import {
  useCountryDialCodes,
  type CountryDialCode,
} from "@/src/hooks/useCountryDialCodes";

type Props = {
  /** Selected dial code, e.g. "+234" */
  value: string;
  onChange: (dialCode: string, country: CountryDialCode) => void;
  /** Pixel width of the trigger button — defaults to 130 */
  width?: number;
  /** Disable the picker */
  disabled?: boolean;
};

export default function CountryDialPicker({
  value,
  onChange,
  width = 130,
  disabled = false,
}: Props) {
  const { countries, loading } = useCountryDialCodes();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => countries.find((c) => c.dialCode === value),
    [countries, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q),
    );
  }, [countries, query]);

  // Click-outside dismiss
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Auto-focus the search input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  return (
    <div style={{ position: "relative", width }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{ ...s.trigger, width }}
      >
        <span style={s.flagBig}>{getFlagEmoji(selected?.code)}</span>
        <span style={s.dialCode}>{selected?.dialCode ?? value}</span>
        <ChevronDown
          size={14}
          style={{ marginLeft: "auto", opacity: 0.6, flexShrink: 0 }}
        />
      </button>

      {open && (
        <div ref={popoverRef} style={s.popover}>
          <div style={s.searchRow}>
            <Search size={15} color="var(--muted-foreground)" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or dial code"
              style={s.searchInput}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={s.clearBtn}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div style={s.list}>
            {loading ? (
              <div style={s.empty}>Loading countries…</div>
            ) : filtered.length === 0 ? (
              <div style={s.empty}>No matches</div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.dialCode === value;
                return (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => {
                      onChange(c.dialCode, c);
                      setOpen(false);
                    }}
                    style={{
                      ...s.row,
                      ...(isSelected ? s.rowSelected : {}),
                    }}
                  >
                    <span style={s.flag}>{getFlagEmoji(c.code)}</span>
                    <span style={s.name}>{c.name}</span>
                    <span style={s.dialCodeSmall}>{c.dialCode}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  trigger: {
    height: 44,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg, var(--surface-2))",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    boxSizing: "border-box",
  },
  flagBig: { fontSize: 18, lineHeight: 1 },
  dialCode: { fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" },

  popover: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 6,
    width: 320,
    maxWidth: "calc(100vw - 32px)",
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderBottom: "1px solid var(--input-border)",
    background: "var(--surface-2)",
  },
  searchInput: {
    flex: 1,
    height: 28,
    border: "none",
    background: "transparent",
    color: "var(--foreground)",
    outline: "none",
    fontSize: 13,
    padding: 0,
  },
  clearBtn: {
    width: 22,
    height: 22,
    border: "none",
    background: "transparent",
    color: "var(--muted-foreground)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },

  list: {
    maxHeight: 320,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    border: "none",
    background: "transparent",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
    textAlign: "left",
    width: "100%",
  },
  rowSelected: {
    background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
    color: "var(--brand-primary)",
    fontWeight: 600,
  },
  flag: { fontSize: 18, lineHeight: 1, flexShrink: 0 },
  name: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dialCodeSmall: {
    fontSize: 12,
    color: "var(--muted-foreground)",
    flexShrink: 0,
    fontVariantNumeric: "tabular-nums",
  },

  empty: {
    padding: "20px 12px",
    textAlign: "center",
    color: "var(--muted-foreground)",
    fontSize: 12,
  },
};
