import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌  TELEGRAM_BOT_TOKEN not set in .env.local");
  process.exit(1);
}

async function main() {
  console.log("Fetching updates from your bot...\n");
  console.log("If no chats appear, send any message to your bot first, then re-run.\n");

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=10`);
  const data = (await res.json()) as any;

  if (!data.ok) {
    console.error("❌  Telegram API error:", data.description);
    process.exit(1);
  }

  if (!data.result?.length) {
    console.log("⚠️  No messages found. Send a message to your bot on Telegram, then run this again.");
    return;
  }

  const seen = new Set<number>();
  for (const update of data.result) {
    const chat = update.message?.chat;
    if (chat && !seen.has(chat.id)) {
      seen.add(chat.id);
      console.log(`✅  Chat found:`);
      console.log(`    Name:    ${chat.first_name ?? chat.title ?? "(unknown)"}`);
      console.log(`    Chat ID: ${chat.id}`);
      console.log(`\nAdd to .env.local:\n    TELEGRAM_CHAT_ID=${chat.id}\n`);
    }
  }
}

main().catch(console.error);
