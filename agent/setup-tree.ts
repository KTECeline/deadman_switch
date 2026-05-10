/**
 * One-time script: creates a Merkle tree on devnet for cNFT minting.
 * Run with: npx ts-node agent/setup-tree.ts
 * Copy the printed address into your .env.local as MERKLE_TREE_ADDRESS=...
 */
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplBubblegum, createTree } from "@metaplex-foundation/mpl-bubblegum";
import { keypairIdentity, generateSigner } from "@metaplex-foundation/umi";
import { fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";
import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const umi = createUmi("https://api.devnet.solana.com").use(mplBubblegum());

  const walletPath = path.join(process.env.HOME!, ".config/solana/id.json");
  const walletJson = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(walletJson));
  umi.use(keypairIdentity(fromWeb3JsKeypair(keypair)));

  console.log("Creating Merkle tree on devnet...");
  console.log("Payer:", keypair.publicKey.toBase58());

  const merkleTree = generateSigner(umi);

  // maxDepth=14 supports 16,384 cNFTs; costs ~0.5 SOL on devnet
  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });

  await builder.sendAndConfirm(umi);

  console.log("\n✅ Merkle tree created!");
  console.log("Address:", merkleTree.publicKey);
  console.log("\nAdd this to your .env.local:");
  console.log(`MERKLE_TREE_ADDRESS=${merkleTree.publicKey}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
