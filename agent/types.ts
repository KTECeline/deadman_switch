import { PublicKey } from "@solana/web3.js";

export interface SwitchAccount {
  publicKey: PublicKey;
  owner: PublicKey;
  beneficiary: PublicKey;
  checkInInterval: number;  // seconds
  lastCheckIn: number;      // unix timestamp
  lockedAmount: bigint;     // lamports
  switchId: bigint;
  watcher: PublicKey;
  cnftAssetId: PublicKey;
  lastActivityType: string;
}
