# Dead Man's Switch — Autonomous On-chain Executor

> *"If I don't check in for 90 days, send my SOL to my daughter's wallet."*

An AI agent that holds your assets and executes your future instructions when conditions are met — with no middleman, no subscription, no single point of failure.

Built for the **DEV3PACK Hackathon** — targeting Best App Overall and the x402 Bonus Prize tracks.

---

## What It Does

Dead Man's Switch lets you create conditional asset transfers on Solana. You define the trigger (inactivity timeout), the beneficiary, and the amount. A smart contract locks your SOL in a PDA vault. An AI agent monitors your wallet 24/7 and executes when conditions are met.

**The killer feature:** you never have to open the app. Any on-chain activity from your wallet — a DEX swap, a transfer, a stake — automatically resets your timer. Your last transaction is your heartbeat.

### Use Cases
- **Inheritance** — Transfer assets to family if you go inactive
- **Travel Safety** — Protect DeFi positions if you don't check in
- **Automated Trading** — "Sell if portfolio drops 40%"
- **Recurring Payments** — "$2 weekly to my kid's wallet"

---

## How It Works

```
User creates a switch via frontend
  ↓
Anchor program initializes PDA vault, locks SOL
  ↓
AI agent begins monitoring loop:
  ├── Helius WebSocket watches wallet for any on-chain activity
  ├── Pyth/x402 oracle feeds price data (price-based triggers)
  └── Internal clock tracks time since last check-in
  ↓
Agent pays for each oracle call via x402 (self-funding)
  ↓
[If user is active] → Heartbeat recorded on-chain, timer resets
  ↓
[If timer expires] → Agent sends Telegram warning (grace period)
  ↓
[No reply in grace period] → Agent calls execute → SOL moves to beneficiary
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Smart Contract | Rust + Anchor Framework |
| Chain | Solana Devnet |
| Price Oracles | Pyth Network via x402 |
| RPC / WebSockets | Helius |
| Agent Payments | x402 Protocol (self-funding micropayments) |
| Frontend | Next.js 14 + TypeScript |
| Wallet | Solana Wallet Adapter (Phantom) |
| Styling | Tailwind CSS + Framer Motion |

---

## Prerequisites

- Node.js 18+
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (`avm install latest && avm use latest`)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Phantom wallet](https://phantom.app) (set to Devnet)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
# Already filled — Helius devnet RPC
HELIUS_API_KEY=your_key
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=your_key

# Agent keypair — the watcher address that signs heartbeat/execute txs
# Use your existing Solana CLI keypair:
#   solana address  →  paste pubkey below
NEXT_PUBLIC_AGENT_WATCHER=<your_agent_pubkey>

# Optional: use a dedicated agent keypair (keeps agent funds separate)
# Generate once: solana-keygen new -o agent/keypair.json
# Then: AGENT_KEYPAIR_PATH=agent/keypair.json
AGENT_KEYPAIR_PATH=          # leave blank to use ~/.config/solana/id.json

# Telegram bot — get warnings before your switch executes
# 1. Message @BotFather → /newbot → copy token
# 2. Message your bot, then open:
#    https://api.telegram.org/bot<TOKEN>/getUpdates
#    Copy the "id" under "chat"
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Grace period before execution fires (seconds)
# 604800 = 7 days for production, 180 = 3 min for demo
GRACE_PERIOD_SECONDS=604800
```

### 3. Fund your wallet with devnet SOL

```bash
solana airdrop 2                  # your main wallet
solana airdrop 1 $(solana address) # agent wallet (for tx fees)
```

> In Phantom: Settings → Developer Settings → Switch to Devnet

### 4. Verify the program is deployed

The Anchor program is already deployed to devnet:
```
Program ID: 5VTjU3UxdPuXCgEes3BZHKU1AXYCnTU2YFF5LdWqTXJx
```

To redeploy after making changes to the Rust program:
```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

## Running

### Frontend only (create + check-in + cancel)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Full stack (adds autonomous monitoring + execution)

Open three terminals:

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — x402 Oracle (price feed server)
npm run oracle

# Terminal 3 — AI Agent
npm run agent
```

---

## Testing

### 1. Basic switch flow

