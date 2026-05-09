"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type ReactNode } from "react";

type GlowColor = "green" | "yellow" | "red" | "none";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: GlowColor;
  hoverable?: boolean;
}

const glowClasses: Record<GlowColor, string> = {
  green: "glass-glow-green",
  yellow: "glass-glow-yellow",
  red: "glass-glow-red",
  none: "glass",
};

export default function GlassCard({
  children,
  className,
  glowColor = "none",
  hoverable = false,
}: GlassCardProps) {
  const baseClasses = cn(
    glowClasses[glowColor],
    "p-6",
    hoverable && "transition-all duration-300 hover:border-white/[0.15]",
    className
  );

  if (hoverable) {
    return (
      <motion.div
        className={baseClasses}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}
