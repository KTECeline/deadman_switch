"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ToggleRight,
  Users,
  Activity,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Create Switch", icon: ToggleRight, href: "/create" },
  { label: "My Switches", icon: Users, href: "/switches" },
];

export default function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const resolvedPath = pathname.startsWith("/switch/") ? "/switches" : pathname;
  const activeItem = navItems.find((item) => resolvedPath === item.href || (item.href !== "/" && resolvedPath.startsWith(item.href + "/")))?.href ?? "/dashboard";

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel - always visible on md+, animated on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-[240px]",
              "glass border-r border-white/[0.06] rounded-none",
              "flex flex-col py-6 md:hidden",
              className
            )}
          >
            <SidebarContent activeItem={activeItem} onSelect={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - always visible */}
      <aside
        className={cn(
          "hidden md:flex fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-[240px]",
          "glass border-r border-white/[0.06] rounded-none",
          "flex-col py-6",
          className
        )}
      >
        <SidebarContent activeItem={activeItem} onSelect={() => {}} />
      </aside>
    </>
  );
}

function SidebarContent({
  activeItem,
  onSelect,
}: {
  activeItem: string;
  onSelect: (href: string) => void;
}) {
  return (
    <nav className="relative flex flex-col gap-1 px-3">
      {/* Active gradient left border — rendered once, animates between items */}
      {navItems.map((item) => {
        if (activeItem !== item.href) return null;
        return (
          <motion.span
            key="sidebar-indicator"
            layoutId="sidebar-active"
            className="absolute left-0 w-[3px] h-8 rounded-r-full bg-solana-gradient"
            style={{
              top: navItems.findIndex((n) => n.href === activeItem) * (40 + 4) + (40 - 32) / 2,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        );
      })}

      {navItems.map((item) => {
        const isActive = activeItem === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onSelect(item.href)}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
              "transition-colors duration-200",
              isActive
                ? "text-foreground bg-white/[0.06]"
                : "text-secondary hover:text-foreground hover:bg-white/[0.04]"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