1. Open [http://localhost:3000](http://localhost:3000) and connect Phantom (Devnet)
2. Go to **Create Switch** → enter a beneficiary wallet, lock 0.1 SOL, set interval to 1 day
3. Approve the transaction in Phantom
4. Go to **My Switches** — your switch appears with a live countdown from on-chain data
5. Click **Check In** — timer resets (calls `check_in` instruction on-chain)
6. Click **Cancel** — SOL is returned to your wallet

### 2. Heartbeat auto-detection (agent must be running)

```bash
npm run agent
```

1. Create a switch with `NEXT_PUBLIC_AGENT_WATCHER` set to your address
2. Send any devnet SOL transfer from your wallet (`solana transfer <any_address> 0.001`)
3. Watch agent logs — you'll see:
   ```
   [monitor] Incoming tx detected for wallet ...
   [heartbeat] transfer — resetting timer on-chain
   ```
4. The timer resets without you touching the app

### 3. Execution demo (fastest)

Set in `.env.local`:
```env
GRACE_PERIOD_SECONDS=60
```

1. Create a switch with a very short interval (edit `CHECK_IN_INTERVAL` in `agent/create-test-switch.ts`)
2. Run `npm run agent`
3. Wait for expiry → Telegram warning arrives
4. Don't reply → 60 seconds later → agent calls `execute` → SOL moves to beneficiary

### 4. x402 oracle payments

The agent automatically pays for each price oracle query using the x402 protocol. Watch the logs:
```
[x402] 402 received for http://localhost:3001/price/SOL-USD
[x402] Paying 1000 lamports → <oracle_address>
[x402] Payment sent. Sig: <tx_signature>
[x402] SOL/USD = $93.28 (paid 1000 lamports)
```

---

## Project Structure

```
dead-mans-switch/
├── programs/
│   └── dead-mans-switch/src/
│       ├── lib.rs                    ← Program entrypoint
│       └── instructions/
│           ├── create_switch.rs      ← Initialize PDA vault
│           ├── check_in.rs           ← Reset timer (owner signs)
│           ├── heartbeat.rs          ← Reset timer (agent signs)
│           ├── execute.rs            ← Release funds to beneficiary
│           └── cancel.rs             ← Return funds to owner
│
├── src/                              ← Next.js frontend
│   ├── app/
│   │   ├── page.tsx                  ← Landing page
│   │   ├── dashboard/page.tsx        ← Overview + agent activity
│   │   ├── create/page.tsx           ← Create switch form
│   │   ├── switches/page.tsx         ← All switches with check-in/cancel
│   │   ├── switch/[id]/page.tsx      ← Switch detail + timeline
│   │   └── beneficiaries/page.tsx    ← Grouped beneficiary view
│   ├── components/
│   │   ├── WalletProvider.tsx        ← Phantom wallet adapter
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── CountdownTimer.tsx    ← SVG ring with color thresholds
│   │       ├── CheckInButton.tsx     ← Animated check-in button
│   │       ├── GlassCard.tsx
│   │       └── StatusBadge.tsx
│   └── lib/
│       ├── program.ts                ← Anchor client hook (useProgram)
│       ├── switches-store.tsx        ← On-chain state + CRUD context
│       ├── switch-names.ts           ← localStorage for display names
│       ├── telegram.ts               ← Telegram bot URL helper
│       └── utils.ts
│
├── agent/                            ← AI agent (Node.js)
│   ├── index.ts                      ← Main loop + condition evaluator
│   ├── monitor.ts                    ← Helius WebSocket heartbeat listener
│   ├── executor.ts                   ← Calls execute instruction
│   ├── conditions.ts                 ← Checks inactivity + price triggers
│   ├── telegram.ts                   ← Warning + execution notifications
│   ├── grace-period.ts               ← File-backed grace period state
│   ├── x402-client.ts                ← x402 HTTP payment client
│   ├── pyth-oracle.ts                ← Price feed queries
│   ├── agent-tx-cache.ts             ← Prevents agent tx feedback loops
│   └── program.ts                    ← Shared Anchor program loader
│
├── x402/
│   └── server.ts                     ← Mock price oracle with 402 payment gate
│
├── tests/
│   └── dead-mans-switch.ts           ← Anchor integration tests
│
├── target/idl/
│   └── dead_mans_switch.json         ← Generated Anchor IDL
│
├── Anchor.toml
├── tsconfig.agent.json               ← CommonJS tsconfig for agent scripts
└── .env.local                        ← Never commit this
```

---

## Smart Contract Instructions

| Instruction | Signer | Description |
|---|---|---|
| `create_switch` | Owner | Initialize PDA vault, lock SOL |
| `check_in` | Owner | Manually reset the inactivity timer |
| `heartbeat` | Watcher (agent) | Reset timer from detected on-chain activity |
| `execute` | Anyone | Release SOL to beneficiary (only after expiry) |
| `cancel` | Owner | Close vault, return all SOL to owner |
| `link_cnft` | Owner | Link a cNFT instruction scroll to the switch |

---

## Why Solana

| Feature | Why It Matters |
|---|---|
| Helius WebSocket subscriptions | Free real-time heartbeat detection — no polling gas |
| ~$0.00025 per tx | Makes 1000-lamport oracle micropayments viable |
| PDA vaults | Custodian-free escrow, no multisig needed |
| x402 protocol | Agent self-funds its oracle queries per-use, no subscription |

On Ethereum, autonomous execution requires a paid keeper network (Gelato, Chainlink Automation) charging per-trigger. On Solana, the agent monitors for free and pays only when it actually queries a data source.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `HELIUS_API_KEY` | Yes | Helius RPC + WebSocket access |
| `HELIUS_RPC_URL` | Yes | Full Helius devnet RPC endpoint |
| `NEXT_PUBLIC_AGENT_WATCHER` | Yes | Agent pubkey — set as watcher on new switches |
| `AGENT_KEYPAIR_PATH` | No | Path to agent keypair JSON (default: `~/.config/solana/id.json`) |
| `TELEGRAM_BOT_TOKEN` | No | Bot token for grace period warnings |
| `TELEGRAM_CHAT_ID` | No | Your Telegram chat ID to receive warnings |
| `GRACE_PERIOD_SECONDS` | No | Time between warning and execution (default: 604800 = 7 days) |
| `ORACLE_URL` | No | x402 oracle URL (default: `http://localhost:3001`) |
| `PROGRAM_ID` | No | Anchor program address (pre-filled) |
