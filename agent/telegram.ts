/**
 * Telegram bot client — warning + alive-signal detection.
 *
 * No npm package needed: uses the Telegram Bot HTTP API directly.
 * Long-polls getUpdates on each agent cycle; persists the last offset
 * to disk so replayed messages on restart aren't treated as new replies.
 *
 * Setup:
 *   1. Message @BotFather on Telegram → /newbot → copy token to TELEGRAM_BOT_TOKEN
 *   2. Start a chat with your bot → send any message
 *   3. Visit https://api.telegram.org/bot<TOKEN>/getUpdates → copy "chat"."id"
 *   4. Add both to .env.local as TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 */
import * as fs from "fs";
import * as path from "path";

const OFFSET_FILE = path.join(__dirname, "telegram-offset.json");

function apiUrl(method: string): string {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

function loadOffset(): number {
  try {
    return JSON.parse(fs.readFileSync(OFFSET_FILE, "utf-8")).offset ?? 0;
  } catch {
    return 0;
  }
}

function saveOffset(offset: number): void {
  fs.writeFileSync(OFFSET_FILE, JSON.stringify({ offset }));
}

export async function sendWarning(
  chatId: string | number,
  switchId: string | bigint,
  graceDays: number
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const text =
    `⚠️ *Dead Man's Switch — Warning*\n\n` +
    `Switch \\#${switchId} has been inactive and is scheduled to execute\\.\n\n` +
    `You have *${graceDays} day${graceDays === 1 ? "" : "s"}* to respond\\.\n\n` +
    `Reply with anything \\(e\\.g\\. "I'm alive"\\) to reset the timer\\.`;

  try {
    await fetch(apiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2" }),
    });
    console.log(`[telegram] ⚠️  Warning sent to chat ${chatId} for switch ${switchId}`);
  } catch (err: any) {
    console.error("[telegram] Failed to send warning:", err.message);
  }
}

export async function sendExecutionNotice(
  chatId: string | number,
  switchId: string | bigint,
  sig: string,
  lamports: bigint
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const sol = (Number(lamports) / 1e9).toFixed(4);
  const text =
    `🔴 *Dead Man's Switch Executed*\n\n` +
    `Switch \\#${switchId} — no response received within the grace period\\.\n\n` +
    `*${sol} SOL* transferred to beneficiary\\.\n` +
    `Tx: \`${sig}\``;

  try {
    await fetch(apiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2" }),
    });
    console.log(`[telegram] 🔴 Execution notice sent for switch ${switchId}`);
  } catch (err: any) {
    console.error("[telegram] Failed to send execution notice:", err.message);
  }
}

export async function sendResetConfirmation(
  chatId: string | number,
  switchId: string | bigint
): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  const text =
    `✅ *Timer Reset*\n\n` +
    `Got your message\\. Switch \\#${switchId} timer has been reset — you're good\\.`;

  try {
    await fetch(apiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2" }),
    });
  } catch (err: any) {
    console.error("[telegram] Failed to send reset confirmation:", err.message);
  }
}

/**
 * Polls for new Telegram messages since `sinceMs` (unix milliseconds).
 * Returns true if any message arrived — we treat ANY message as "I'm alive."
 */
export async function checkForAliveSignal(sinceMs: number): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return false;

  let offset = loadOffset();
  let found = false;

  try {
    const res = await fetch(`${apiUrl("getUpdates")}?offset=${offset}&limit=100&timeout=0`);
    const data = (await res.json()) as any;

    if (!data.ok || !data.result?.length) return false;

    for (const update of data.result) {
      offset = Math.max(offset, update.update_id + 1);
      const msgDate = (update.message?.date ?? 0) * 1000;
      if (msgDate >= sinceMs) {
        found = true;
        console.log(
          `[telegram] Alive signal received: "${update.message?.text ?? "(no text)"}" ` +
          `from ${update.message?.from?.username ?? update.message?.from?.id}`
        );
      }
    }

    saveOffset(offset);
  } catch (err: any) {
    console.error("[telegram] Failed to poll updates:", err.message);
  }

  return found;
}
