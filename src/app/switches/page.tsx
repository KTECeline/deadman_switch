"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Search,
  SlidersHorizontal,
  Calendar,
  User,
  Wallet,
  Clock,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn, shortenAddress, formatCountdown } from "@/lib/utils";
import { useSwitches } from "@/lib/switches-store";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.3 } },
};

/* ------------------------------------------------------------------ */
/*  Status helpers                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; glowClass: string; barColor: string }
> = {
  active: {
    label: "Active",
    badgeClass: "bg-success/10 text-success border border-success/20",
    glowClass: "glass-glow-green",
    barColor: "bg-gradient-to-r from-[#14F195] to-[#9945FF]",
  },
  warning: {
    label: "Warning",
    badgeClass: "bg-warning/10 text-warning border border-warning/20",
    glowClass: "glass-glow-yellow",
    barColor: "bg-gradient-to-r from-[#F6C344] to-[#FF8C00]",
  },
  critical: {
    label: "Critical",
    badgeClass: "bg-danger/10 text-danger border border-danger/20",
    glowClass: "glass-glow-red",
    barColor: "bg-gradient-to-r from-[#FF5C7A] to-[#FF2D55]",
  },
  executed: {
    label: "Executed",
    badgeClass: "bg-white/5 text-muted border border-white/10",
    glowClass: "glass",
    barColor: "bg-white/20",
  },
};

const filterOptions = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "warning", label: "Warning" },
  { key: "critical", label: "Critical" },
] as const;

type FilterKey = (typeof filterOptions)[number]["key"];

/* ------------------------------------------------------------------ */
/*  Cancel Confirmation Modal                                           */
/* ------------------------------------------------------------------ */

