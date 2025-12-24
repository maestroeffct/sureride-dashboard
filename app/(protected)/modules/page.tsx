"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { styles } from "./styles";
import { ModuleCard } from "@/src/components/modules/ModuleCard";

/* ---------------------------------------------
   Animation Variants (Container)
--------------------------------------------- */

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

/* ---------------------------------------------
   Modules Config
--------------------------------------------- */

const MODULES = [
  {
    title: "Car Rental",
    description: "Cars • Bookings • Pricing",
    icon: "🚗",
    href: "/rentals",
    accent: "#F59E0B",
  },
  {
    title: "Rideshare",
    description: "Trips • Drivers • Riders",
    icon: "🚕",
    href: "/rideshare",
    accent: "#6366F1",
  },
  {
    title: "Insurance",
    description: "Policies • Claims",
    icon: "🛡",
    href: "/insurance",
    accent: "#22C55E",
  },
  {
    title: "Mobile Mechanic",
    description: "Jobs • Mechanics",
    icon: "🛠",
    href: "/mechanic",
    accent: "#EC4899",
  },
  {
    title: "Auto Deal",
    description: "Listings • Dealers",
    icon: "🚙",
    href: "/autodeal",
    accent: "#38BDF8",
  },
  {
    title: "Spare Parts",
    description: "Vendors • Orders",
    icon: "🔧",
    href: "/parts",
    accent: "#A855F7",
  },
  {
    title: "Diagnostics",
    description: "OBD • Reports • AI",
    icon: "🧠",
    href: "/diagnostics",
    accent: "#14B8A6",
  },
];

/* ---------------------------------------------
   Page
--------------------------------------------- */

export default function ModuleSelectorPage() {
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLastUsed(localStorage.getItem("sureride_last_module"));
  }, []);

  const filteredModules = useMemo(() => {
    return MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => (a.href === lastUsed ? -1 : b.href === lastUsed ? 1 : 0));
  }, [query, lastUsed]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Select a Sureride Module</h1>
        <p style={styles.subtitle}>Choose the module you want to manage</p>

        <input
          style={styles.search}
          placeholder="Search modules..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* 🔑 KEY FIX: key the container by query */}
      <AnimatePresence mode="wait">
        <motion.div
          key={query} // 👈 CRITICAL FIX
          style={styles.grid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {filteredModules.map((m) => (
            <ModuleCard key={m.href} {...m} isLastUsed={m.href === lastUsed} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
