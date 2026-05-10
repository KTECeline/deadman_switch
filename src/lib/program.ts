"use client";

import * as anchor from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import idl from "../../target/idl/dead_mans_switch.json";

export const PROGRAM_ID = new PublicKey(
  "5VTjU3UxdPuXCgEes3BZHKU1AXYCnTU2YFF5LdWqTXJx"
);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as unknown as anchor.Wallet,
      { commitment: "confirmed", preflightCommitment: "confirmed" }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new anchor.Program(idl as any, provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, wallet.publicKey, wallet.signTransaction]);

  return { program, connection, wallet };
}

export function findSwitchPda(owner: PublicKey, switchId: anchor.BN): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("switch"),
      owner.toBuffer(),
      switchId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
  return pda;
}
