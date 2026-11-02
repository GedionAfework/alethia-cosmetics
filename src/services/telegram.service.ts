import { botConfigured, getBotToken } from "@/lib/telegram/validate";

const API = "https://api.telegram.org";

export async function sendTelegramMessage(input: {
  chatId: string | number | bigint;
  text: string;
  replyMarkup?: object;
}) {
  if (!botConfigured()) {
    return { ok: false as const, error: "Bot token not configured" };
  }

  try {
    const res = await fetch(`${API}/bot${getBotToken()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: String(input.chatId),
        text: input.text,
        parse_mode: "HTML",
        reply_markup: input.replyMarkup,
      }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false as const, error: data.description || "Send failed" };
    return { ok: true as const, messageId: data.result?.message_id as number | undefined };
  } catch {
    return { ok: false as const, error: "Network error" };
  }
}

export function miniAppKeyboard(buttons: { text: string; path: string }[]) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").replace(/\/$/, "");
  return {
    inline_keyboard: buttons.map((b) => [
      { text: b.text, web_app: { url: `${appUrl}${b.path}` } },
    ]),
  };
}
