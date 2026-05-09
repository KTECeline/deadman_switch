"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  Pencil,
  XCircle,
  AlertTriangle,
  User,
  Coins,
  Clock,
  CalendarDays,
  Send,
  FileText,
  Bot,
  ExternalLink,
  Copy,
  Check,
  Plus,
  X,
  Save,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn, shortenAddress, formatCountdown } from "@/lib/utils";
import { useSwitches } from "@/lib/switches-store";
import type { SwitchUpdate } from "@/lib/switches-store";

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Countdown Ring                                                     */
/* ------------------------------------------------------------------ */

function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const size = 200;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / total;
  const offset = circumference * (1 - progress);

  let color = "#14F195";
  if (remaining <= 7) color = "#FF5C7A";
  else if (remaining <= 30) color = "#F6C344";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-white/5" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-bold text-white">{remaining}</span>
        <span className="text-sm text-muted mt-1">days remaining</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Agent Activity Log                                                 */
/* ------------------------------------------------------------------ */

const baseAgentActivity = [
  { text: "Agent monitoring started", time: "March 15, 2025 09:00", dot: "bg-success" },
  { text: "Heartbeat detected \u2014 wallet active", time: "2 days ago", dot: "bg-success" },
  { text: "No activity detected \u2014 monitoring continues", time: "Just now", dot: "bg-muted" },
];

function buildAgentActivity(switchActivity: { text: string; time: string }[]) {
  const mapped = switchActivity.map((a) => {
    if (a.text.toLowerCase().includes("check")) return { text: "Check-in recorded on-chain", time: a.time, dot: "bg-success" };
    if (a.text.toLowerCase().includes("update")) return { text: "Switch settings updated on-chain", time: a.time, dot: "bg-accent" };
    if (a.text.toLowerCase().includes("funded")) return { text: "Vault funded \u2014 assets locked", time: a.time, dot: "bg-success" };
    if (a.text.toLowerCase().includes("created")) return { text: "Switch created \u2014 agent deployed", time: a.time, dot: "bg-success" };
    return { text: a.text, time: a.time, dot: "bg-muted" };
  });
  return [...mapped, ...baseAgentActivity];
}

/* ------------------------------------------------------------------ */
/*  Edit Modal                                                         */
/* ------------------------------------------------------------------ */

