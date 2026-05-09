"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Coins,
  Clock,
  CalendarDays,
  Activity,
  CheckCircle2,
  Pencil,
  XCircle,
  X,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import GlassCard from "@/components/ui/GlassCard";
import CheckInButton from "@/components/ui/CheckInButton";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { cn } from "@/lib/utils";
import { useSwitches } from "@/lib/switches-store";
import type { SwitchUpdate } from "@/lib/switches-store";

/* ─── Animation helpers ──────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Timeline item with scroll-triggered animation ─────── */

function TimelineItem({
  item,
  index,
  isLast,
}: {
  item: { label: string; detail: string; completed: boolean };
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.45 }}
      className="relative flex gap-4"
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "mt-1 h-3 w-3 rounded-full border-2 shrink-0",
            item.completed
              ? "bg-success border-success shadow-[0_0_8px_rgba(20,241,149,0.4)]"
              : "bg-transparent border-muted/40"
          )}
        />
        {!isLast && (
          <div
            className={cn(
              "w-px flex-1 min-h-[32px]",
              item.completed ? "bg-success/30" : "bg-white/[0.06]"
            )}
          />
        )}
      </div>
      <div className="pb-6">
        <p className={cn("text-sm font-medium", item.completed ? "text-foreground" : "text-muted")}>
          {item.label}
        </p>
        <p className="text-xs text-muted mt-0.5">{item.detail}</p>
      </div>
    </motion.div>
  );
}

/* ─── Page Component ─────────────────────────────────────── */

