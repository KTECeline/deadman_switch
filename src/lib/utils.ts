import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatCountdown(days: number): string {
  if (days <= 0) return "Triggered";
  if (days === 1) return "1 Day Left";
  return `${days} Days Left`;
}
