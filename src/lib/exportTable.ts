/**
 * Shared CSV + print-to-PDF download helpers.
 *
 * CSV: builds a properly-quoted text/csv blob and triggers a download.
 * PDF: opens a printable HTML table in a new tab and calls window.print().
 *      The user picks "Save as PDF" from the system print dialog. This keeps
 *      us dependency-free and works in every modern browser.
 */

type CellValue = string | number | boolean | null | undefined;

function toCsvValue(input: CellValue): string {
  const value = String(input ?? "");
  // RFC 4180: wrap in quotes and double any embedded quotes.
  return `"${value.replaceAll('"', '""')}"`;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: CellValue[][],
) {
  const lines = [
    headers.map(toCsvValue).join(","),
    ...rows.map((r) => r.map(toCsvValue).join(",")),
  ];
  // Excel needs a BOM to render UTF-8 correctly (Naira sign, accents, etc.).
  const csv = "﻿" + lines.join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.setAttribute(
    "download",
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(href);
}

function escapeHtml(value: CellValue): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function downloadPdf(
  filename: string,
  title: string,
  headers: string[],
  rows: CellValue[][],
) {
  // The user picks Save-as-PDF from the system print dialog. Zero deps.
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    // Pop-up blocked — fall through to CSV download as a usable fallback.
    downloadCsv(filename, headers, rows);
    return;
  }

  const thead = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const tbody = rows
    .map(
      (r) =>
        "<tr>" + r.map((c) => `<td>${escapeHtml(c)}</td>`).join("") + "</tr>",
    )
    .join("");

  win.document.write(`<!doctype html>
<html><head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }
  @media print {
    body { padding: 12px; }
    @page { margin: 12mm; }
  }
</style>
</head><body>
<h1>${escapeHtml(title)}</h1>
<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
<script>
  // Wait one tick so layout settles before the print dialog renders the table.
  setTimeout(function() { window.print(); }, 100);
</script>
</body></html>`);
  win.document.close();
}
