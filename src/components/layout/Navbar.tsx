"use client";

import { useState, useRef, useEffect } from "react";
import { cn, shortenAddress } from "@/lib/utils";
import { Menu, Copy, Check, ExternalLink, LogOut, Send, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSwitches } from "@/lib/switches-store";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface NavbarProps {
  onToggleSidebar?: () => void;
  className?: string;
}

export default function Navbar({ onToggleSidebar, className }: NavbarProps) {
  const { telegramConnected, connectTelegram, disconnectTelegram } = useSwitches();
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  const [copied, setCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [telegramToast, setTelegramToast] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const walletAddress = publicKey?.toBase58() ?? "";
  const shortAddress = walletAddress ? shortenAddress(walletAddress, 4) : "";

  // Fetch SOL balance
  useEffect(() => {
    if (!publicKey || !connection) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    connection.getBalance(publicKey).then((lamports) => {
      if (!cancelled) setBalance(lamports / LAMPORTS_PER_SOL);
    }).catch(() => {
      if (!cancelled) setBalance(null);
    });
    return () => { cancelled = true; };
  }, [publicKey, connection]);

  function handleCopyAddress() {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16",
        "glass border-b border-white/[0.06]",
        "flex items-center justify-between px-4 md:px-6",
        className
      )}
    >
      {/* Left: menu toggle + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="inline-flex items-center justify-center rounded-lg p-2 text-secondary hover:text-foreground hover:bg-white/[0.06] transition-colors md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="text-gradient text-lg font-bold tracking-tight select-none">
          Dead Man&apos;s Switch
        </Link>
      </div>

      {/* Right: wallet info */}
      <div className="flex items-center gap-3">
        {/* Connect Telegram */}
        <button
          onClick={() => {
            if (telegramConnected) {
              disconnectTelegram();
            } else {
              connectTelegram();
              setTelegramToast(true);
              setTimeout(() => setTelegramToast(false), 3000);
            }
          }}
          className={cn(
            "hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            telegramConnected
              ? "bg-success/10 text-success border border-success/20 cursor-pointer"
              : "border border-white/[0.12] text-secondary hover:text-white hover:border-white/[0.25] cursor-pointer"
          )}
          title={telegramConnected ? "Click to disconnect Telegram" : "Connect Telegram for notifications"}
        >
          {telegramConnected ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          {telegramConnected ? "Connected" : "Telegram"}
        </button>

        {/* Devnet badge */}
        <span className="hidden sm:inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent cursor-default" title="Connected to Solana Devnet">
          Devnet
        </span>

        {connected && walletAddress ? (
          <>
            {/* SOL balance */}
            <span className="hidden sm:block text-sm font-medium text-secondary cursor-default" title="Wallet balance">
              {balance !== null ? `${balance.toFixed(2)} SOL` : "-- SOL"}
            </span>

            {/* Wallet address — clickable to copy */}
            <button
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-1.5 text-sm font-mono text-muted hover:text-white transition-colors rounded-lg px-2 py-1 hover:bg-white/[0.04]"
              title="Click to copy wallet address"
            >
              <span>{shortAddress}</span>
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                    <Check className="h-3.5 w-3.5 text-success" />
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                    <Copy className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Avatar — profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="h-8 w-8 rounded-full bg-solana-gradient shrink-0 cursor-pointer hover:ring-2 hover:ring-accent/40 transition-all"
                aria-label="Profile menu"
              />

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-56 bg-[#141821] rounded-xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden"
                  >
                    {/* Wallet info header */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-xs text-muted">Connected Wallet</p>
                      <p className="text-sm font-mono text-white mt-0.5 truncate">{walletAddress.slice(0, 12)}...{walletAddress.slice(-6)}</p>
                      <p className="text-xs text-success mt-1">{balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => { handleCopyAddress(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Address
                      </button>

                      <a
                        href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Explorer
                      </a>
                    </div>

                    {/* Disconnect */}
                    <div className="border-t border-white/[0.06] py-1">
                      <button
                        onClick={() => { disconnect(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect Wallet
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Connect Wallet button */
          <button
            onClick={() => setVisible(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-solana-gradient text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        )}
      </div>

      {/* Telegram toast */}
      <AnimatePresence>
        {telegramToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-[#141821] border border-success/20 shadow-2xl shadow-black/50 px-5 py-3 rounded-xl flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm font-medium text-white">Telegram Connected</p>
              <p className="text-xs text-secondary">You&apos;ll receive warnings before your switch executes.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
