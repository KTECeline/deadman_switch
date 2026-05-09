/**
 * x402 Oracle Server — Dead Man's Switch
 *
 * Implements the HTTP 402 Payment Required protocol for price data.
 * The agent pays a SOL micropayment per query; this server verifies
 * the on-chain tx and returns the price.
 *
 * Run: npx ts-node x402/server.ts
 *
 * x402 flow:
 *   1. Agent → GET /price/SOL-USD                (no payment)
 *   2. Server → 402 { paymentDetails }           (how much, where to pay)
 *   3. Agent → pays on-chain → gets tx sig
 *   4. Agent → GET /price/SOL-USD               (X-Payment: <sig>)
 *   5. Server → verifies tx → 200 { price }
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express, { Request, Response, NextFunction } from "express";
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";

const app = express();
app.use(express.json());

const PORT = process.env.ORACLE_PORT ?? 3001;
const connection = new Connection(
  process.env.HELIUS_RPC_URL ?? clusterApiUrl("devnet"),
  "confirmed"
);

// Oracle wallet — agents pay to this address
const ORACLE_ADDRESS = new PublicKey(
  process.env.ORACLE_ADDRESS ?? "E5VsbCN3PvqpP5bQWxXZP3skjenCrdh1exd2Tw5Qnufy"
);

// 1000 lamports = 0.000001 SOL per price query
const PRICE_PER_QUERY_LAMPORTS = 1000;

// Track processed tx sigs to prevent replay attacks
const usedSignatures = new Set<string>();

// ── Fetch price from Pyth Network ────────────────────────────────────────────
async function fetchPythPrice(symbol: string): Promise<number | null> {
  // Pyth price IDs for devnet
  const PRICE_IDS: Record<string, string> = {
    "SOL-USD": "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    "BTC-USD": "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
    "ETH-USD": "0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6",
  };

  const priceId = PRICE_IDS[symbol.toUpperCase()];
  if (!priceId) return null;

  try {
    const res = await fetch(
      `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceId}`
    );
    const data = await res.json() as any;
    const feed = data[0];
    if (!feed?.price?.price) return null;

    const price = parseFloat(feed.price.price) * Math.pow(10, feed.price.expo);
    return price;
  } catch {
    // Fallback mock price for devnet demo if Pyth is unavailable
    const MOCK_PRICES: Record<string, number> = {
      "SOL-USD": 145.72,
      "BTC-USD": 62500.0,
      "ETH-USD": 3200.0,
    };
    return MOCK_PRICES[symbol.toUpperCase()] ?? null;
  }
}

// ── x402 Payment Verification ────────────────────────────────────────────────
async function verifyPayment(txSignature: string): Promise<{ valid: boolean; reason?: string }> {
  if (usedSignatures.has(txSignature)) {
    return { valid: false, reason: "Signature already used (replay attack prevented)" };
  }

  try {
    const tx = await connection.getTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return { valid: false, reason: "Transaction not found" };
    if (tx.meta?.err) return { valid: false, reason: "Transaction failed" };

    // Check that at least PRICE_PER_QUERY_LAMPORTS was transferred to oracle
    const preBalances = tx.meta!.preBalances;
    const postBalances = tx.meta!.postBalances;
    const accountKeys = tx.transaction.message.staticAccountKeys ?? (tx.transaction.message as any).accountKeys;

    const oracleIndex = accountKeys.findIndex(
      (k: PublicKey) => k.toBase58() === ORACLE_ADDRESS.toBase58()
    );

    if (oracleIndex === -1) {
      return { valid: false, reason: "No payment to oracle address found" };
    }

    const received = postBalances[oracleIndex] - preBalances[oracleIndex];
    if (received < PRICE_PER_QUERY_LAMPORTS) {
      return { valid: false, reason: `Insufficient payment: got ${received}, need ${PRICE_PER_QUERY_LAMPORTS}` };
    }

    usedSignatures.add(txSignature);
    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `Verification error: ${err.message}` };
  }
}

// ── x402 Middleware ───────────────────────────────────────────────────────────
async function requirePayment(req: Request, res: Response, next: NextFunction) {
  const paymentHeader = req.headers["x-payment"] as string | undefined;

  if (!paymentHeader) {
    // Respond with 402 + payment instructions
    res.status(402).json({
      error: "Payment Required",
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: "solana-devnet",
          maxAmountRequired: PRICE_PER_QUERY_LAMPORTS.toString(),
          resource: req.path,
          description: `Pay ${PRICE_PER_QUERY_LAMPORTS} lamports for one price query`,
          mimeType: "application/json",
          payTo: ORACLE_ADDRESS.toBase58(),
          asset: "SOL",
        },
      ],
    });
    return;
  }

  const { txSignature } = JSON.parse(paymentHeader);
  const result = await verifyPayment(txSignature);

  if (!result.valid) {
    res.status(402).json({ error: "Invalid payment", reason: result.reason });
    return;
  }

  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/price/:symbol", requirePayment, async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  const price = await fetchPythPrice(symbol);

  if (!price) {
    res.status(404).json({ error: `Unknown symbol: ${symbol}` });
    return;
  }

  const txSig = JSON.parse(req.headers["x-payment"] as string).txSignature;
  console.log(`[oracle] Served ${symbol} price $${price.toFixed(4)} — paid via tx ${txSig.slice(0, 16)}...`);

  res.json({
    symbol,
    price,
    timestamp: Date.now(),
    source: "pyth-network",
    paidWith: txSig,
    costLamports: PRICE_PER_QUERY_LAMPORTS,
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", oracleAddress: ORACLE_ADDRESS.toBase58() });
});

app.listen(PORT, () => {
  console.log(`\n🔮 x402 Oracle Server running on port ${PORT}`);
  console.log(`   Oracle address (pay to): ${ORACLE_ADDRESS.toBase58()}`);
  console.log(`   Price per query: ${PRICE_PER_QUERY_LAMPORTS} lamports`);
  console.log(`   Try: curl http://localhost:${PORT}/price/SOL-USD\n`);
});
