# 🔐 Dead Man's Switch — Autonomous On-chain Executor
Solana Hackathon Project Brief
> An AI agent that holds your assets and executes your future instructions when conditions are met — without any human in the loop.

## 📌 What Is This Project?
Dead Man's Switch is a trustless, autonomous executor built on Solana. Users define conditional instructions — "if I don't check in for 90 days, send my SOL to my daughter's wallet" — and a smart contract + AI agent ensures those instructions execute exactly as written, with no middleman.

Think of it as a will, a trust fund, and a trading bot combined into one on-chain product — powered by Solana's speed, low fees, and native account model.

### Core Use Cases
- 🏦 **Inheritance** — Transfer assets to family if you go inactive
- 🤖 **Automated Trading** — "Sell my memecoins if portfolio drops 40%"
- 🌍 **Travel Safety** — Pause DeFi positions if you don't check in
- 💸 **Recurring Micro-payments** — "$2 weekly to my kid's wallet"
- 🏛️ **DAO Donation** — "Donate to X DAO if I'm gone 90 days"

### Why This Only Works on Solana
| Feature | Why It Matters |
|---|---|
| Websocket account subscriptions | Free real-time condition monitoring — no polling gas |
| ~$0.00025 per tx | Makes $2 recurring transfers economically viable |
| Compressed NFTs (cNFTs) | Store user instructions on-chain for ~$0.001 |
| Program Derived Addresses (PDAs) | Elegant, custodian-free escrow vault |
| x402 payment protocol | Agent pays for oracles/compute per-use, not subscription |

### 🫀 The Killer Feature — Automatic Heartbeat Detection
> "The user never pressed anything. Their last DEX swap 91 days ago was their final heartbeat. The switch just fired."

This is what makes Dead Man's Switch impossible to replicate meaningfully on Ethereum.

**How it works:**
1. Owner creates a switch and authorizes the agent's keypair as `watcher`
2. Agent subscribes to the owner's wallet via **Helius websocket**
3. ANY on-chain activity (swap, transfer, stake, vote) fires the websocket
4. Agent calls the `heartbeat` instruction with the activity type (e.g. `"dex_swap"`)
5. Timer resets — user never had to open the app
6. If 90 days pass with no activity → agent calls `execute` → SOL moves to beneficiary

**Why Solana specifically:**
- Helius websocket subscriptions are free and real-time — no polling, no gas cost
- On Ethereum, you'd need a paid keeper network (Gelato, Chainlink Automation) that charges per trigger
- Solana's account model lets the agent prove the activity type on-chain (stored in `last_activity_type`)

**Implementation:** `heartbeat` instruction (Rust) + `agent/monitor.ts` (Phase 3, Helius websocket)

---

## 🗂️ Phases

### Phase 1 — Smart Contract / PDA Vault
> Goal: Deploy an Anchor program that holds assets and exposes execution functions

- Initialize a PDA vault per user (escrow account)
- Write `create_switch` instruction — accepts conditions + beneficiary
- Write `check_in` instruction — resets the dead man's timer
- Write `execute` instruction — releases funds when conditions are met
- Write `cancel` instruction — owner can withdraw before trigger
- Deploy to Solana Devnet

Key files:
- `programs/dead-mans-switch/src/lib.rs`
- `programs/dead-mans-switch/src/instructions/`
- `Anchor.toml`

### Phase 2 — cNFT Instruction Storage
> Goal: Store the user's "instruction scroll" as a compressed NFT on Solana

- Mint a cNFT per switch using Metaplex Bubblegum
- Store switch metadata (conditions, beneficiary, trigger type) in cNFT URI
- Link cNFT to PDA vault — the NFT is the will
- Verify cNFT ownership to allow edits or cancellation

