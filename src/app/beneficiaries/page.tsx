"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Shield,
  Crown,
  ChevronDown,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { useSwitches } from "@/lib/switches-store";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface BeneficiaryGroup {
  name: string;
  address: string;
  shortAddress: string;
  totalAmount: number;
  switchCount: number;
  switches: {
    id: number;
    title: string;
    amount: number;
    amountLabel: string;
    daysRemaining: number;
    status: "active" | "warning" | "critical" | "executed";
  }[];
  worstStatus: "active" | "warning" | "critical" | "executed";
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Status helpers                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  active: {
    label: "Active",
    dotClass: "bg-success",
    badgeClass: "bg-success/10 text-success border border-success/20",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-warning",
    badgeClass: "bg-warning/10 text-warning border border-warning/20",
  },
  critical: {
    label: "Critical",
    dotClass: "bg-danger",
    badgeClass: "bg-danger/10 text-danger border border-danger/20",
  },
  executed: {
    label: "Executed",
    dotClass: "bg-[#718096]",
    badgeClass: "bg-[#718096]/10 text-[#718096] border border-[#718096]/20",
  },
};

const statusPriority: Record<string, number> = {
  active: 0,
  warning: 1,
  critical: 2,
  executed: 3,
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function BeneficiariesPage() {
  const { switches } = useSwitches();
  const [expandedBeneficiary, setExpandedBeneficiary] = useState<string | null>(
    null
  );

  /* -- Derive grouped beneficiaries --------------------------------- */
  const beneficiaries = useMemo<BeneficiaryGroup[]>(() => {
    const map = new Map<string, BeneficiaryGroup>();

    for (const sw of switches) {
      const key = sw.beneficiaryName;
      const existing = map.get(key);

      const swData = {
        id: sw.id,
        title: sw.title,
        amount: sw.amount,
        amountLabel: sw.amountLabel,
        daysRemaining: sw.daysRemaining,
        status: sw.status,
      };

      if (existing) {
        existing.totalAmount += sw.amount;
        existing.switchCount += 1;
        existing.switches.push(swData);
        if (
          statusPriority[sw.status] > statusPriority[existing.worstStatus]
        ) {
          existing.worstStatus = sw.status;
        }
      } else {
        map.set(key, {
          name: sw.beneficiaryName,
          address: sw.beneficiaryAddress,
          shortAddress: sw.beneficiaryShort,
          totalAmount: sw.amount,
          switchCount: 1,
          switches: [swData],
          worstStatus: sw.status,
        });
      }
    }

    return Array.from(map.values());
  }, [switches]);

  const totalBeneficiaries = beneficiaries.length;
  const totalProtected = beneficiaries.reduce(
    (sum, b) => sum + b.totalAmount,
    0
  );
  const mostProtected =
    beneficiaries.length > 0
      ? beneficiaries.reduce((prev, cur) =>
          cur.totalAmount > prev.totalAmount ? cur : prev
        ).name
      : "---";

  /* -- Empty state -------------------------------------------------- */
  if (switches.length === 0) {
    return (
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex min-h-[60vh] flex-col items-center justify-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Users className="h-10 w-10 text-[#718096]" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">
            No beneficiaries yet
          </h2>
          <p className="mb-8 max-w-sm text-sm text-[#718096]">
            Create your first switch to add a beneficiary
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #9945FF, #14F195)",
            }}
          >
            Create Switch
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </DashboardLayout>
    );
  }

  /* -- Main render -------------------------------------------------- */
  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Beneficiaries
          </h1>
          <p className="mt-1 text-sm text-[#718096]">
            People you&apos;ve chosen to protect.
          </p>
        </motion.div>

        {/* ── Summary Stats ─────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <StatCard
            icon={<Users className="h-5 w-5 text-[#9945FF]" />}
            label="Total Beneficiaries"
            value={String(totalBeneficiaries)}
          />
          <StatCard
            icon={<Shield className="h-5 w-5 text-[#14F195]" />}
            label="Total Protected"
            value={`${totalProtected} SOL`}
          />
          <StatCard
            icon={<Crown className="h-5 w-5 text-[#F6C344]" />}
            label="Most Protected"
            value={mostProtected}
          />
        </motion.div>

        {/* ── Beneficiaries Grid ────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {beneficiaries.map((b, i) => (
            <motion.div
              key={b.name}
              variants={itemVariants}
              className="flex flex-col"
            >
              <BeneficiaryCard
                beneficiary={b}
                isExpanded={expandedBeneficiary === b.name}
                onToggle={() =>
                  setExpandedBeneficiary((prev) =>
                    prev === b.name ? null : b.name
                  )
                }
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass glass-hover rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-[#718096]">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Beneficiary Card                                                    */
/* ------------------------------------------------------------------ */

function BeneficiaryCard({
  beneficiary,
  isExpanded,
  onToggle,
}: {
  beneficiary: BeneficiaryGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const b = beneficiary;
  const cfg = statusConfig[b.worstStatus];
  const glowClass =
    b.worstStatus === "warning" || b.worstStatus === "critical"
      ? b.worstStatus === "warning"
        ? "glass-glow-yellow"
        : "glass-glow-red"
      : "glass-glow-green";

  return (
    <div
      className={cn(
        "glass glass-hover rounded-2xl overflow-hidden transition-all duration-300",
        glowClass
      )}
    >
      {/* ── Main card body ─────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-full p-6 text-left focus:outline-none"
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #9945FF, #14F195)",
            }}
          >
            {b.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-bold text-white">
                {b.name}
              </h3>
              {/* Status dot */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    cfg.dotClass
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-2.5 w-2.5 rounded-full",
                    cfg.dotClass
                  )}
                />
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-[#718096]">
              {b.shortAddress}
            </p>
          </div>

          {/* Chevron */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 pt-1"
          >
            <ChevronDown className="h-5 w-5 text-[#718096]" />
          </motion.span>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#718096]">
              Protected Switches
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {b.switchCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#718096]">
              Total Amount
            </p>
            <p className="mt-1 text-lg font-bold text-gradient">
              {b.totalAmount} SOL
            </p>
          </div>
        </div>

        {/* Switch title pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {b.switches.map((sw) => (
            <span
              key={sw.id}
              className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/[0.08] px-3 py-1 text-[11px] font-medium text-[#A0AEC0]"
            >
              {sw.title}
            </span>
          ))}
        </div>
      </button>

      {/* ── Expanded details ───────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-6 pb-5 pt-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#718096]">
                Linked Switches
              </p>
              {b.switches.map((sw) => {
                const swCfg = statusConfig[sw.status];
                return (
                  <Link
                    key={sw.id}
                    href={`/switch/${sw.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {sw.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[#718096]">
                        <span className="text-gradient font-medium">
                          {sw.amountLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {sw.daysRemaining} days left
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                          swCfg.badgeClass
                        )}
                      >
                        {swCfg.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#718096]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