function EditModal({
  sw,
  onSave,
  onClose,
}: {
  sw: { title: string; beneficiaryName: string; beneficiaryAddress: string; amount: number; triggerDays: number };
  onSave: (u: SwitchUpdate) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(sw.title);
  const [name, setName] = useState(sw.beneficiaryName);
  const [addr, setAddr] = useState(sw.beneficiaryAddress);
  const [amt, setAmt] = useState(String(sw.amount));
  const [days, setDays] = useState(String(sw.triggerDays));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="glass p-6 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Pencil className="w-5 h-5 text-accent" />Edit Switch</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/[0.06] transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ title, beneficiaryName: name, beneficiaryAddress: addr, amount: parseFloat(amt) || sw.amount, triggerDays: parseInt(days) || sw.triggerDays }); }} className="space-y-4">
          <div><label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Switch Name</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors" /></div>
          <div><label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Beneficiary Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors" /></div>
          <div><label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Wallet Address</label>
            <input value={addr} onChange={(e) => setAddr(e.target.value)} className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm font-mono focus:outline-none focus:border-accent/40 transition-colors" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Amount (SOL)</label>
              <input type="number" step="0.1" min="0" value={amt} onChange={(e) => setAmt(e.target.value)} className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
            <div><label className="text-xs text-muted uppercase tracking-wider font-medium mb-1.5 block">Trigger (Days)</label>
              <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className="w-full glass px-4 py-2.5 rounded-xl bg-transparent text-white text-sm focus:outline-none focus:border-accent/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.06] text-secondary hover:bg-white/[0.1] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-solana-gradient text-white hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"><Save className="w-4 h-4" />Save</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cancel Modal                                                       */
/* ------------------------------------------------------------------ */

function CancelModal({ title, onConfirm, onClose }: { title: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="glass p-6 rounded-2xl max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 text-danger"><AlertTriangle className="w-6 h-6" /><h3 className="text-lg font-semibold">Cancel &amp; Withdraw</h3></div>
        <p className="text-secondary text-sm">Are you sure you want to cancel <span className="text-foreground font-medium">&quot;{title}&quot;</span>? Funds will be returned to your wallet.</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.06] text-secondary hover:bg-white/[0.1] transition-colors">Keep Active</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors">Cancel Switch</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Check-In Toast                                                     */
/* ------------------------------------------------------------------ */

function Toast({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 right-6 z-50 glass-glow-green px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl">
      <CheckCircle className="w-5 h-5 text-success" />
      <p className="text-sm font-medium text-foreground">{message}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { switches, checkIn, cancelSwitch, updateSwitch } = useSwitches();
  const sw = switches[0] ?? null;

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCheckIn() {
    if (!sw) return;
    checkIn(sw.id);
    setToast("Checked in successfully \u2014 timer reset");
    setTimeout(() => setToast(null), 3000);
  }

  function handleCancel() {
    if (!sw) return;
    cancelSwitch(sw.id);
    setCancelOpen(false);
  }

  function handleCopyToken() {
    navigator.clipboard.writeText("DMS7xK9f3Rq2nXm5Yp9wKv3bFd6hTc1eAo8kPm");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ---- Empty State ---- */
  if (!sw) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Shield className="w-16 h-16 text-muted mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">No Active Switch</h1>
            <p className="text-secondary mb-8 max-w-sm mx-auto">Create your first dead man&apos;s switch to protect your assets.</p>
            <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-solana-gradient text-white font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />Create Switch
            </Link>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8 max-w-5xl mx-auto">

        {/* ---- Your Switches (latest 3) ---- */}
        {switches.length > 0 && (
          <motion.div variants={fadeUp} custom={3.5}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Your Switches</h3>
              <Link href="/switches" className="text-sm text-accent hover:text-accent-cyan transition-colors inline-flex items-center gap-1">
                View More <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {switches.slice(0, 3).map((s) => {
                const isWarn = s.status === "warning" || s.daysRemaining <= 30;
                return (
                  <Link key={s.id} href={`/switch/${s.id}`}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className={cn("p-5 rounded-2xl cursor-pointer transition-all", isWarn ? "glass-glow-yellow" : "glass-glow-green")}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="font-semibold text-sm leading-tight">{s.title}</h4>
                        <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          isWarn ? "bg-warning/10 text-warning border border-warning/20" : "bg-success/10 text-success border border-success/20"
                        )}>
                          {isWarn ? "Warning" : "Active"}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs text-secondary">
                        <p><span className="text-muted">To:</span> {s.beneficiaryName} ({s.beneficiaryShort})</p>
                        <p><span className="text-muted">Amount:</span> <span className="text-white font-medium">{s.amountLabel}</span></p>
                      </div>
                      <p className={cn("text-xs font-medium mt-3", isWarn ? "text-warning" : "text-success")}>
                        {formatCountdown(s.daysRemaining)}
                      </p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ---- cNFT Instruction Card ---- */}
        <motion.div variants={fadeUp} custom={4} className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Your Instruction Scroll</h3>
          </div>
          <p className="text-sm text-secondary mb-5">A compressed NFT recording your switch instructions, stored on-chain.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-white/[0.02] rounded-xl p-3">
              <p className="text-xs text-muted mb-1">Token ID</p>
              <p className="text-sm font-mono text-white truncate">DMS7xK9f...8kPm</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-3">
              <p className="text-xs text-muted mb-1">Created</p>
              <p className="text-sm text-white">{sw.createdAt}</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-3">
              <p className="text-xs text-muted mb-1">Status</p>
              <p className="text-sm text-success font-medium">Minted</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="https://explorer.solana.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-white transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />View on Explorer
            </a>
            <button onClick={handleCopyToken} className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-white transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Token ID"}
            </button>
          </div>
        </motion.div>

        {/* ---- Agent Activity Log ---- */}
        <motion.div variants={fadeUp} custom={5} className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Bot className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Agent Activity</h3>
          </div>
          <ul className="space-y-4">
            {buildAgentActivity(sw.activity).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", item.dot)} />
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="text-secondary">{item.text}</span>
                  <span className="shrink-0 text-xs text-muted">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Activity is pulled from Solana memo program transactions.</p>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {editOpen && sw && <EditModal sw={sw} onSave={(u) => { updateSwitch(sw.id, u); setEditOpen(false); }} onClose={() => setEditOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {cancelOpen && sw && <CancelModal title={sw.title} onConfirm={handleCancel} onClose={() => setCancelOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <Toast message={toast} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}

/* ---- Detail Row ---- */

function DetailRow({ icon, label, value, highlight, extra }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean; extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted">{icon}{label}</span>
      <span className={cn("text-sm font-medium inline-flex items-center", highlight ? "text-gradient" : "text-secondary")}>
        {value}{extra}
      </span>
    </div>
  );
}