References:
- [Metaplex Bubblegum Docs](https://developers.metaplex.com/bubblegum)
- [Solana Compressed NFTs Guide](https://solanacookbook.com)

### Phase 3 — AI Agent Loop
> Goal: Build the agent that watches conditions and triggers execution

- Set up Helius websocket to monitor wallet activity + balances
- Connect Pyth oracle for price feeds (portfolio drop triggers)
- Build condition evaluation engine (check-in timeout, price threshold, date)
- On condition met → call `execute` instruction via Anchor client
- Agent pays for oracle data + RPC calls via x402 (hits bonus prize)
- Log all agent decisions on-chain for auditability

References:
- [Helius Websocket Docs](https://docs.helius.dev)
- [Pyth Network](https://pyth.network/developers)
- [x402 Protocol](https://x402.org)

### Phase 4 — x402 Payment Integration
> Goal: Agent self-funds its operations via x402 — no prepaid subscriptions

- Integrate x402 HTTP payment middleware into the agent
- Agent pays per Pyth oracle query from the vault's operating budget
- Agent pays per Helius RPC call as needed
- Show x402 transaction logs in the UI (great demo moment)

> ⚡ This phase directly targets the $500 x402 bonus prize

References:
- [x402 GitHub](https://github.com/coinbase/x402)
- [x402 on Solana Guide](https://x402.org)

### Phase 5 — Frontend UI (Next.js)
> Goal: Clean, emotional UX that makes the concept feel real

- Connect wallet (Phantom / Solflare via `@solana/wallet-adapter`)
- "Create a Switch" flow — natural language input → structured conditions
- Dashboard — see all your active switches + time remaining
- Check-in button — one tap to reset the timer
- Beneficiary view — let recipients see pending switches (read-only)
- Mobile responsive (judges will test on phone)

Stack:
- Next.js 14 (App Router)
- `@solana/wallet-adapter-react`
- `@coral-xyz/anchor` (Anchor client)
- Tailwind CSS

---

## 🛠️ Tech Stack
| Layer | Tech |
|---|---|
| Smart Contract | Rust + Anchor Framework |
| Chain | Solana Devnet → Mainnet |
| Compressed NFTs | Metaplex Bubblegum |
| Price Oracles | Pyth Network |
| RPC / Websockets | Helius |
| Agent Payments | x402 Protocol |
| Frontend | Next.js 14 + TypeScript |
| Wallet | Solana Wallet Adapter |
| Styling | Tailwind CSS |
| Anchor Client | `@coral-xyz/anchor` |

---

## ⚙️ Important Commands

### Setup
```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest

# Install JS deps
npm install

# Install Anchor workspace deps
cd programs/dead-mans-switch && cargo build
```

### Build & Deploy
```bash
# Build the Anchor program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Frontend
```bash
# Run dev server
npm run dev

# Build for production
npm run build
```

### Solana CLI
```bash
# Set to devnet
solana config set --url devnet

# Check wallet balance
solana balance

# Airdrop devnet SOL
solana airdrop 2
```

---

## 🚫 Do NOT Do These
- ❌ Don't deploy to mainnet during the hackathon — devnet only
- ❌ Don't store private keys in `.env` files that get committed — use `.env.local` and add to `.gitignore`
- ❌ Don't skip the `check_in` instruction — it's the core mechanic, everything else depends on it
- ❌ Don't use polling for condition checks — use Helius websockets, polling burns RPC credits and is slower
- ❌ Don't hardcode wallet addresses — all beneficiary addresses must come from user input
- ❌ Don't forget to set `anchor.toml` cluster to `devnet` before demo

---

## 🔄 Agent Workflow (Step by Step)
```
1. User creates a switch via frontend
      ↓
2. Anchor program initializes PDA vault, locks assets
      ↓
3. cNFT minted — stores conditions + beneficiary (the "will")
      ↓
4. AI agent begins monitoring loop:
      ├── Helius websocket watches wallet for check-in activity
      ├── Pyth oracle feeds price data (for price-based triggers)
      └── Internal clock tracks time since last check-in
      ↓
5. Agent pays for each oracle/RPC call via x402 from vault budget
      ↓
6. [If user checks in] → Timer resets, nothing happens
      ↓
7. [If condition met] → Agent calls `execute` instruction on Anchor program
      ↓
8. PDA vault releases funds to beneficiary wallet
      ↓
9. cNFT marked as "executed" — permanent on-chain record
```

---

## 📁 Folder Structure
```
dead-mans-switch/
├── programs/
│   └── dead-mans-switch/
│       └── src/
│           ├── lib.rs
│           └── instructions/
│               ├── create_switch.rs
│               ├── check_in.rs
│               ├── execute.rs
│               └── cancel.rs
├── app/                        ← Next.js frontend
│   ├── page.tsx                ← Landing / create switch
│   ├── dashboard/page.tsx      ← User dashboard
│   └── components/
│       ├── SwitchCard.tsx
│       ├── CreateSwitchForm.tsx
│       └── CheckInButton.tsx
├── agent/                      ← AI agent loop
│   ├── index.ts
│   ├── monitor.ts              ← Helius websocket listener
│   ├── conditions.ts           ← Condition evaluator
│   └── executor.ts             ← Calls Anchor `execute`
├── tests/
│   └── dead-mans-switch.ts
├── Anchor.toml
├── package.json
└── .env.local                  ← Never commit this
```

---

## 🔗 Key References & Links
| Resource | Link |
|---|---|
| Anchor Framework Docs | https://www.anchor-lang.com |
| Solana Cookbook | https://solanacookbook.com |
| Helius RPC + Websockets | https://docs.helius.dev |
| Pyth Oracle | https://pyth.network/developers |
| Metaplex Bubblegum (cNFTs) | https://developers.metaplex.com/bubblegum |
| x402 Protocol | https://x402.org |
| Solana Wallet Adapter | https://github.com/solana-labs/wallet-adapter |
| Solana Devnet Faucet | https://faucet.solana.com |
| Anchor PDA Guide | https://www.anchor-lang.com/docs/pdas |
| Solana Program Library | https://spl.solana.com |

---

## 💡 Demo Tips
- Lead with the story — "Imagine you're in a coma. Your assets are frozen. This prevents that."
- Show the check-in button first — it's the most intuitive interaction
- Trigger a live execution on devnet during the demo — nothing beats seeing SOL actually move
- Show x402 payment logs — judges from the Solana track will love seeing the agent pay its own way
- Have the cNFT link ready — open it on Solana Explorer to show it's truly on-chain

---

*Built for the Solana Hackathon — Best App Overall + x402 Bonus Prize tracks*
