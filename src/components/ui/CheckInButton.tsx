"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check } from "lucide-react";
import { useState, useCallback } from "react";

interface CheckInButtonProps {
  onClick?: () => void;
  className?: string;
}

export default function CheckInButton({ onClick, className }: CheckInButtonProps) {
  const [checked, setChecked] = useState(false);

  const handleClick = useCallback(() => {
    if (checked) return;
    setChecked(true);
    onClick?.();
    setTimeout(() => setChecked(false), 2000);
  }, [checked, onClick]);

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2.5",
        "rounded-xl px-6 py-3 font-semibold text-sm",
        "bg-success/10 text-success border border-success/20",
        "shadow-[0_0_20px_rgba(20,241,149,0.15)]",
        "hover:shadow-[0_0_30px_rgba(20,241,149,0.25)]",
        "transition-shadow duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/50",
        className
      )}
    >
      {/* Pulsing glow ring */}
      <span className="absolute inset-0 rounded-xl border border-success/30 animate-pulse-glow" />

      <AnimatePresence mode="wait">
        {checked ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="inline-flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
            Checked In
          </motion.span>
        ) : (
          <motion.span
            key="shield"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="inline-flex items-center gap-2"
          >
            <Shield className="h-5 w-5" />
            Check In
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