export default function SwitchDetailsPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { getSwitch, checkIn, cancelSwitch, updateSwitch } = useSwitches();
  const switchData = getSwitch(id);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!switchData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <h1 className="text-2xl font-bold">Switch Not Found</h1>
          <p className="text-secondary">This switch may have been cancelled.</p>
          <Link href="/dashboard" className="text-accent hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mx-auto max-w-5xl space-y-8"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold sm:text-2xl">{switchData.title}</h1>
          <StatusBadge status={switchData.status} />
        </motion.div>

        {/* ── Top Row ─────────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div variants={fadeUp} custom={1}>
            <GlassCard className="flex items-center justify-center py-10">
              <CountdownTimer
                totalDays={switchData.triggerDays}
                remainingDays={switchData.daysRemaining}
                className="h-56 w-56 sm:h-64 sm:w-64"
              />
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} custom={2}>
            <GlassCard className="space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Switch Details
              </h2>
              <div className="space-y-4">
                <DetailRow
                  icon={<User className="h-4 w-4" />}
                  label="Beneficiary"
                  value={`${switchData.beneficiaryName} (${switchData.beneficiaryShort})`}
                />
                <DetailRow
                  icon={<Coins className="h-4 w-4" />}
                  label="Amount"
                  value={`${switchData.amount} SOL`}
                  highlight
                />
                <DetailRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Trigger"
                  value={`${switchData.triggerDays} Days Inactive`}
                />
                <DetailRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Created"
                  value={switchData.createdAt}
                />
                <DetailRow
                  icon={<Activity className="h-4 w-4" />}
                  label="Last Check-in"
                  value={switchData.lastCheckIn}
                />
              </div>
              <CheckInButton className="w-full mt-2" onClick={() => checkIn(id)} />
            </GlassCard>
          </motion.div>
        </div>

        {/* ── Timeline ────────────────────────────────────── */}
        <motion.div variants={fadeUp} custom={3}>
          <GlassCard>
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted">
              Timeline
            </h2>
            <div>
              {switchData.timeline.map((item, i) => (
                <TimelineItem
                  key={`${item.label}-${i}`}
                  item={item}
                  index={i}
                  isLast={i === switchData.timeline.length - 1}
                />
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Activity Feed ───────────────────────────────── */}
        <motion.div variants={fadeUp} custom={4}>
          <GlassCard>
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted">
              Recent Activity
            </h2>
            <ul className="space-y-4">
              {switchData.activity.map((item, i) => (
                <motion.li key={i} variants={fadeUp} custom={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success/70" />
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-secondary">{item.text}</span>
                    <span className="shrink-0 text-xs text-muted">{item.time}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>

        {/* ── Action Buttons ──────────────────────────────── */}
        <motion.div variants={fadeUp} custom={5} className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => checkIn(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold",
              "bg-success/10 text-success border border-success/20",
              "shadow-[0_0_20px_rgba(20,241,149,0.15)]",
              "hover:shadow-[0_0_30px_rgba(20,241,149,0.25)]",
              "transition-shadow duration-300"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Check In
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setEditOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold",
              "bg-transparent text-secondary border border-white/[0.12]",
              "hover:border-white/[0.25] hover:text-foreground",
              "transition-all duration-300"
            )}
          >
            <Pencil className="h-4 w-4" />
            Edit Switch
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCancelOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold",
              "bg-transparent text-danger border border-danger/20",
              "hover:border-danger/40 hover:bg-danger/5",
              "transition-all duration-300"
            )}
          >
            <XCircle className="h-4 w-4" />
            Cancel Switch
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ── Edit Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {editOpen && switchData && (
          <EditSwitchModal
            switchData={switchData}
            onSave={(updates) => {
              updateSwitch(id, updates);
              setEditOpen(false);
            }}
            onClose={() => setEditOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Cancel Modal ────────────────────────────────── */}
      <AnimatePresence>
        {cancelOpen && (
          <CancelSwitchModal
            switchTitle={switchData.title}
            onConfirm={() => {
              cancelSwitch(id);
              router.push("/switches");
            }}
            onClose={() => setCancelOpen(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

/* ─── Edit Switch Modal ─────────────────────────────────── */

function EditSwitchModal({
  switchData,
  onSave,
  onClose,
}: {
  switchData: { title: string; beneficiaryName: string; beneficiaryAddress: string; amount: number; triggerDays: number };
  onSave: (updates: SwitchUpdate) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(switchData.title);
  const [beneficiaryName, setBeneficiaryName] = useState(switchData.beneficiaryName);
  const [beneficiaryAddress, setBeneficiaryAddress] = useState(switchData.beneficiaryAddress);
  const [amount, setAmount] = useState(String(switchData.amount));
  const [triggerDays, setTriggerDays] = useState(String(switchData.triggerDays));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title,
      beneficiaryName,
      beneficiaryAddress,
      amount: parseFloat(amount) || switchData.amount,
      triggerDays: parseInt(triggerDays) || switchData.triggerDays,
    });
  }

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
        className="glass p-6 rounded-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-accent" />
            Edit Switch
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/[0.06] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Switch Name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          {/* Beneficiary Name */}
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Beneficiary Name</label>
            <input
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          {/* Beneficiary Address */}
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Wallet Address</label>
            <input
              value={beneficiaryAddress}
              onChange={(e) => setBeneficiaryAddress(e.target.value)}
              className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm font-mono focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          {/* Amount + Trigger in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Amount (SOL)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Trigger (Days)</label>
              <input
                type="number"
                min="1"
                value={triggerDays}
                onChange={(e) => setTriggerDays(e.target.value)}
                className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.06] text-secondary hover:bg-white/[0.1] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-solana-gradient text-white hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Cancel Switch Modal ──────────────────────────────────── */

function CancelSwitchModal({
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
          <XCircle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Cancel Switch</h3>
        </div>
        <p className="text-secondary text-sm">
          Are you sure you want to cancel <span className="text-foreground font-medium">&quot;{switchTitle}&quot;</span>? This will deactivate the switch and return funds to your wallet.
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.06] text-secondary hover:bg-white/[0.1] transition-colors">
            Keep Active
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors">
            Cancel Switch
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Detail Row helper ──────────────────────────────────── */

function DetailRow({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted">
        {icon}
        {label}
      </span>
      <span className={cn("text-sm font-medium", highlight ? "text-gradient" : "text-secondary")}>
        {value}
      </span>
    </div>
  );
}
