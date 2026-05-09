"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getTelegramBotUrl } from "@/lib/telegram";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type SwitchStatus = "active" | "warning" | "critical" | "executed";

export interface SwitchData {
  id: number;
  title: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  beneficiaryShort: string;
  amount: number;
  amountLabel: string;
  triggerCondition: string;
  triggerDays: number;
  status: SwitchStatus;
  daysRemaining: number;
  lastCheckIn: string;
  createdAt: string;
  timeline: { label: string; detail: string; completed: boolean }[];
  activity: { text: string; time: string }[];
}

export interface ActivityItem {
  text: string;
  time: string;
  icon: "check" | "plus" | "edit" | "cancel";
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Initial data                                                        */
/* ------------------------------------------------------------------ */

const initialSwitches: SwitchData[] = [
  {
    id: 1,
    title: "Emergency Family Transfer",
    beneficiaryName: "Sarah",
    beneficiaryAddress: "8xA9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx92KL",
    beneficiaryShort: "8xA9...92KL",
    amount: 5,
    amountLabel: "5 SOL",
    triggerCondition: "90 days of inactivity",
    triggerDays: 90,
    status: "active",
    daysRemaining: 72,
    lastCheckIn: "2 hours ago",
    createdAt: "March 15, 2025",
    timeline: [
      { label: "Switch Created", detail: "March 15, 2025", completed: true },
      { label: "Vault Funded", detail: "5 SOL deposited", completed: true },
      { label: "Check-in", detail: "2 hours ago", completed: true },
      { label: "Check-in", detail: "3 days ago", completed: true },
      { label: "Trigger", detail: "In 72 days", completed: false },
      { label: "Execution", detail: "Pending", completed: false },
    ],
    activity: [
      { text: "Checked in successfully", time: "2 hours ago" },
      { text: "Checked in successfully", time: "3 days ago" },
      { text: "Beneficiary wallet verified", time: "5 days ago" },
      { text: "Vault funded with 5 SOL", time: "March 15, 2025" },
      { text: "Switch created", time: "March 15, 2025" },
    ],
  },
  {
    id: 2,
    title: "Monthly Backup",
    beneficiaryName: "Alex",
    beneficiaryAddress: "3kP7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxmN4x",
    beneficiaryShort: "3kP7...mN4x",
    amount: 2,
    amountLabel: "2 SOL",
    triggerCondition: "30 days of inactivity",
    triggerDays: 30,
    status: "warning",
    daysRemaining: 8,
    lastCheckIn: "22 days ago",
    createdAt: "April 2, 2025",
    timeline: [
      { label: "Switch Created", detail: "April 2, 2025", completed: true },
      { label: "Vault Funded", detail: "2 SOL deposited", completed: true },
      { label: "Check-in", detail: "22 days ago", completed: true },
      { label: "Trigger", detail: "In 8 days", completed: false },
      { label: "Execution", detail: "Pending", completed: false },
    ],
    activity: [
      { text: "Checked in successfully", time: "22 days ago" },
      { text: "Vault funded with 2 SOL", time: "April 2, 2025" },
      { text: "Switch created", time: "April 2, 2025" },
    ],
  },
  {
    id: 3,
    title: "Long-term Storage",
    beneficiaryName: "Mom",
    beneficiaryAddress: "9fR2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxpQ8w",
    beneficiaryShort: "9fR2...pQ8w",
    amount: 5.5,
    amountLabel: "5.5 SOL",
    triggerCondition: "180 days of inactivity",
    triggerDays: 180,
    status: "active",
    daysRemaining: 156,
    lastCheckIn: "24 days ago",
    createdAt: "February 10, 2025",
    timeline: [
      { label: "Switch Created", detail: "February 10, 2025", completed: true },
      { label: "Vault Funded", detail: "5.5 SOL deposited", completed: true },
      { label: "Check-in", detail: "24 days ago", completed: true },
      { label: "Trigger", detail: "In 156 days", completed: false },
      { label: "Execution", detail: "Pending", completed: false },
    ],
    activity: [
      { text: "Checked in successfully", time: "24 days ago" },
      { text: "Beneficiary wallet verified", time: "February 12, 2025" },
      { text: "Vault funded with 5.5 SOL", time: "February 10, 2025" },
      { text: "Switch created", time: "February 10, 2025" },
    ],
  },
];

const initialGlobalActivity: ActivityItem[] = [
  { text: "Checked in successfully", time: "2 hours ago", icon: "check", color: "text-success" },
  { text: "Vault funded with 2 SOL", time: "1 day ago", icon: "plus", color: "text-accent" },
  { text: "Beneficiary updated for Monthly Backup", time: "3 days ago", icon: "edit", color: "text-blue-400" },
  { text: "Emergency Family Transfer created", time: "5 days ago", icon: "plus", color: "text-success" },
];

/* ------------------------------------------------------------------ */
/*  Context                                                             */
/* ------------------------------------------------------------------ */

export interface SwitchUpdate {
  title?: string;
  beneficiaryName?: string;
  beneficiaryAddress?: string;
  amount?: number;
  triggerDays?: number;
}

export interface NewSwitchInput {
  title: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  amount: number;
  triggerDays: number;
  telegramHandle?: string;
}

interface SwitchesContextValue {
  switches: SwitchData[];
  globalActivity: ActivityItem[];
  telegramConnected: boolean;
  connectTelegram: () => void;
  disconnectTelegram: () => void;
  checkIn: (id: number) => void;
  cancelSwitch: (id: number) => void;
  getSwitch: (id: number) => SwitchData | undefined;
  updateSwitch: (id: number, updates: SwitchUpdate) => void;
  addSwitch: (input: NewSwitchInput) => void;
}

const SwitchesContext = createContext<SwitchesContextValue | null>(null);

export function useSwitches() {
  const ctx = useContext(SwitchesContext);
  if (!ctx) throw new Error("useSwitches must be used within SwitchesProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export function SwitchesProvider({ children }: { children: ReactNode }) {
  const [switches, setSwitches] = useState<SwitchData[]>(initialSwitches);
  const [globalActivity, setGlobalActivity] = useState<ActivityItem[]>(initialGlobalActivity);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const connectTelegram = useCallback(() => {
    window.open(getTelegramBotUrl(), "_blank");
    setTelegramConnected(true);
  }, []);
  const disconnectTelegram = useCallback(() => setTelegramConnected(false), []);

  const checkIn = useCallback((id: number) => {
    setSwitches((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newTimeline = [
          ...s.timeline.filter((t) => t.completed),
          { label: "Check-in", detail: "Just now", completed: true },
          ...s.timeline.filter((t) => !t.completed).map((t) =>
            t.label === "Trigger"
              ? { ...t, detail: `In ${s.triggerDays} days` }
              : t
          ),
        ];
        return {
          ...s,
          daysRemaining: s.triggerDays,
          status: "active" as SwitchStatus,
          lastCheckIn: "Just now",
          timeline: newTimeline,
          activity: [
            { text: "Checked in successfully", time: "Just now" },
            ...s.activity,
          ],
        };
      })
    );
    const sw = switches.find((s) => s.id === id);
    if (sw) {
      setGlobalActivity((prev) => [
        { text: `Checked in for ${sw.title}`, time: "Just now", icon: "check", color: "text-success" },
        ...prev,
      ]);
    }
  }, [switches]);

  const cancelSwitch = useCallback((id: number) => {
    const sw = switches.find((s) => s.id === id);
    setSwitches((prev) => prev.filter((s) => s.id !== id));
    if (sw) {
      setGlobalActivity((prev) => [
        { text: `${sw.title} cancelled`, time: "Just now", icon: "cancel", color: "text-danger" },
        ...prev,
      ]);
    }
  }, [switches]);

  const getSwitch = useCallback(
    (id: number) => switches.find((s) => s.id === id),
    [switches]
  );

  const updateSwitch = useCallback((id: number, updates: SwitchUpdate) => {
    setSwitches((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s };
        if (updates.title !== undefined) updated.title = updates.title;
        if (updates.beneficiaryName !== undefined) {
          updated.beneficiaryName = updates.beneficiaryName;
        }
        if (updates.beneficiaryAddress !== undefined) {
          updated.beneficiaryAddress = updates.beneficiaryAddress;
          updated.beneficiaryShort = `${updates.beneficiaryAddress.slice(0, 4)}...${updates.beneficiaryAddress.slice(-4)}`;
        }
        if (updates.amount !== undefined) {
          updated.amount = updates.amount;
          updated.amountLabel = `${updates.amount} SOL`;
        }
        if (updates.triggerDays !== undefined) {
          updated.triggerDays = updates.triggerDays;
          updated.triggerCondition = `${updates.triggerDays} days of inactivity`;
          updated.daysRemaining = updates.triggerDays;
          updated.status = "active";
        }
        updated.activity = [
          { text: "Switch settings updated", time: "Just now" },
          ...updated.activity,
        ];
        return updated;
      })
    );
    const sw = switches.find((s) => s.id === id);
    if (sw) {
      setGlobalActivity((prev) => [
        { text: `${sw.title} updated`, time: "Just now", icon: "edit", color: "text-blue-400" },
        ...prev,
      ]);
    }
  }, [switches]);

  const addSwitch = useCallback((input: NewSwitchInput) => {
    const newId = Math.max(0, ...switches.map((s) => s.id)) + 1;
    const short = `${input.beneficiaryAddress.slice(0, 4)}...${input.beneficiaryAddress.slice(-4)}`;
    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const newSwitch: SwitchData = {
      id: newId,
      title: input.title,
      beneficiaryName: input.beneficiaryName || "Unknown",
      beneficiaryAddress: input.beneficiaryAddress,
      beneficiaryShort: short,
      amount: input.amount,
      amountLabel: `${input.amount} SOL`,
      triggerCondition: `${input.triggerDays} days of inactivity`,
      triggerDays: input.triggerDays,
      status: "active",
      daysRemaining: input.triggerDays,
      lastCheckIn: "Just now",
      createdAt: now,
      timeline: [
        { label: "Switch Created", detail: now, completed: true },
        { label: "Vault Funded", detail: `${input.amount} SOL deposited`, completed: true },
        { label: "Trigger", detail: `In ${input.triggerDays} days`, completed: false },
        { label: "Execution", detail: "Pending", completed: false },
      ],
      activity: [
        { text: "Vault funded", time: "Just now" },
        { text: "Switch created", time: "Just now" },
      ],
    };
    setSwitches((prev) => [newSwitch, ...prev]);
    setGlobalActivity((prev) => [
      { text: `${input.title} created`, time: "Just now", icon: "plus", color: "text-success" },
      ...prev,
    ]);
  }, [switches]);

  return (
    <SwitchesContext.Provider value={{ switches, globalActivity, telegramConnected, connectTelegram, disconnectTelegram, checkIn, cancelSwitch, getSwitch, updateSwitch, addSwitch }}>
      {children}
    </SwitchesContext.Provider>
  );
}
