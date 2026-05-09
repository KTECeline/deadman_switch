"use client";

import { cn } from "@/lib/utils";
import { formatCountdown } from "@/lib/utils";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  totalDays: number;
  remainingDays: number;
  className?: string;
}

function getRingColor(remainingDays: number): {
  stroke: string;
  text: string;
} {
  if (remainingDays < 7) {
    return { stroke: "#FF5C7A", text: "text-danger" };
  }
  if (remainingDays <= 30) {
    return { stroke: "#F6C344", text: "text-warning" };
  }
  return { stroke: "#14F195", text: "text-success" };
}

export default function CountdownTimer({
  totalDays,
  remainingDays,
  className,
}: CountdownTimerProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remainingDays / totalDays));
  const strokeDashoffset = circumference * (1 - progress);
  const { stroke, text } = getRingColor(remainingDays);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-white/[0.06]"
        />
        {/* Progress ring */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold", text)}>
          {remainingDays}
        </span>
        <span className="text-xs text-muted">
          {formatCountdown(remainingDays) === "Triggered"
            ? "Triggered"
            : "days left"}
        </span>
      </div>
    </div>
  );
}
