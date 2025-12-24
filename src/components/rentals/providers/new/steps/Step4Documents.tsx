"use client";

import { ProviderDraftForm } from "@/src/types/rentalProvider";
import { useEffect, useState } from "react";

interface Props {
  form: ProviderDraftForm;
  setField: (k: keyof ProviderDraftForm, v: any) => void;
}

export default function Step4Documents({ form, setField }: Props) {
  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Verification Documents</h2>

      <DocumentCard
        label="Business Registration Certificate"
        required
        file={form.regCert}
        onUpload={(f) => setField("regCert", f)}
      />

      <DocumentCard
        label="Government ID (NIN / Passport)"
        required
        file={form.govId}
        onUpload={(f) => setField("govId", f)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DocumentCard({
  label,
  required,
  file,
  onUpload,
}: {
  label: string;
  required?: boolean;
  file: File | null | undefined;
  onUpload: (f: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage =
    file && ["image/jpeg", "image/png", "image/jpg"].includes(file.type);
  const isPdf = file && file.type === "application/pdf";

  // Create preview URL
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span>{label}</span>
        {required && <span style={styles.required}>Required</span>}
      </div>

      {!file && (
        <label style={styles.uploadBox}>
          Upload file (PDF / JPG / PNG — max 3MB)
          <input
            type="file"
            hidden
            accept=".pdf,.jpg,.png"
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
        </label>
      )}

      {file && (
        <div style={styles.previewWrapper}>
          {/* IMAGE PREVIEW */}
          {isImage && previewUrl && (
            <img src={previewUrl} alt={file.name} style={styles.imagePreview} />
          )}

          {/* PDF PREVIEW */}
          {isPdf && (
            <div style={styles.pdfPreview}>
              📄 <span>{file.name}</span>
            </div>
          )}

          {/* FILE ACTIONS */}
          <div style={styles.fileActions}>
            <label style={styles.link}>
              Replace
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.png"
                onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              />
            </label>

            <button style={styles.danger} onClick={() => onUpload(null)}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: "flex", flexDirection: "column", gap: 18 },
  title: { fontSize: 18, fontWeight: 700 },

  card: {
    border: "1px solid #1F2937",
    borderRadius: 14,
    padding: 16,
    background: "#020617",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
  },

  required: { color: "#F59E0B", fontSize: 12 },

  uploadBox: {
    padding: 24,
    border: "1px dashed #1F2937",
    borderRadius: 12,
    textAlign: "center",
    cursor: "pointer",
    color: "#9CA3AF",
  },

  previewWrapper: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },

  imagePreview: {
    width: 120,
    height: 80,
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid #1F2937",
  },

  pdfPreview: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#E5E7EB",
  },

  fileActions: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },

  link: {
    color: "#3B82F6",
    cursor: "pointer",
    fontSize: 13,
  },

  danger: {
    color: "#EF4444",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
  },
};
