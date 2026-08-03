"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { listProviderReviews, type ReviewRow } from "@/src/lib/providerOpsApi";

export default function ReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [summary, setSummary] = useState({ count: 0, average: 0, breakdown: [] as { rating: number; count: number }[] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listProviderReviews();
      setRows(res.items);
      setSummary(res.summary);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const max = Math.max(1, ...summary.breakdown.map((b) => b.count));

  return (
    <div style={s.page}>
      <header>
        <h1 style={s.title}><Star size={20} color="var(--brand-primary)" /> Customer Reviews</h1>
        <p style={s.sub}>What renters are saying about your fleet. Reviews are aggregated across all your cars.</p>
      </header>

      <div style={s.summary}>
        <div style={s.avg}>
          <strong style={s.avgNum}>{summary.average.toFixed(1)}</strong>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} fill={i <= Math.round(summary.average) ? "#fbbf24" : "none"} color={i <= Math.round(summary.average) ? "#fbbf24" : "var(--input-border)"} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{summary.count} review{summary.count === 1 ? "" : "s"}</div>
        </div>
        <div style={s.breakdown}>
          {[5, 4, 3, 2, 1].map((r) => {
            const b = summary.breakdown.find((x) => x.rating === r) ?? { rating: r, count: 0 };
            const w = (b.count / max) * 100;
            return (
              <div key={r} style={s.brRow}>
                <span style={{ minWidth: 30, fontSize: 12, color: "var(--muted-foreground)" }}>{r} ★</span>
                <div style={s.bar}><div style={{ ...s.barFill, width: `${w}%` }} /></div>
                <span style={{ minWidth: 30, fontSize: 12, textAlign: "right" as any }}>{b.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {loading ? <div style={s.empty}>Loading…</div>
        : rows.length === 0 ? <div style={s.empty}>No reviews yet — they'll appear here after your first completed rentals.</div>
        : (
          <div style={s.list}>
            {rows.map((r) => (
              <article key={r.id} style={s.card}>
                <div style={s.cardTop}>
                  <div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} fill={i <= r.rating ? "#fbbf24" : "none"} color={i <= r.rating ? "#fbbf24" : "var(--input-border)"} />
                      ))}
                    </div>
                    <div style={s.meta}>
                      {r.userDisplayName ?? `${r.user.firstName} ${r.user.lastName}`} · {r.car.brand} {r.car.model} · {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {r.comment && <p style={s.comment}>{r.comment}</p>}
              </article>
            ))}
          </div>
        )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 },
  title: { margin: 0, fontSize: 22, fontWeight: 750, display: "inline-flex", gap: 10, alignItems: "center" },
  sub: { margin: "4px 0 0", color: "var(--muted-foreground)", fontSize: 13, maxWidth: 720 },
  summary: { display: "grid", gridTemplateColumns: "160px 1fr", gap: 22, background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 20 },
  avg: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  avgNum: { fontSize: 42, fontWeight: 750, lineHeight: 1 },
  breakdown: { display: "flex", flexDirection: "column", gap: 6 },
  brRow: { display: "flex", alignItems: "center", gap: 10 },
  bar: { flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%", background: "#fbbf24", borderRadius: 999 },
  empty: { padding: 40, textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--input-border)", borderRadius: 12 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 12, padding: 14 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  meta: { fontSize: 12, color: "var(--muted-foreground)", marginTop: 6 },
  comment: { margin: "10px 0 0", fontSize: 14, lineHeight: 1.55 },
};
