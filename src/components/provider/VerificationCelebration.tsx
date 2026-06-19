"use client";

import { useEffect, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, ShieldCheck, ArrowRight, X } from "lucide-react";

/**
 * Full-screen celebration shown the first time a provider's verification
 * flips to APPROVED. Built with framer-motion (already in the project) so
 * we don't pull in a confetti dependency.
 *
 * Confetti is rendered as 60 absolutely-positioned divs animated outward
 * from the center with random angles and colours. Pure CSS — no canvas.
 */
export default function VerificationCelebration({
  open,
  providerName,
  onClose,
}: {
  open: boolean;
  providerName?: string;
  onClose: () => void;
}) {
  // Lock background scroll while the overlay is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Deterministic confetti — pick angles + colours per-piece up-front so
  // re-renders don't reshuffle them. We can't use Math.random in render with
  // SSR enabled without hydration mismatches, but this component is
  // client-only so it's fine.
  const pieces = useMemo(() => {
    const COLOURS = ["#0f766e", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#ec4899"];
    return Array.from({ length: 60 }, (_, i) => {
      const angle = (i / 60) * Math.PI * 2 + Math.random() * 0.6;
      const distance = 280 + Math.random() * 260;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: Math.random() * 720 - 360,
        delay: Math.random() * 0.25,
        size: 8 + Math.random() * 6,
        color: COLOURS[i % COLOURS.length],
        shape: i % 3 === 0 ? "circle" : i % 3 === 1 ? "square" : "rect",
      };
    });
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div style={styles.confettiStage}>
            {pieces.map((p) => (
              <motion.div
                key={p.id}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: p.size,
                  height: p.shape === "rect" ? p.size * 1.8 : p.size,
                  background: p.color,
                  borderRadius: p.shape === "circle" ? "50%" : 2,
                  pointerEvents: "none",
                }}
                initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [0, 1, 1, 0],
                  rotate: p.rotate,
                  scale: [0, 1, 1, 0.6],
                }}
                transition={{
                  duration: 1.6,
                  delay: p.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          <motion.div
            style={styles.card}
            initial={{ y: 40, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 22,
              delay: 0.05,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={styles.closeBtn}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <motion.div
              style={styles.iconWrap}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 16,
                delay: 0.18,
              }}
            >
              <ShieldCheck size={42} color="#fff" />
            </motion.div>

            <motion.h2
              style={styles.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              You're verified
              <PartyPopper
                size={26}
                color="#f59e0b"
                style={{ verticalAlign: "middle", marginLeft: 10 }}
              />
            </motion.h2>

            <motion.p
              style={styles.subtitle}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
            >
              Congratulations
              {providerName ? `, ${providerName}` : ""}! Your business has been
              approved. You can now add locations, set up insurance, and list
              your first car for renters.
            </motion.p>

            <motion.div
              style={styles.checklistInline}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
            >
              <Row label="Add a business location" />
              <Row label="Set up an insurance package" />
              <Row label="List your first car" />
            </motion.div>

            <motion.button
              type="button"
              onClick={onClose}
              style={styles.cta}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54 }}
            >
              Continue setup
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label }: { label: string }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowDot} />
      <span style={styles.rowLabel}>{label}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 30%, rgba(15,118,110,0.35), rgba(2,6,23,0.92))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 200,
    overflow: "hidden",
  },
  confettiStage: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 480,
    background:
      "linear-gradient(160deg, rgba(15,23,42,0.96), rgba(15,118,110,0.18))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 36,
    color: "#f8fafc",
    textAlign: "center",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    zIndex: 1,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#cbd5e1",
    borderRadius: 10,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #0f766e, #14b8a6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 18px 40px rgba(15,118,110,0.45), 0 0 0 8px rgba(15,118,110,0.15)",
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  subtitle: {
    margin: 0,
    fontSize: 14.5,
    lineHeight: 1.55,
    color: "#cbd5e1",
    maxWidth: 380,
  },
  checklistInline: {
    width: "100%",
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 6,
  },
  row: { display: "flex", alignItems: "center", gap: 10 },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#14b8a6",
    flexShrink: 0,
  },
  rowLabel: { fontSize: 13.5, color: "#e2e8f0" },
  cta: {
    marginTop: 6,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    borderRadius: 12,
    border: "none",
    background:
      "linear-gradient(135deg, #14b8a6, #0f766e)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14.5,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(20,184,166,0.35)",
  },
};
