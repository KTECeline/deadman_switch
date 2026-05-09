/**
 * Creates a live switch on devnet for agent monitoring.
 * The watcher is set to your own wallet (same as agent keypair).
 *
 * Run: npx ts-node agent/create-test-switch.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const walletPath = path.join(process.env.HOME!, ".config/solana/id.json");
  const walletJson = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletJson));

  const connection = new Connection(
    process.env.HELIUS_RPC_URL ?? clusterApiUrl("devnet"),
    "confirmed"
  );
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });

  const idl = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../target/idl/dead_mans_switch.json"), "utf-8")
  );
  const program = new anchor.Program(idl, provider);

  const SWITCH_ID     = new anchor.BN(99);           // unique ID for this test switch
  const INTERVAL_SECS = new anchor.BN(120);          // 2 minutes — short enough to demo
  const LOCKED_SOL    = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
  const beneficiary   = keypair.publicKey;            // send back to yourself for the demo
  const watcher       = keypair.publicKey;            // agent uses same wallet on devnet

  const [switchPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("switch"),
      keypair.publicKey.toBuffer(),
      SWITCH_ID.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  console.log("Creating switch...");
  console.log("  PDA:         ", switchPda.toBase58());
  console.log("  Switch ID:   ", SWITCH_ID.toString());
  console.log("  Interval:    ", INTERVAL_SECS.toString(), "seconds");
  console.log("  Locked:      ", LOCKED_SOL.toString(), "lamports");
  console.log("  Beneficiary: ", beneficiary.toBase58());
  console.log("  Watcher:     ", watcher.toBase58());

  const sig = await (program.methods as any)
    .createSwitch(SWITCH_ID, INTERVAL_SECS, LOCKED_SOL, beneficiary, watcher)
    .accounts({
      switch: switchPda,
      owner: keypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("\n✅ Switch created!");
  console.log("  Tx:", sig);
  console.log("\nThe agent will now:");
  console.log("  - Watch your wallet via Helius websocket");
  console.log("  - Record any on-chain activity as a heartbeat");
  console.log(`  - Execute in ~${INTERVAL_SECS}s if no activity is detected`);
  console.log("\nMake a transaction from your wallet to reset the timer and see heartbeat detection.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
