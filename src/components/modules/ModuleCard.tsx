"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CSSProperties } from "react";

/* ---------------------------------------------
   Types
--------------------------------------------- */

interface Props {
  title: string;
  description: string;
  icon: string;
  href: string;
  accent: string;
  isLastUsed?: boolean;
}

/* ---------------------------------------------
   Animation Variants (Child)
--------------------------------------------- */

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 32,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

/* ---------------------------------------------
   Component
--------------------------------------------- */

export function ModuleCard({
  title,
  description,
  icon,
  href,
  accent,
  isLastUsed,
}: Props) {
  const handleClick = () => {
    localStorage.setItem("sureride_last_module", href);
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Link
        href={href}
        onClick={handleClick}
        style={{
          ...cardStyle,
          borderColor: accent,
          boxShadow: isLastUsed ? `0 0 0 2px ${accent}66` : "none",
        }}
      >
        <div
          style={{
            ...iconWrapper,
            background: `${accent}22`,
          }}
        >
          <span style={iconStyle}>{icon}</span>
        </div>

        <div style={contentStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <p style={descStyle}>{description}</p>

          {isLastUsed && <span style={badgeStyle}>Last used</span>}
        </div>
      </Link>
    </motion.div>
  );
}

/* ---------------------------------------------
   Styles
--------------------------------------------- */

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: 16,
  width: "100%",
  height: 250,
  padding: 24,
  borderRadius: 16,
  border: "1.5px solid transparent",
  background: "linear-gradient(180deg, #0F172A, #020617)",
  color: "#E5E7EB",
  textDecoration: "none",
  cursor: "pointer",
};

const iconWrapper: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconStyle: CSSProperties = {
  fontSize: 28,
};

const contentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const titleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  marginBottom: 4,
};

const descStyle: CSSProperties = {
  fontSize: 13,
  color: "#9CA3AF",
};

const badgeStyle: CSSProperties = {
  marginTop: 10,
  fontSize: 11,
  color: "#A7F3D0",
};
