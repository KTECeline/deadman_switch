/**
 * x402 HTTP client — handles the full 402 → pay → retry flow.
 *
 * Usage:
 *   const data = await fetchWithPayment("http://localhost:3001/price/SOL-USD", keypair);
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { agentTxCache, setAgentBusy } from "./agent-tx-cache";

export interface X402PaymentLog {
  url: string;
  txSignature: string;
  amountLamports: number;
  payTo: string;
  timestamp: number;
}

// In-memory log — Phase 5 frontend can read this
export const paymentLogs: X402PaymentLog[] = [];

export async function fetchWithPayment<T>(
  url: string,
  agentKeypair: Keypair
): Promise<T> {
  const connection = new Connection(
    process.env.HELIUS_RPC_URL ?? clusterApiUrl("devnet"),
    "confirmed"
  );

  // Step 1: make the request without payment
  const firstResponse = await fetch(url);

  if (firstResponse.status !== 402) {
    if (!firstResponse.ok) throw new Error(`Request failed: ${firstResponse.status}`);
    return firstResponse.json() as Promise<T>;
  }

  // Step 2: parse 402 payment requirements
  const paymentRequired = await firstResponse.json() as any;
  const offer = paymentRequired.accepts?.[0];

  if (!offer) throw new Error("No payment offer in 402 response");

  const amountLamports = parseInt(offer.maxAmountRequired, 10);
  const payTo = new PublicKey(offer.payTo);

  console.log(`[x402] 402 received for ${url}`);
  console.log(`[x402] Paying ${amountLamports} lamports → ${offer.payTo}`);

  // Step 3: pay on-chain
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: agentKeypair.publicKey,
      toPubkey: payTo,
      lamports: amountLamports,
    })
  );

  setAgentBusy(true);
  let txSignature: string;
  try {
    txSignature = await sendAndConfirmTransaction(connection, tx, [agentKeypair]);
    agentTxCache.add(txSignature); // prevent monitor from treating this as user activity
  } finally {
    setAgentBusy(false);
  }
  console.log(`[x402] Payment sent. Sig: ${txSignature}`);

  // Log for dashboard display
  const log: X402PaymentLog = {
    url,
    txSignature,
    amountLamports,
    payTo: offer.payTo,
    timestamp: Date.now(),
  };
  paymentLogs.push(log);

  // Step 4: retry with payment proof
  const retryResponse = await fetch(url, {
    headers: {
      "X-Payment": JSON.stringify({ txSignature, payer: agentKeypair.publicKey.toBase58() }),
    },
  });

  if (!retryResponse.ok) {
    const err = await retryResponse.json() as any;
    throw new Error(`x402 retry failed: ${err.reason ?? retryResponse.status}`);
  }

  console.log(`[x402] Data received after payment ✅`);
  return retryResponse.json() as Promise<T>;
}
