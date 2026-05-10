export const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "DeadManSwitchBot";

export function getTelegramBotUrl(): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=connect`;
}