function CancelModal({
  switchTitle,
  onConfirm,
  onClose,
}: {
  switchTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="glass p-6 rounded-2xl max-w-sm w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-danger">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Cancel Switch</h3>
        </div>
        <p className="text-secondary text-sm">
          Are you sure you want to cancel{" "}
          <span className="text-foreground font-medium">
            &quot;{switchTitle}&quot;
          </span>
          ? This will deactivate the switch and return funds to your wallet.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.06] text-secondary hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            Keep Active
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors cursor-pointer"
          >
            Cancel Switch
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Check-In Toast                                                      */
/* ------------------------------------------------------------------ */

function CheckInToast({ switchTitle }: { switchTitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 right-6 z-50 glass-glow-green px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl"
    >
      <CheckCircle className="w-5 h-5 text-success" />
      <div>
        <p className="text-sm font-medium text-foreground">
          Checked in successfully
        </p>
        <p className="text-xs text-secondary">{switchTitle} — timer reset</p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                        */
/* ------------------------------------------------------------------ */

function ProgressBar({
  remaining,
  total,
  status,
}: {
  remaining: number;
  total: number;
  status: string;
}) {
  const progress = Math.max(0, Math.min(1, remaining / total));
  const cfg = statusConfig[status] ?? statusConfig.active;

  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", cfg.barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function SwitchesPage() {
  const { switches, checkIn, cancelSwitch } = useSwitches();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [checkInToast, setCheckInToast] = useState<string | null>(null);

  const cancelTarget =
    cancelTargetId !== null
      ? switches.find((s) => s.id === cancelTargetId)
      : null;

  /* ---------- derived data ---------- */

  const filteredSwitches = useMemo(() => {
    let result = switches;

    // Status filter
    if (activeFilter !== "all") {
      result = result.filter((s) => s.status === activeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.beneficiaryName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [switches, activeFilter, searchQuery]);

  /* ---------- handlers ---------- */

  function handleCheckIn(id: number, title: string) {
    checkIn(id);
    setCheckInToast(title);
    setTimeout(() => setCheckInToast(null), 3000);
  }

  function handleCancelConfirm() {
    if (cancelTargetId === null) return;
    cancelSwitch(cancelTargetId);
    setCancelTargetId(null);
  }

  /* ---------- render ---------- */

  const hasAnySwitches = switches.length > 0;
  const hasFilteredResults = filteredSwitches.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ---- Header ---- */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              My Switches
            </h1>
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white">
              {switches.length}
            </span>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-solana-gradient text-white hover:opacity-90 transition-opacity self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Switch
          </Link>
        </motion.div>

        {/* ---- Filter / Sort Bar ---- */}
        {hasAnySwitches && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted mr-1" />
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setActiveFilter(opt.key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                    activeFilter === opt.key
                      ? "bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-lg shadow-[#9945FF]/20"
                      : "glass text-secondary hover:text-foreground hover:bg-white/[0.08]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or beneficiary..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/[0.06] text-foreground placeholder:text-muted focus:outline-none focus:border-[#9945FF]/40 focus:ring-1 focus:ring-[#9945FF]/20 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* ---- Switches List ---- */}
        {hasAnySwitches && hasFilteredResults && (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="popLayout">
              {filteredSwitches.map((sw) => {
                const cfg = statusConfig[sw.status] ?? statusConfig.active;
                return (
                  <motion.div
                    key={sw.id}
                    layout
                    variants={cardVariants}
                    exit={cardVariants.exit}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                    className={cn(
                      "p-6 rounded-2xl flex flex-col gap-5",
                      cfg.glowClass
                    )}
                  >
                    {/* Title + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold leading-tight">
                        {sw.title}
                      </h3>
                      <span
                        className={cn(
                          "shrink-0 px-3 py-1 rounded-full text-xs font-medium",
                          cfg.badgeClass
                        )}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted shrink-0" />
                        <span className="text-muted">Beneficiary:</span>
                        <span className="text-secondary truncate">
                          {sw.beneficiaryName}{" "}
                          <span className="text-muted">
                            ({shortenAddress(sw.beneficiaryAddress)})
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted shrink-0" />
                        <span className="text-muted">Amount:</span>
                        <span className="font-semibold text-foreground">
                          {sw.amountLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted shrink-0" />
                        <span className="text-muted">Trigger:</span>
                        <span className="text-secondary">
                          {sw.triggerCondition}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted shrink-0" />
                        <span className="text-muted">Last Check-in:</span>
                        <span className="text-secondary">{sw.lastCheckIn}</span>
                      </div>

                      <div className="flex items-center gap-2 sm:col-span-2">
                        <Calendar className="w-4 h-4 text-muted shrink-0" />
                        <span className="text-muted">Created:</span>
                        <span className="text-secondary">{sw.createdAt}</span>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={cn(
                            "font-medium",
                            sw.status === "critical"
                              ? "text-danger"
                              : sw.status === "warning"
                              ? "text-warning"
                              : "text-success"
                          )}
                        >
                          {formatCountdown(sw.daysRemaining)}
                        </span>
                        <span className="text-muted text-xs">
                          {sw.daysRemaining} / {sw.triggerDays} days
                        </span>
                      </div>
                      <ProgressBar
                        remaining={sw.daysRemaining}
                        total={sw.triggerDays}
                        status={sw.status}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleCheckIn(sw.id, sw.title)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-success/10 text-success hover:bg-success/20 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> Check In
                      </button>
                      <Link
                        href={`/switch/${sw.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] text-secondary hover:bg-white/[0.08] transition-colors"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </Link>
                      <button
                        onClick={() => setCancelTargetId(sw.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border border-danger/20 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ---- Empty State: No switches at all ---- */}
        {!hasAnySwitches && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-16 rounded-2xl text-center"
          >
            <Shield className="w-14 h-14 text-muted mx-auto mb-5" />
            <h3 className="text-xl font-semibold mb-2">No switches yet</h3>
            <p className="text-secondary text-sm mb-8 max-w-md mx-auto">
              Create your first Dead Man&apos;s Switch to protect your crypto
              assets and ensure they reach your beneficiaries.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-solana-gradient text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create Your First Switch
            </Link>
          </motion.div>
        )}

        {/* ---- Empty State: Filter returns nothing ---- */}
        {hasAnySwitches && !hasFilteredResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-12 rounded-2xl text-center"
          >
            <Search className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No switches match your filter
            </h3>
            <p className="text-secondary text-sm">
              Try adjusting your search or selecting a different status filter.
            </p>
          </motion.div>
        )}
      </div>

      {/* ---- Cancel Modal ---- */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            switchTitle={cancelTarget.title}
            onConfirm={handleCancelConfirm}
            onClose={() => setCancelTargetId(null)}
          />
        )}
      </AnimatePresence>

      {/* ---- Check-In Toast ---- */}
      <AnimatePresence>
        {checkInToast && <CheckInToast switchTitle={checkInToast} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
