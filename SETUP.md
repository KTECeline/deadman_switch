# Environment Setup

Run these in order. Each step must succeed before the next.

## 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

## 2. Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
# Add that export to your ~/.zshrc so it persists
```

## 3. Install Anchor via AVM
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

## 4. Configure Solana for devnet
```bash
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json   # skip if you already have a wallet
solana airdrop 2
```

## 5. Install JS dependencies
```bash
npm install
```

## 6. Build the program (generates your program ID)
```bash
anchor build
```

## 7. Sync your program ID
```bash
anchor keys sync
# This auto-updates declare_id!() in lib.rs and Anchor.toml to match the generated keypair
```

## 8. Run tests
```bash
anchor test
```

## 9. Deploy to devnet and run
```bash
anchor deploy --provider.cluster devnet
npm run oracle        # terminal 1 — x402 price oracle
npm run agent         # terminal 2 — AI agent loop
npm run create-switch # terminal 3 — create a test switch (optional)
```
