/**
 * Dead Man's Switch — AI Agent
 *
 * Startup sequence:
 *   1. Load all active Switch accounts from the program
 *   2. For each switch, open a Helius websocket on the owner's wallet (heartbeat monitor)
 *   3. Every 60s, evaluate time conditions and execute any expired switches
 *
 * Run: npx ts-node agent/index.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import WebSocket from "ws";

import { SwitchAccount } from "./types";
import { loadProgram } from "./program";
import { startHeartbeatMonitor } from "./monitor";
import { evaluateTimeCondition, formatDeadline } from "./conditions";
import { executeSwitch, recordHeartbeat } from "./executor";
import { fetchPrice } from "./pyth-oracle";
import { paymentLogs } from "./x402-client";
import {
  sendWarning,
  sendExecutionNotice,
  sendResetConfirmation,
  checkForAliveSignal,
  processBotCommands,
} from "./telegram";
import {
  startGracePeriod,
  getGracePeriod,
  clearGracePeriod,
  isGraceExpired,
} from "./grace-period";

const POLL_INTERVAL_MS = 60_000; // check conditions every 60 seconds

// Grace period before execution — default 7 days, override via env for demo
const GRACE_PERIOD_MS =
  parseInt(process.env.GRACE_PERIOD_SECONDS ?? "604800") * 1000;
const GRACE_PERIOD_DAYS = Math.round(GRACE_PERIOD_MS / 86_400_000) || 1;

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

// ── Agent keypair (the authorized watcher) ──────────────────────────────────
function loadAgentKeypair(): Keypair {
  // Accept raw JSON array via env (for Railway/cloud deployments)
  if (process.env.AGENT_KEYPAIR_JSON) {
    const json = JSON.parse(process.env.AGENT_KEYPAIR_JSON);
    return Keypair.fromSecretKey(new Uint8Array(json));
  }
  const walletPath =
    process.env.AGENT_KEYPAIR_PATH ??
    path.join(process.env.HOME!, ".config/solana/id.json");
  const json = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(json));
}

// ── Fetch all active switches from the program ───────────────────────────────
async function fetchActiveSwitches(program: anchor.Program): Promise<SwitchAccount[]> {
  const raw = await (program.account as any).switch.all();

  return raw.map((item: any) => {
    const a = item.account;
    return {
      publicKey: item.publicKey as PublicKey,
      owner: a.owner as PublicKey,
      beneficiary: a.beneficiary as PublicKey,
      checkInInterval: a.checkInInterval.toNumber(),
      lastCheckIn: a.lastCheckIn.toNumber(),
      lockedAmount: BigInt(a.lockedAmount.toString()),
      switchId: BigInt(a.switchId.toString()),
      watcher: a.watcher as PublicKey,
      cnftAssetId: a.cnftAssetId as PublicKey,
      lastActivityType: Buffer.from(a.lastActivityType).toString("utf8").replace(/\0/g, ""),
    } as SwitchAccount;
  });
}

// ── Condition check loop ─────────────────────────────────────────────────────
async function runConditionLoop(
  program: anchor.Program,
  agentKeypair: Keypair,
  executedSwitches: Set<string>
) {
  await processBotCommands();

  const switches = await fetchActiveSwitches(program);
  console.log(`\n[agent] Checking ${switches.length} active switch(es)...`);

  for (const sw of switches) {
    const key = sw.publicKey.toBase58();
    if (executedSwitches.has(key)) continue;

    // Only act on switches where this agent is the authorized watcher
    if (sw.watcher.toBase58() !== agentKeypair.publicKey.toBase58()) continue;

    const result = evaluateTimeCondition(sw);
    console.log(`[agent] Switch ${sw.switchId}: ${result.reason}`);

    // Fetch SOL price via x402 — agent pays per query from its own wallet
    try {
      const priceData = await fetchPrice("SOL-USD", agentKeypair);
      console.log(
        `[x402]  SOL/USD = $${priceData.price.toFixed(2)} ` +
        `(paid ${priceData.costLamports} lamports, tx: ${priceData.paidWith.slice(0, 16)}...)`
      );
      console.log(`[x402]  Total payments this session: ${paymentLogs.length}`);
    } catch (err: any) {
      console.log(`[x402]  Oracle unavailable (${err.message}) — start x402/server.ts for price data`);
    }

    if (result.shouldExecute) {
      const grace = getGracePeriod(sw.switchId);

      if (!grace) {
        // First expiry — send warning and start grace period instead of executing
        if (TELEGRAM_CHAT_ID) {
          await sendWarning(TELEGRAM_CHAT_ID, sw.switchId, GRACE_PERIOD_DAYS);
        }
        startGracePeriod(sw.switchId, TELEGRAM_CHAT_ID);
        console.log(
          `[agent] ⚠️  Switch ${sw.switchId} expired — grace period started ` +
          `(${GRACE_PERIOD_DAYS}d). Telegram warning sent.`
        );
      } else if (isGraceExpired(grace, GRACE_PERIOD_MS)) {
        // Grace period over with no reply — execute
        console.log(`[agent] 🔴 Executing switch ${sw.switchId} (grace period elapsed)...`);
        try {
          const sig = await executeSwitch(sw, agentKeypair);
          executedSwitches.add(key);
          if (TELEGRAM_CHAT_ID) {
            await sendExecutionNotice(TELEGRAM_CHAT_ID, sw.switchId, sig, sw.lockedAmount);
          }
          clearGracePeriod(sw.switchId);
          console.log(`[agent] ✅ Switch ${sw.switchId} executed. Sig: ${sig}`);
          console.log(`[agent]    ${sw.lockedAmount} lamports → ${sw.beneficiary.toBase58()}`);
        } catch (err: any) {
          console.error(`[agent] ❌ Execute failed for switch ${sw.switchId}:`, err.message);
        }
      } else {
        // Inside grace period — check if user replied on Telegram
        const aliveSignal = await checkForAliveSignal(grace.startedAt);
        if (aliveSignal) {
          try {
            await recordHeartbeat(sw, "telegram_reply", agentKeypair);
            clearGracePeriod(sw.switchId);
            if (TELEGRAM_CHAT_ID) {
              await sendResetConfirmation(TELEGRAM_CHAT_ID, sw.switchId);
            }
            console.log(`[agent] ✅ Switch ${sw.switchId} — alive signal received, timer reset.`);
          } catch (err: any) {
            console.error(`[agent] ❌ Heartbeat failed for switch ${sw.switchId}:`, err.message);
          }
        } else {
          const elapsed = Date.now() - grace.startedAt;
          const remainingMs = GRACE_PERIOD_MS - elapsed;
          const remainingHours = Math.ceil(remainingMs / 3_600_000);
          console.log(
            `[agent] ⏳ Switch ${sw.switchId} in grace period — ` +
            `${remainingHours}h remaining before execution.`
          );
        }
      }
    } else {
      console.log(`[agent] Switch ${sw.switchId} deadline: ${formatDeadline(sw)}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔐 Dead Man's Switch Agent starting...");

  if (!process.env.HELIUS_API_KEY) {
    console.error("HELIUS_API_KEY not set in .env.local");
    process.exit(1);
  }

  const agentKeypair = loadAgentKeypair();
  const program = loadProgram(agentKeypair);

  console.log(`[agent] Wallet: ${agentKeypair.publicKey.toBase58()}`);
  console.log(`[agent] Program: ${program.programId.toBase58()}`);

  // Fetch initial switches and start a websocket monitor for each
  const switches = await fetchActiveSwitches(program);
  console.log(`[agent] Found ${switches.length} active switch(es)`);

  const activeSockets = new Map<string, WebSocket>();
  const executedSwitches = new Set<string>();

  for (const sw of switches) {
    if (sw.watcher.toBase58() !== agentKeypair.publicKey.toBase58()) continue;
    const ws = startHeartbeatMonitor(sw, agentKeypair);
    activeSockets.set(sw.publicKey.toBase58(), ws);
  }

  // Run condition check immediately, then on interval
  await runConditionLoop(program, agentKeypair, executedSwitches);

  setInterval(async () => {
    await runConditionLoop(program, agentKeypair, executedSwitches);

    // Start monitors for any newly created switches
    const latest = await fetchActiveSwitches(program);
    for (const sw of latest) {
      const key = sw.publicKey.toBase58();
      if (activeSockets.has(key)) continue;
      if (sw.watcher.toBase58() !== agentKeypair.publicKey.toBase58()) continue;
      const ws = startHeartbeatMonitor(sw, agentKeypair);
      activeSockets.set(key, ws);
      console.log(`[agent] Started monitor for new switch ${sw.switchId}`);
    }
  }, POLL_INTERVAL_MS);

  console.log(`[agent] Running. Checking conditions every ${POLL_INTERVAL_MS / 1000}s.`);
}

main().catch((err) => {
  console.error("Fatal agent error:", err);
  process.exit(1);
});
