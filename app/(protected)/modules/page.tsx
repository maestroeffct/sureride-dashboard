"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { styles } from "./styles";
import { ModuleCard } from "@/src/components/modules/ModuleCard";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const MODULES = [
  {
    title: "Car Rental",
    description: "Cars • Bookings • Pricing",
    icon: "🚗",
    href: "/rentals",
    accent: "#F59E0B",
    status: "live" as const,
  },
  {
    title: "Rideshare",
    description: "Trips • Drivers • Riders",
    icon: "🚕",
    href: "/rideshare",
    accent: "#6366F1",
    status: "soon" as const,
  },
  {
    title: "Insurance",
    description: "Policies • Claims",
    icon: "🛡",
    href: "/insurance",
    accent: "#22C55E",
    status: "soon" as const,
  },
  {
    title: "Mobile Mechanic",
    description: "Jobs • Mechanics",
    icon: "🛠",
    href: "/mechanic",
    accent: "#EC4899",
    status: "soon" as const,
  },
  {
    title: "Auto Deal",
    description: "Listings • Dealers",
    icon: "🚙",
    href: "/autodeal",
    accent: "#38BDF8",
    status: "soon" as const,
  },
  {
    title: "Spare Parts",
    description: "Vendors • Orders",
    icon: "🔧",
    href: "/parts",
    accent: "#A855F7",
    status: "soon" as const,
  },
  {
    title: "Diagnostics",
    description: "OBD • Reports • AI",
    icon: "🧠",
    href: "/diagnostics",
    accent: "#14B8A6",
    status: "soon" as const,
  },
  {
    title: "Emergency",
    description: "SOS • Dispatch • Response",
    icon: "🚨",
    href: "/emergency",
    accent: "#EF4444",
    status: "soon" as const,
  },
];

export default function ModuleSelectorPage() {
  const router = useRouter();
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const active = localStorage.getItem("sureride_active_module");
    if (active) {
      setRedirecting(true);
      router.replace(active);
      return;
    }
    try {
      setLastUsed(localStorage.getItem("sureride_last_module"));
    } catch {
      // noop
    }
  }, [router]);

  const filteredModules = useMemo(() => {
    return MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase()),
    ).sort((a, b) => (a.href === lastUsed ? -1 : b.href === lastUsed ? 1 : 0));
  }, [query, lastUsed]);

  if (redirecting) {
    return (
      <div style={styles.redirecting}>
        <div style={styles.redirectSpinner} />
        <span style={styles.redirectText}>Loading your module…</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Platform Modules</h1>
          <span style={styles.moduleCount}>{MODULES.length} modules</span>
        </div>
        <p style={styles.subtitle}>
          Select a module to manage. Your choice is locked in — use the sidebar to switch.
        </p>

        <input
          style={styles.search}
          placeholder="Search modules…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={query}
          style={styles.grid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {filteredModules.map((m) => (
            <ModuleCard
              key={m.href}
              {...m}
              isLastUsed={m.href === lastUsed}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
