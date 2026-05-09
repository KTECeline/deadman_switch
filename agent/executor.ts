import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { SwitchAccount } from "./types";
import { agentTxCache } from "./agent-tx-cache";
import { loadProgram } from "./program";

export async function executeSwitch(
  switchAccount: SwitchAccount,
  agentKeypair: Keypair
): Promise<string> {
  const program = loadProgram(agentKeypair);

  const switchId = new anchor.BN(switchAccount.switchId.toString());

  const sig = await (program.methods as any)
    .execute(switchId)
    .accounts({
      switch: switchAccount.publicKey,
      beneficiary: switchAccount.beneficiary,
      owner: switchAccount.owner,
      caller: agentKeypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  agentTxCache.add(sig);
  console.log(
    `[executor] Switch ${switchAccount.switchId} executed. Sig: ${sig}`
  );
  return sig;
}

export async function recordHeartbeat(
  switchAccount: SwitchAccount,
  activityType: string,
  agentKeypair: Keypair
): Promise<string> {
  const program = loadProgram(agentKeypair);

  const switchId = new anchor.BN(switchAccount.switchId.toString());

  const sig = await (program.methods as any)
    .heartbeat(switchId, activityType)
    .accounts({
      switch: switchAccount.publicKey,
      watcher: agentKeypair.publicKey,
    })
    .rpc();

  agentTxCache.add(sig);
  console.log(
    `[executor] Heartbeat recorded for switch ${switchAccount.switchId}. Activity: ${activityType}. Sig: ${sig}`
  );
  return sig;
}
