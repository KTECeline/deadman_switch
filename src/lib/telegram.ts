// Change this to your actual Telegram bot username (without the @)
export const TELEGRAM_BOT_USERNAME = "DeadManSwitchBot";

// The deep link URL that opens a chat with your bot
export function getTelegramBotUrl(): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=connect`;
}
