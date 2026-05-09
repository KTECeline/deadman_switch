"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type ReactNode, type MouseEventHandler } from "react";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary";

interface SolanaGradientButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  size?: Size;
  variant?: Variant;
  disabled?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
};

export default function SolanaGradientButton({
  children,
  onClick,
  className,
  size = "md",
  variant = "primary",
  disabled = false,
}: SolanaGradientButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
        "transition-shadow duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        isPrimary && [
          "bg-solana-gradient text-white",
          "hover:shadow-[0_0_24px_rgba(153,69,255,0.35)]",
        ],
        !isPrimary && [
          "bg-transparent text-foreground",
          "border border-transparent",
          "bg-clip-padding",
          // Gradient border via background-origin trick
          "[background-image:linear-gradient(#141821,#141821),linear-gradient(135deg,#9945FF,#14F195)]",
          "[background-origin:border-box]",
          "[background-clip:padding-box,border-box]",
          "border border-transparent",
          "hover:shadow-[0_0_20px_rgba(153,69,255,0.25)]",
        ],
        className
      )}
    >
      {children}
    </motion.button>
  );
}
