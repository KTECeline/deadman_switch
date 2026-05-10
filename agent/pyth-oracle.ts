/**
 * Pyth price oracle — fetches prices through the x402 oracle server.
 * The agent autonomously pays per query from its own wallet.
 */
import { Keypair } from "@solana/web3.js";
import { fetchWithPayment } from "./x402-client";

const ORACLE_URL = process.env.ORACLE_URL ?? "http://localhost:3001";

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
  paidWith: string;
  costLamports: number;
}

export async function fetchPrice(symbol: string, agentKeypair: Keypair): Promise<PriceData> {
  return fetchWithPayment<PriceData>(
    `${ORACLE_URL}/price/${symbol}`,
    agentKeypair
  );
}
