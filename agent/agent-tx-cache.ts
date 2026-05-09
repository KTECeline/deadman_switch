// Tracks all transaction signatures initiated by the agent itself.
// The heartbeat monitor uses this to skip agent-generated txs — we only
// want to fire heartbeats for external user activity, not the agent's own ops.
export const agentTxCache = new Set<string>();

// Blocks heartbeat detection while the agent is mid-transaction.
// Needed because the Helius websocket fires before sendAndConfirmTransaction
// returns, creating a race condition where the cache isn't populated yet.
export let agentIsBusy = false;
export function setAgentBusy(busy: boolean) { agentIsBusy = busy; }
