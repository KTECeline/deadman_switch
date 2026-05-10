"use client";

import { useMemo, type ReactNode, type ComponentType } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

// Cast to ComponentType to work around @solana/wallet-adapter FC → React 18 type gap
const CP = ConnectionProvider as unknown as ComponentType<{
  endpoint: string;
  children: ReactNode;
}>;
const WP = SolanaWalletProvider as unknown as ComponentType<{
  wallets: InstanceType<typeof PhantomWalletAdapter>[];
  autoConnect: boolean;
  children: ReactNode;
}>;
const WMP = WalletModalProvider as unknown as ComponentType<{
  children: ReactNode;
}>;

export default function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet"),
    []
  );
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <CP endpoint={endpoint}>
      <WP wallets={wallets} autoConnect>
        <WMP>{children}</WMP>
      </WP>
    </CP>
  );
}
