/**
 * Generates a dedicated oracle keypair for the x402 server.
 * Run once: npx ts-node x402/setup-oracle.ts
 * Then airdrop 0.1 SOL to the printed address so it can cover tx fees.
 */
import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const outPath = path.join(__dirname, "oracle-keypair.json");

if (fs.existsSync(outPath)) {
  const existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  const kp = Keypair.fromSecretKey(new Uint8Array(existing));
  console.log("Oracle keypair already exists:");
  console.log("  Address:", kp.publicKey.toBase58());
} else {
  const kp = Keypair.generate();
  fs.writeFileSync(outPath, JSON.stringify(Array.from(kp.secretKey)));
  console.log("✅ Oracle keypair generated:");
  console.log("  Address:", kp.publicKey.toBase58());
  console.log("\nAdd to .env.local:");
  console.log(`  ORACLE_ADDRESS=${kp.publicKey.toBase58()}`);
  console.log("\nAirdrop devnet SOL to it:");
  console.log(`  solana airdrop 0.1 ${kp.publicKey.toBase58()}`);
}
