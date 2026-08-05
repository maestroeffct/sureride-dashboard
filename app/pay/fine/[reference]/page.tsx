"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, ShieldCheck, XCircle } from "lucide-react";

type PublicFine = {
  id: string;
  reference: string | null;
  amount: number;
  currency: string;
  category: string;
  status: "PENDING" | "PAID" | "WAIVED" | "DISPUTED" | "OVERDUE";
  reason: string;
  dueDate: string | null;
  createdAt: string;
  customerName: string | null;
  customerEmailHint: string | null;
  providerName: string | null;
  car: { label: string; plate: string | null } | null;
  alreadyPaid: boolean;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export default function PayFinePage() {
  const params = useParams<{ reference: string }>();
  const search = useSearchParams();
  const reference = params?.reference ?? "";

  const [fine, setFine] = useState<PublicFine | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [starting, setStarting] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Paystack redirects back with ?reference=… on success. Show a
  // success banner immediately if that's what we're looking at.
  const paidJustNow = !!search?.get("reference");

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/payments/fines/${encodeURIComponent(reference)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.message ?? "Fine not found");
        if (!cancelled) setFine(data.fine);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e?.message ?? "Failed to load fine");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const formatted = useMemo(() => {
    if (!fine) return "";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: fine.currency || "NGN",
        maximumFractionDigits: 0,
      }).format(fine.amount);
    } catch {
      return `${fine.currency ?? "NGN"} ${fine.amount.toLocaleString()}`;
    }
  }, [fine]);

  const startPayment = async () => {
    if (!fine) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setInitError("Enter a valid email for your receipt.");
      return;
    }
    try {
      setStarting(true);
      setInitError(null);
      const callbackUrl = typeof window !== "undefined"
        ? `${window.location.origin}/pay/fine/${encodeURIComponent(reference)}?paid=1`
        : undefined;
      const res = await fetch(`${API_BASE}/payments/fines/${encodeURIComponent(reference)}/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), callbackUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.authorizationUrl) {
        throw new Error(data?.message ?? "Failed to start payment");
      }
      window.location.href = data.authorizationUrl as string;
    } catch (e: any) {
      setInitError(e?.message ?? "Failed to start payment");
      setStarting(false);
    }
  };

  if (loading) return <Frame><div style={s.msg}>Loading fine…</div></Frame>;
  if (loadError) return (
    <Frame>
      <div style={s.errBox}>
        <XCircle size={22} color="#fca5a5" />
        <div>
          <strong style={{ fontSize: 15 }}>Couldn't load this fine</strong>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>{loadError}</p>
        </div>
      </div>
    </Frame>
  );
  if (!fine) return null;

  const alreadyPaid = fine.alreadyPaid || paidJustNow;

  return (
    <Frame>
      <header style={s.header}>
        <h1 style={s.title}>Pay Your Fine</h1>
        <p style={s.subtitle}>
          {fine.providerName ?? "SureRide"} issued this fine on{" "}
          {new Date(fine.createdAt).toLocaleDateString()}.
        </p>
      </header>

      {alreadyPaid && (
        <div style={s.successBox}>
          <CheckCircle2 size={20} color="#22c55e" />
          <div>
            <strong>Paid — thank you.</strong>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
              A receipt has been emailed to you.
            </p>
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.rowBetween}>
          <span style={s.label}>Reference</span>
          <strong>{fine.reference ?? fine.id.slice(0, 8)}</strong>
        </div>
        <div style={s.rowBetween}>
          <span style={s.label}>Amount</span>
          <strong style={{ fontSize: 22 }}>{formatted}</strong>
        </div>
        <div style={s.rowBetween}>
          <span style={s.label}>Reason</span>
          <span style={{ maxWidth: "60%", textAlign: "right" }}>{fine.reason}</span>
        </div>
        {fine.car && (
          <div style={s.rowBetween}>
            <span style={s.label}>Vehicle</span>
            <span>{fine.car.label}{fine.car.plate ? ` · ${fine.car.plate}` : ""}</span>
          </div>
        )}
        {fine.dueDate && (
          <div style={s.rowBetween}>
            <span style={s.label}>Due by</span>
            <span>{new Date(fine.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {!alreadyPaid && (
        <div style={s.card}>
          <label style={s.label}>Email for receipt</label>
          <input
            type="email"
            style={s.input}
            placeholder={fine.customerEmailHint ?? "you@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
          {initError && <div style={s.err}>{initError}</div>}
          <button style={s.payBtn} onClick={startPayment} disabled={starting}>
            <CreditCard size={16} />
            {starting ? "Redirecting to Paystack…" : `Pay ${formatted}`}
          </button>
          <p style={s.secure}>
            <ShieldCheck size={12} /> Secure payment powered by Paystack. You'll return here after checkout.
          </p>
        </div>
      )}
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div style={s.page}>
      <div style={s.container}>
        {children}
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px" },
  container: { width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 18 },
  header: { textAlign: "center" },
  title: { margin: 0, fontSize: 26, fontWeight: 800 },
  subtitle: { margin: "6px 0 0", color: "var(--muted-foreground)", fontSize: 13 },
  card: { background: "var(--surface-1)", border: "1px solid var(--input-border)", borderRadius: 14, padding: 22, display: "flex", flexDirection: "column", gap: 14 },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, fontSize: 14 },
  label: { color: "var(--muted-foreground)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { padding: "12px 14px", borderRadius: 10, border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--input-fg)", fontSize: 15, outline: "none" },
  err: { fontSize: 13, color: "#fca5a5" },
  payBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, padding: "0 20px", borderRadius: 12, border: "none", background: "var(--brand-primary)", color: "#022c22", fontSize: 15, fontWeight: 800, cursor: "pointer" },
  secure: { margin: 0, fontSize: 11, color: "var(--muted-foreground)", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 },
  successBox: { background: "color-mix(in srgb, #22c55e 10%, var(--surface-1))", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" },
  errBox: { background: "color-mix(in srgb, #ef4444 10%, var(--surface-1))", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" },
  msg: { padding: 40, textAlign: "center", color: "var(--muted-foreground)" },
};
