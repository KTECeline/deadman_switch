/**
 * Grace period state — persisted to disk so agent restarts don't lose track.
 *
 * When a switch expires, the agent starts a grace period instead of executing
 * immediately. During this window the user can reply to the Telegram warning
 * to reset the timer. If the grace period itself expires with no reply, the
 * switch executes.
 */
import * as fs from "fs";
import * as path from "path";

const STATE_FILE = path.join(__dirname, "grace-periods.json");

export interface GracePeriodEntry {
  startedAt: number;       // unix ms — when the warning was sent
  chatId: string | number; // Telegram chat to listen on
}

type GracePeriodState = Record<string, GracePeriodEntry>;

function load(): GracePeriodState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function save(state: GracePeriodState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function startGracePeriod(
  switchId: string | number | bigint,
  chatId: string | number
): void {
  const state = load();
  state[String(switchId)] = { startedAt: Date.now(), chatId };
  save(state);
}

export function getGracePeriod(
  switchId: string | number | bigint
): GracePeriodEntry | null {
  return load()[String(switchId)] ?? null;
}

export function clearGracePeriod(switchId: string | number | bigint): void {
  const state = load();
  delete state[String(switchId)];
  save(state);
}

export function isGraceExpired(
  entry: GracePeriodEntry,
  graceDurationMs: number
): boolean {
  return Date.now() - entry.startedAt >= graceDurationMs;
}
