"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, Shield } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

/* ─── Mock Data ──────────────────────────────────────────── */

const beneficiaryData = {
  fromWallet: "7kR3...nM2p",
  amount: 5,
  triggerCondition: "90 Days Inactive",
  currentStatus: "Awaiting Trigger Conditions",
  remainingDays: 72,
};

const faqItems = [
  {
    question: "What is a Dead Man's Switch?",
    answer:
      "A Dead Man's Switch is a mechanism that automatically transfers crypto assets to a designated beneficiary if the original owner becomes inactive for a specified period. It ensures your digital assets are passed on to your loved ones without requiring any intermediaries.",
  },
  {
    question: "Do I need to do anything?",
    answer:
      "No. As a beneficiary, no action is required on your part. The transfer will execute automatically once the trigger conditions are met. You simply need a Solana wallet to receive the funds.",
  },
  {
    question: "When will I receive the transfer?",
    answer:
      "The transfer will only occur if the switch owner does not check in within the specified inactivity period. The current countdown shows how many days remain before the trigger activates. If the owner checks in, the countdown resets.",
  },
];

/* ─── Animations ─────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ─── FAQ Accordion Item ─────────────────────────────────── */

function FaqItem({ item }: { item: (typeof faqItems)[0] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "glass overflow-hidden transition-colors duration-300",
        open && "border-white/[0.12]"
      )}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left text-sm font-medium text-secondary hover:text-foreground transition-colors"
      >
        {item.question}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page Component ─────────────────────────────────────── */

export default function BeneficiaryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <span className="text-gradient text-lg font-bold tracking-tight">
              Dead Man&apos;s Switch
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          {/* Hero Card */}
          <motion.div variants={fadeUp} custom={0}>
            <GlassCard className="space-y-6">
              {/* Heading */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
                <h1 className="text-lg font-bold sm:text-xl">
                  You are listed as a beneficiary
                </h1>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.08]" />

              {/* Info rows */}
              <div className="space-y-4">
                <InfoRow
                  label="From"
                  value={`Anonymous Wallet (${beneficiaryData.fromWallet})`}
                />
                <InfoRow
                  label="Potential Transfer"
                  value={`${beneficiaryData.amount} SOL`}
                  highlight
                />
                <InfoRow
                  label="Trigger Condition"
                  value={beneficiaryData.triggerCondition}
                />

                {/* Status with pulsing dot */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">Current Status</span>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-warning">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
                    </span>
                    {beneficiaryData.currentStatus}
                  </span>
                </div>

                <InfoRow
                  label="Countdown"
                  value={`${beneficiaryData.remainingDays} Days Remaining`}
                />
              </div>
            </GlassCard>
          </motion.div>

          {/* Informational Text */}
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-center text-sm leading-relaxed text-muted"
          >
            This means someone has set up an emergency transfer that may send
            SOL to your wallet. No action is required from you. The transfer
            will execute automatically if the trigger conditions are met.
          </motion.p>

          {/* FAQ Section */}
          <motion.div variants={fadeUp} custom={2} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <FaqItem key={i} item={item} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

/* ─── Info Row helper ────────────────────────────────────── */

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted">{label}</span>
      <span
        className={cn(
          "text-sm font-medium",
          highlight ? "text-gradient" : "text-secondary"
        )}
      >
        {value}
      </span>
    </div>
  );
}
